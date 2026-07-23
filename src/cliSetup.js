/**
 * CLI 配置模块
 * 负责注册所有命令和处理默认行为
 */

const fs = require('fs');
const { Command } = require('commander');
const chalk = require('chalk');
const { version } = require('../package.json');
const listToolsCommand = require('./commands/list-tools');
const initCommand = require('./commands/init');
const checkCommand = require('./commands/check');
const callMcpCommand = require('./commands/call-mcp');
const configCommand = require('./commands/config');
const idpCommand = require('./commands/idp');
const { updateTools } = require('./commands/update');
const configService = require('./services/configService');
const mcpService = require('./services/mcpService');
const {
  getServerToolsFromCache,
  getServerToolsFromCacheWithFallback,
  getCachedTools,
  getCachedToolsWithFallback
} = require('./utils/cacheUtils');
const { buildToolCommandExample, getArrayParamHint } = require('./utils/commandExample');

function getServerTools(serverName) {
  return getServerToolsFromCache(serverName);
}

function getMcpConfigError() {
  try {
    configService.getMcpConfig();
    return null;
  } catch (error) {
    return error;
  }
}

function printMcpConfigError(error) {
  if (error?.type === 'CONFIG_INVALID_BASE_URL') {
    console.error(chalk.red(`错误: ${error.message}`));
    if (error.suggestion) {
      console.log(chalk.yellow(`建议: ${error.suggestion}`));
    }
    return;
  }

  console.error(chalk.red('错误: 配置未初始化'));
  console.log(chalk.yellow('建议: 请先运行 qcc init --authorization "Bearer YOUR_API_KEY"'));
}

function buildFailureResults(failedItems = []) {
  return failedItems.reduce((acc, item) => {
    acc[item.server] = {
      error: item.error,
      errorType: item.errorType,
      suggestion: item.suggestion,
      httpStatus: item.httpStatus,
      serverCode: item.serverCode,
      serverMessage: item.serverMessage,
      requestUrl: item.requestUrl
    };
    return acc;
  }, {});
}

async function refreshToolsIfServiceCacheEmpty(serverName) {
  if (!mcpService.getServerByShortName(serverName)) {
    return { attempted: false, failed: false };
  }

  const cachedTools = getServerToolsFromCache(serverName);
  if (cachedTools.length > 0) {
    return { attempted: false, failed: false };
  }

  const results = await updateTools({ silent: true });
  const refreshedTools = getServerToolsFromCache(serverName);

  if (refreshedTools.length > 0) {
    return { attempted: true, failed: false };
  }

  const serverFailure = results.failed.find((item) => item.server === serverName);
  if (serverFailure) {
    console.log(chalk.red(`获取 ${serverName} 工具列表失败: ${serverFailure.error}`));
    if (serverFailure.suggestion) {
      console.log(chalk.yellow(`建议: ${serverFailure.suggestion}`));
    }
    return { attempted: true, failed: true };
  }

  const failureSummary = mcpService.getUpdateFailureSummary(buildFailureResults(results.failed));
  if (failureSummary?.message) {
    console.log(chalk.yellow(`建议: ${failureSummary.message}`));
  }

  return { attempted: true, failed: true };
}

function printToolUsageHints(serverName) {
  console.log(chalk.yellow(`\n使用 "qcc list-tools ${serverName}" 查看可用工具`));
  console.log(chalk.yellow('或运行 "qcc update" 更新工具列表'));
}

function getRootHelpText() {
  const shortServerNames = [...mcpService.getShortServerNames(), 'document'];
  const serviceList = shortServerNames.join(' / ');

  return `
查询调用:
  qcc <server> <tool> "<默认参数值>"
  qcc <server> <tool> --<参数名> "<参数值>" [--<参数名> "<参数值>" ...]
  qcc <server> <tool> --json --<参数名> "<参数值>"
  数组参数可传单个值；多个值请重复传入同一选项，例如 --role "原告" --role "被告"

常用命令:
  qcc list-tools
  qcc list-tools <server>
  qcc <server> <tool> --help
  qcc document parse_document --file_path "<path>" [--wait]
  qcc document parse_document --file_url "<http-url>" [--wait]
  qcc document get_parse_result "<task_id>"

服务标识:
  ${serviceList}

示例:
  qcc company get_company_registration_info "企查查科技股份有限公司"
  qcc company verify_company_accuracy --searchKey "企查查科技股份有限公司" --name "法定代表人姓名"
  qcc risk get_court_notice --searchKey "企查查科技股份有限公司" --role "原告" --role "被告" --notice_type "起诉状、上诉状副本" --year "2026"
  qcc document parse_document --file_path "./sample.pdf"
  qcc document parse_document --file_url "https://files.qcc.com/sample.pdf" --wait
  qcc document get_parse_result "qcc_task_id"
`;
}

function getSchemaType(propDef = {}) {
  const type = propDef.type;
  if (Array.isArray(type)) {
    return type.find((item) => item !== 'null');
  }
  return type;
}

function appendParamValue(params, key, value) {
  if (Object.prototype.hasOwnProperty.call(params, key)) {
    params[key] = Array.isArray(params[key])
      ? [...params[key], value]
      : [params[key], value];
    return;
  }

  params[key] = value;
}

function collectRepeatableOptionValue(value, previous) {
  const values = Array.isArray(previous)
    ? previous
    : previous === undefined
      ? []
      : [previous];

  return [...values, value];
}

function parseToolInvocationArgs(tool, argv = []) {
  const params = {};
  let json = false;
  let positionalArg;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token) {
      continue;
    }

    if (token === '--json') {
      json = true;
      continue;
    }

    if (token.startsWith('--')) {
      const equalsIndex = token.indexOf('=');
      if (equalsIndex > 2) {
        appendParamValue(params, token.slice(2, equalsIndex), token.slice(equalsIndex + 1));
        continue;
      }

      const key = token.slice(2);
      const nextToken = argv[i + 1];
      if (nextToken === undefined || nextToken.startsWith('--')) {
        appendParamValue(params, key, true);
      } else {
        appendParamValue(params, key, nextToken);
        i += 1;
      }
      continue;
    }

    if (positionalArg === undefined) {
      positionalArg = token;
    }
  }

  const props = tool.inputSchema?.properties || {};
  const required = tool.inputSchema?.required || [];
  const defaultParamKey = props.searchKey ? 'searchKey' : props.keyword ? 'keyword' : required[0];

  if (defaultParamKey && positionalArg !== undefined && !params[defaultParamKey]) {
    params[defaultParamKey] = positionalArg;
  }

  return { params, json };
}

function getCliOptionParamName(token) {
  if (!token || !token.startsWith('-')) {
    return null;
  }

  const normalized = token.startsWith('--') ? token.slice(2) : token.slice(1);
  const equalsIndex = normalized.indexOf('=');
  return equalsIndex >= 0 ? normalized.slice(0, equalsIndex) : normalized;
}

function getToolExampleParamsFromArgv(tool, argv = []) {
  const props = tool.inputSchema?.properties || {};
  const params = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const key = getCliOptionParamName(token);

    if (!key || key === 'json' || !Object.prototype.hasOwnProperty.call(props, key)) {
      continue;
    }

    const equalsIndex = token.indexOf('=');
    if (equalsIndex > 0) {
      appendParamValue(params, key, token.slice(equalsIndex + 1));
      continue;
    }

    const nextToken = argv[i + 1];
    appendParamValue(params, key, nextToken !== undefined && !nextToken.startsWith('-') ? nextToken : undefined);
  }

  return params;
}

function printToolCommandHelp(serverName, tool, userParams = {}) {
  const props = tool.inputSchema?.properties || {};
  const required = tool.inputSchema?.required || [];
  const example = buildToolCommandExample(serverName, tool.name, tool, userParams);
  const arrayHint = getArrayParamHint(tool, userParams);

  console.log(chalk.yellow('\n正确调用示例:'));
  console.log(chalk.gray(`  ${example}`));
  if (arrayHint) {
    console.log(chalk.gray(`  ${arrayHint}`));
  }

  console.log(chalk.yellow(`\n工具 ${tool.name} 参数说明:`));
  Object.entries(props).forEach(([key, value]) => {
    const isRequired = required.includes(key);
    const reqMark = isRequired ? '(必填)' : '(可选)';
    console.log(chalk.gray(`  --${key} ${reqMark} ${value.description || ''}`));
  });
}

function getToolCommandExampleHelpText(serverName, tool) {
  const example = buildToolCommandExample(serverName, tool.name, tool);
  const arrayHint = getArrayParamHint(tool);
  const lines = [
    '',
    '调用示例:',
    `  ${example}`
  ];

  if (arrayHint) {
    lines.push(`  ${arrayHint}`);
  }

  return `${lines.join('\n')}\n`;
}

function withStrictOptionValidation(command) {
  return command
    .allowUnknownOption(false)
    .configureOutput({
      writeErr: () => {}
    })
    .exitOverride((err) => {
      if (err.code === 'commander.unknownOption') {
        const option = err.message.match(/'([^']+)'/)?.[1] || err.message;
        console.error(chalk.red(`错误: 未知选项 ${option}`));
        console.log(chalk.yellow('\n建议: 使用 --help 查看参数说明'));
        process.exit(1);
      }

      if (err.code === 'commander.optionMissingArgument') {
        const option = err.message.match(/'([^']+)'/)?.[1] || '参数';
        console.error(chalk.red(`错误: 选项 ${option} 缺少值`));
        console.log(chalk.yellow('\n建议: 使用 --help 查看参数说明'));
        process.exit(1);
      }

      throw err;
    });
}

function registerStaticCommands(program) {
  withStrictOptionValidation(
    program
      .command('init')
      .description('初始化配置')
      .option('--mcpBaseUrl <url>', 'MCP 服务基础地址')
      .option('--authorization <token>', 'MCP Authorization Token')
      .action((options) => {
        return initCommand(options);
      })
  );

  withStrictOptionValidation(
    program
      .command('list-tools [serverName]')
      .description('显示 MCP 工具列表')
      .action((serverName) => {
        listToolsCommand.listTools(serverName);
      })
  );

  const idpCmd = withStrictOptionValidation(
    program
      .command('document')
      .description('文档解析任务提交与结果查询')
      .action(() => {
        idpCmd.outputHelp();
        process.exit(1);
      })
  );

  withStrictOptionValidation(
    idpCmd
      .command('parse_document')
      .description('提交本地文件路径或 HTTP(S) 文档 URL 创建解析任务')
      .option('--file_path <path>', '要解析的本地文件路径，可填写绝对路径或相对当前进程的路径；不要填写 URL、目录、通配符、base64、文件流或文件内容')
      .option('--file_url <url>', '要解析的文档 URL，必须以 http:// 或 https:// 开头；不要填写本地文件路径、base64、文件流、文件内容或已下载文件')
      .option('--wait', '是否尝试等待解析完成；默认 false；true 时若解析已完成会直接返回 details[].result_md，若仍在处理中则返回 processing')
      .action(async (options) => {
        await idpCommand.parseDocument(options);
      })
  );

  withStrictOptionValidation(
    idpCmd
      .command('get_parse_result <task_id>')
      .description('使用 parse_document 返回的 task_id 查询解析任务状态和结果')
      .action(async (taskId) => {
        await idpCommand.getParseResult(taskId);
      })
  );

  withStrictOptionValidation(
    program
      .command('update')
      .description('从 MCP 服务更新工具信息缓存')
      .action(async () => {
        await updateTools();
      })
  );

  withStrictOptionValidation(
    program
      .command('check')
      .description('检查配置状态')
      .action(() => {
        checkCommand();
      })
  );

  const configCmd = withStrictOptionValidation(
    program
      .command('config')
      .description('配置管理')
      .action(() => {
        configCommand.listConfig();
      })
  );

  configCmd
    .command('set <keyPath> <value>')
    .description('设置配置项')
    .action((keyPath, value) => {
      configCommand.setConfig(keyPath, value);
    });

  configCmd
    .command('get <keyPath>')
    .description('获取配置项')
    .action((keyPath) => {
      configCommand.getConfig(keyPath);
    });

  configCmd
    .command('list')
    .description('列出所有配置')
    .action(() => {
      configCommand.listConfig();
    });
}

function registerMcpCommands(program, useFallback = false, authFailed = false) {
  const shortServerNames = mcpService.getShortServerNames();
  const cache = useFallback ? getCachedToolsWithFallback() : getCachedTools();
  const getToolsFn = useFallback ? getServerToolsFromCacheWithFallback : getServerToolsFromCache;

  if (!configService.isMcpConfigValid()) {
    const configError = getMcpConfigError();
    const descriptionHint = configError?.type === 'CONFIG_INVALID_BASE_URL'
      ? 'MCP baseUrl 配置错误'
      : '请先运行 qcc init 初始化配置';

    shortServerNames.forEach((shortName) => {
      const serverConfig = mcpService.getServerByShortName(shortName);
      program
        .command(shortName)
        .description(`${serverConfig?.name || shortName} - ${descriptionHint}`)
        .action(() => {
          printMcpConfigError(configError);
          process.exit(1);
        })
        .on('command:*', () => {
          printMcpConfigError(configError);
          process.exit(1);
        });
    });
    return;
  }

  if (!cache || Object.keys(cache).length === 0) {
    shortServerNames.forEach((shortName) => {
      const serverConfig = mcpService.getServerByShortName(shortName);
      program
        .command(shortName)
        .description(`${serverConfig?.name || shortName}`)
        .action(() => {
          console.error(chalk.red('错误: 工具列表获取失败'));
          if (authFailed) {
            console.log(chalk.yellow('建议: 请检查 Authorization 是否正确，或运行 qcc init 更新配置'));
          } else {
            console.log(chalk.yellow('建议: 请检查网络连接，或稍后重试'));
          }
          process.exit(1);
        })
        .on('command:*', () => {
          console.error(chalk.red('错误: 工具列表获取失败'));
          if (authFailed) {
            console.log(chalk.yellow('建议: 请检查 Authorization 是否正确，或运行 qcc init 更新配置'));
          } else {
            console.log(chalk.yellow('建议: 请检查网络连接，或稍后重试'));
          }
          process.exit(1);
        });
    });
    return;
  }

  const hasValidTools = Object.values(cache).some((item) => item.tools && item.tools.length > 0);
  if (!hasValidTools) {
    shortServerNames.forEach((shortName) => {
      const serverConfig = mcpService.getServerByShortName(shortName);
      program
        .command(shortName)
        .description(`${serverConfig?.name || shortName}`)
        .action(() => {
          console.error(chalk.red('错误: 工具列表为空'));
          console.log(chalk.yellow('建议: 请检查身份凭证是否有效: qcc init --authorization "Bearer YOUR_API_KEY"'));
          process.exit(1);
        })
        .on('command:*', () => {
          console.error(chalk.red('错误: 工具列表为空'));
          console.log(chalk.yellow('建议: 请检查身份凭证是否有效: qcc init --authorization "Bearer YOUR_API_KEY"'));
          process.exit(1);
        });
    });
    return;
  }

  shortServerNames.forEach((shortName) => {
    const serverConfig = mcpService.getServerByShortName(shortName);
    if (!serverConfig) {
      return;
    }

    const serverCmd = program
      .command(shortName)
      .description(`${serverConfig.name} - ${serverConfig.description}`)
      .action(async () => {
        const refreshState = await refreshToolsIfServiceCacheEmpty(shortName);
        if (refreshState.failed) {
          process.exit(1);
        }

        const refreshedTools = getServerToolsFromCache(shortName);
        const requestedToolName = process.argv[3];

        if (requestedToolName && !requestedToolName.startsWith('-')) {
          const matchedTool = refreshedTools.find((tool) => tool.name === requestedToolName);
          if (matchedTool) {
            const invocation = parseToolInvocationArgs(matchedTool, process.argv.slice(4));
            await callMcpCommand(shortName, matchedTool.name, invocation.params, { json: invocation.json });
            return;
          }
        }

        console.error(chalk.red('错误: 请指定要使用的工具'));
        printToolUsageHints(shortName);
        if (refreshedTools.length > 0) {
          console.log('\n可用工具:');
          refreshedTools.slice(0, 10).forEach((tool) => {
            console.log(`  ${tool.name}`);
          });
          if (refreshedTools.length > 10) {
            console.log(`  ... 共 ${refreshedTools.length} 个工具`);
          }
        }
        process.exit(1);
      })
      .on('command:*', async (operands) => {
        const refreshState = await refreshToolsIfServiceCacheEmpty(shortName);
        if (refreshState.failed) {
          process.exit(1);
        }

        const tools = getServerToolsFromCache(shortName);
        const tool = tools.find((item) => item.name === operands[0]);
        if (tool) {
          const invocation = parseToolInvocationArgs(tool, process.argv.slice(4));
          await callMcpCommand(shortName, tool.name, invocation.params, { json: invocation.json });
          return;
        }

        console.error(chalk.red(`错误: 服务 "${shortName}" 中未找到工具 "${operands[0]}"`));
        printToolUsageHints(shortName);
        if (tools.length > 0) {
          console.log('\n可用工具:');
          tools.slice(0, 10).forEach((item) => {
            console.log(`  ${item.name}`);
          });
          if (tools.length > 10) {
            console.log(`  ... 共 ${tools.length} 个工具`);
          }
        }
        process.exit(1);
      });

    const tools = getToolsFn(shortName);
    tools.forEach((tool) => {
      const toolCmd = serverCmd
        .command(tool.name)
        .description(tool.description || '')
        .addHelpText('after', () => getToolCommandExampleHelpText(shortName, tool))
        .configureOutput({
          writeErr: () => {}
        })
        .exitOverride((err) => {
          if (err.code === 'commander.unknownOption') {
            const option = err.message.match(/'([^']+)'/)?.[1] || err.message;
            console.error(chalk.red(`错误: 未知选项 ${option}`));
            const userParams = getToolExampleParamsFromArgv(tool, process.argv.slice(4));
            printToolCommandHelp(shortName, tool, userParams);
            process.exit(1);
          }

          if (err.code === 'commander.optionMissingArgument') {
            const option = err.message.match(/'([^']+)'/)?.[1] || '参数';
            console.error(chalk.red(`错误: 选项 ${option} 缺少值`));
            const userParams = getToolExampleParamsFromArgv(tool, process.argv.slice(4));
            printToolCommandHelp(shortName, tool, userParams);
            process.exit(1);
          }

          throw err;
        });

      toolCmd.option('--json', '输出原始 JSON 格式');

      const props = tool.inputSchema?.properties || {};
      const required = tool.inputSchema?.required || [];
      Object.entries(props).forEach(([key, value]) => {
        const isRequired = required.includes(key);
        const flag = isRequired ? `--${key} <value>` : `--${key} [value]`;
        const desc = isRequired
          ? `${value.description || ''} (必填)`
          : `${value.description || ''} (可选)`;
        if (getSchemaType(value) === 'array') {
          toolCmd.option(flag, desc, collectRepeatableOptionValue);
        } else {
          toolCmd.option(flag, desc);
        }
      });

      const defaultParamKey = props.searchKey ? 'searchKey' : props.keyword ? 'keyword' : required[0];
      if (defaultParamKey) {
        toolCmd.argument('[defaultValue]', `默认参数，映射到 --${defaultParamKey}`);
      }

      toolCmd.action(async (...actionArgs) => {
        const command = actionArgs[actionArgs.length - 1];
        const defaultValue = defaultParamKey ? actionArgs[0] : undefined;
        const { json, ...params } = command.opts();

        if (defaultParamKey && defaultValue !== undefined && !params[defaultParamKey]) {
          params[defaultParamKey] = defaultValue;
        }

        await callMcpCommand(shortName, tool.name, params, { json });
      });
    });
  });
}

function registerDefaultHandler(program, argv = process.argv.slice(2)) {
  const shortServerNames = mcpService.getShortServerNames();

  program
    .argument('[serviceToolArgs...]')
    .action(async (serviceToolArgs = []) => {
      const invocationArgs = argv.length > serviceToolArgs.length ? argv : serviceToolArgs;
      const [arg1, arg2, ...toolArgs] = invocationArgs;

      const serverConfig = mcpService.getServerByShortName(arg1);

      if (serverConfig) {
        if (!arg2) {
          listToolsCommand.listTools(arg1);
          return;
        }

        const refreshState = await refreshToolsIfServiceCacheEmpty(arg1);
        if (refreshState.failed) {
          process.exit(1);
        }

        const tools = getServerToolsFromCache(arg1);
        const tool = tools.find((item) => item.name === arg2);

        if (!tool) {
          console.error(chalk.red(`错误: 服务 ${arg1} 中未找到工具 ${arg2}`));
          printToolUsageHints(arg1);
          process.exit(1);
        }

        const props = tool.inputSchema?.properties || {};
        const required = tool.inputSchema?.required || [];
        const defaultParamKey = props.searchKey ? 'searchKey' : props.keyword ? 'keyword' : required[0];

        if (toolArgs.length > 0) {
          const invocation = parseToolInvocationArgs(tool, toolArgs);
          await callMcpCommand(arg1, arg2, invocation.params, { json: invocation.json });
          return;
        }

        console.error(chalk.red('错误: 请提供工具参数'));
        console.log(chalk.yellow(`\n建议用法: qcc ${arg1} ${arg2} "<默认参数值>"`));
        console.log(chalk.yellow(`          qcc ${arg1} ${arg2} --<参数名> "<参数值>" [--<参数名> "<参数值>" ...]`));
        console.log('\n参数说明:');
        Object.entries(props).forEach(([key, value]) => {
          const req = required.includes(key) ? '(必填)' : '(可选)';
          const isDefault = key === defaultParamKey ? ' [默认]' : '';
          console.log(`  --${key} ${req}${isDefault} ${value.description || ''}`);
        });
        process.exit(1);
      }

      if (arg1) {
        console.error(chalk.red(`错误: 未知命令或服务 ${arg1}`));
        console.log(chalk.yellow('\n可用命令:'));
        console.log('  qcc init          初始化配置');
        console.log('  qcc list-tools    显示 MCP 工具列表');
        console.log('  qcc update        更新工具信息缓存');
        console.log('  qcc config        配置管理');
        console.log('  qcc document           文档解析任务提交与结果查询');
        console.log('\nMCP 服务:');
        shortServerNames.forEach((name) => {
          const cfg = mcpService.getServerByShortName(name);
          console.log(`  ${name.padEnd(12)} ${cfg?.name || ''}`);
        });
        process.exit(1);
      }

      program.help();
    });
}

function handleInvalidToolInvocation(argv = [], useFallback = false) {
  const [serverName, toolName] = argv;

  if (!serverName || !toolName || toolName.startsWith('-')) {
    return;
  }

  const serverConfig = mcpService.getServerByShortName(serverName);
  if (!serverConfig) {
    return;
  }

  const getToolsFn = useFallback ? getServerToolsFromCacheWithFallback : getServerToolsFromCache;
  const tools = getToolsFn(serverName);

  if (tools.length === 0) {
    return;
  }

  const toolExists = tools.some((tool) => tool.name === toolName);
  if (toolExists) {
    return;
  }

  console.error(chalk.red(`错误: 服务 "${serverName}" 中未找到工具 "${toolName}"`));
  printToolUsageHints(serverName);

  console.log('\n可用工具:');
  tools.slice(0, 10).forEach((tool) => {
    console.log(`  ${tool.name}`);
  });
  if (tools.length > 10) {
    console.log(`  ... 共 ${tools.length} 个工具`);
  }

  process.exit(1);
}

function shouldSkipBootstrapCacheRefresh(argv = []) {
  const [command] = argv;
  return !command || ['init', 'document', '--help', '-h', '--version', '-V'].includes(command);
}

function getRequestedServiceForInvocation(argv = []) {
  const [serverName, toolName] = argv;
  if (!serverName || !toolName || toolName.startsWith('-')) {
    return null;
  }

  if (!mcpService.getServerByShortName(serverName)) {
    return null;
  }

  return serverName;
}

function isConfigExemptCommand(argv = []) {
  const [command] = argv;
  return !command || ['init', 'config', 'document', '--help', '-h', '--version', '-V'].includes(command);
}

function showMissingConfigInitMessage() {
  console.error(chalk.red('错误: 配置文件不存在，运行 qcc init 进行初始化'));
}

async function createProgram(argv = process.argv.slice(2)) {
  const program = new Command();

  program
    .name('qcc')
    .description('企业信息查询 CLI 工具')
    .usage('[options] [command|service] [tool] [args...]')
    .version(version)
    .allowUnknownOption(true)
    .addHelpText('after', getRootHelpText);

  const configIntegrity = configService.checkConfigIntegrity();
  if (!configIntegrity.exists && !isConfigExemptCommand(argv)) {
    showMissingConfigInitMessage();
    process.exit(1);
  }

  if (!configService.isMcpConfigValid()) {
    registerStaticCommands(program);
    registerMcpCommands(program);
    registerDefaultHandler(program, argv);
    setupGlobalErrorHandler(program);
    return program;
  }

  let useFallback = false;
  let authFailed = false;
  const cachePath = configService.getToolsCachePath();
  const cacheExists = fs.existsSync(cachePath);

  if (!shouldSkipBootstrapCacheRefresh(argv) && (!cacheExists || configService.isToolsCacheExpired())) {
    console.log(chalk.gray('工具缓存不存在或已过期，正在从服务器更新...'));
    try {
      const success = await mcpService.ensureToolsCache();
      if (success) {
        console.log(chalk.green('✓ 缓存更新完成。\n'));
      } else {
        useFallback = true;
        const failureSummary = mcpService.getLastUpdateFailureSummary();
        console.log(chalk.yellow('缓存更新失败，将使用已有缓存。'));
        if (failureSummary?.message) {
          console.log(chalk.yellow(`建议: ${failureSummary.message}\n`));
        } else {
          console.log('');
        }
      }
    } catch (error) {
      if (error.type === 'AUTH_FAILED') {
        authFailed = true;
        console.log(chalk.red('缓存更新失败: 凭证不正确'));
        console.log(chalk.yellow('建议: 请检查 Authorization 是否正确，或运行 qcc init 更新配置\n'));
        console.error(chalk.red('错误: 工具列表获取失败'));
        console.log(chalk.yellow('请检查 Authorization 是否正确，或运行 qcc init 更新配置'));
        process.exit(1);
      }

      useFallback = true;
      const failureSummary = mcpService.getFailureSummaryFromError(error);
      console.log(chalk.yellow(`缓存更新失败: ${error.message}`));
      if (failureSummary?.message) {
        console.log(chalk.yellow(`建议: ${failureSummary.message}`));
      }
      console.log(chalk.yellow('将使用已有缓存。\n'));
    }
  }

  const requestedService = getRequestedServiceForInvocation(argv);
  if (requestedService) {
    const refreshState = await refreshToolsIfServiceCacheEmpty(requestedService);
    if (refreshState.failed) {
      process.exit(1);
    }
  }

  registerStaticCommands(program);
  registerMcpCommands(program, useFallback, authFailed);
  registerDefaultHandler(program, argv);
  setupGlobalErrorHandler(program);
  handleInvalidToolInvocation(argv, useFallback);

  return program;
}

function setupGlobalErrorHandler(program) {
  program.on('command:*', (operands) => {
    const unknownCmd = operands[0];
    console.error(chalk.red(`错误: 未知命令或服务 "${unknownCmd}"`));
    console.log(chalk.yellow('\n可用命令:'));
    console.log('  qcc init          初始化配置');
    console.log('  qcc list-tools    显示 MCP 工具列表');
    console.log('  qcc update        更新工具信息缓存');
    console.log('  qcc check         检查配置状态');
    console.log('  qcc config        配置管理');
    console.log('  qcc document           文档解析任务提交与结果查询');
    console.log('\nMCP 服务:');
    const shortServerNames = mcpService.getShortServerNames();
    shortServerNames.forEach((name) => {
      const cfg = mcpService.getServerByShortName(name);
      console.log(`  ${name.padEnd(12)} ${cfg?.name || ''}`);
    });
    console.log(chalk.yellow('\n建议: 使用 "qcc --help" 查看更多帮助'));
    process.exit(1);
  });
}

module.exports = {
  createProgram,
  registerStaticCommands,
  registerMcpCommands,
  registerDefaultHandler,
  handleInvalidToolInvocation,
  getServerTools,
  shouldSkipBootstrapCacheRefresh
};
