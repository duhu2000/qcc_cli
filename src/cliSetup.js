/**
 * CLI 配置模块
 * 负责注册所有命令和处理默认行为
 */

const fs = require('fs');
const { Command, Help } = require('commander');
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

const ROOT_HELP_SERVICE_GROUPS = [
  {
    title: '企业数据',
    serverNames: ['company', 'risk', 'operation', 'ipr', 'history', 'executive']
  },
  {
    title: '法律数据',
    serverNames: ['regulation', 'case']
  },
  {
    title: '标讯数据',
    serverNames: ['tender']
  }
];

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

function formatHelpEntries(entries) {
  const width = Math.max(14, Math.max(...entries.map(({ term }) => term.length)) + 4);
  return entries.map(({ term, description }) => `  ${term.padEnd(width)}${description}`);
}

function getRootHelpCommand(program, name) {
  return program.commands.find((command) => command.name() === name);
}

function getServiceHelpSections(program) {
  const groupedServerNames = new Set(
    ROOT_HELP_SERVICE_GROUPS.flatMap(({ serverNames }) => serverNames)
  );
  const ungroupedServerNames = mcpService.getShortServerNames()
    .filter((name) => !groupedServerNames.has(name));
  const groups = ungroupedServerNames.length > 0
    ? [...ROOT_HELP_SERVICE_GROUPS, { title: '其他数据', serverNames: ungroupedServerNames }]
    : ROOT_HELP_SERVICE_GROUPS;

  return groups.flatMap(({ title, serverNames }) => {
    const entries = serverNames
      .filter((name) => getRootHelpCommand(program, name))
      .map((name) => ({
        term: name,
        description: mcpService.getServerByShortName(name)?.name || name
      }));

    return entries.length > 0 ? [`${title}:`, ...formatHelpEntries(entries), ''] : [];
  });
}

function getManagementHelpSection(program, title, commandSpecs) {
  const entries = commandSpecs.flatMap(({ name, term }) => {
    const command = getRootHelpCommand(program, name);
    return command ? [{ term, description: command.description() }] : [];
  });

  return [`${title}:`, ...formatHelpEntries(entries), ''];
}

function formatRootHelp(program) {
  return [
    '企查查智能体数据平台 CLI',
    '',
    'Usage:',
    '  qcc <server> <tool> [参数...]',
    '  qcc <command> [参数...]',
    '  qcc [options]',
    '',
    '首次使用:',
    '',
    '  # 绑定 API Key（一次性操作）',
    '  qcc init --authorization "Bearer YOUR_API_KEY"',
    '',
    ...getServiceHelpSections(program),
    '智能文档解析:',
    ...formatHelpEntries([{
      term: 'document',
      description: getRootHelpCommand(program, 'document')?.description() || '文档解析任务提交与结果查询'
    }]),
    '',
    ...getManagementHelpSection(program, '工具管理', [
      { name: 'list-tools', term: 'list-tools [server]' },
      { name: 'update', term: 'update' }
    ]),
    ...getManagementHelpSection(program, '配置与诊断', [
      { name: 'init', term: 'init [options]' },
      { name: 'check', term: 'check' },
      { name: 'config', term: 'config' }
    ]),
    '调用格式:',
    '  qcc <server> <tool> "<默认参数值>"',
    '  qcc <server> <tool> --<参数名> "<参数值>" [--<参数名> "<参数值>" ...]',
    '  qcc <server> <tool> --json --<参数名> "<参数值>"',
    '',
    '参数说明:',
    '  仅传一个业务参数时，默认参数自动映射到工具的主要查询参数。',
    '  多参数调用必须显式指定所有参数名，不支持默认参数与命名参数混用。',
    '  数组参数可传单个值；多个值请重复传入同一选项。',
    '  通用 MCP 工具可追加 --json 输出原始 JSON。',
    '',
    '数据查询示例:',
    '',
    '  # 查询企业工商登记信息',
    '  qcc company get_company_registration_info "企查查科技股份有限公司"',
    '',
    '  # 法律法规 · 法规检索',
    '  qcc regulation get_legal_regulation_search "数据出境"',
    '',
    '  # 司法案例 · 类案检索',
    '  qcc case get_judicial_case_search "卖方违约的买卖合同纠纷判决"',
    '',
    '  # 标讯数据 · 招投标搜索',
    '  qcc tender search_tenders "智慧工地"',
    '',
    '  # 智能文档解析 · 本机文件或在线链接',
    '  qcc document parse_document --file_path "./财报.pdf"',
    '  qcc document parse_document --file_url "https://example.com/财报.pdf"',
    '',
    '  # 长文档异步 · 按任务编号查询结果',
    '  qcc document get_parse_result "TASK_ID"',
    '',
    '获取更多帮助:',
    '  qcc list-tools',
    '  qcc list-tools <server>',
    '  qcc <server> <tool> --help',
    '  qcc document --help',
    '',
    'Options:',
    '  -V, --version    显示版本号',
    '  -h, --help       显示帮助信息',
    ''
  ].join('\n');
}

function formatCliHelp(command, helper) {
  if (command.parent) {
    return Help.prototype.formatHelp.call(helper, command, helper);
  }
  return formatRootHelp(command);
}

function getSchemaType(propDef = {}) {
  const type = propDef.type;
  if (Array.isArray(type)) {
    return type.find((item) => item !== 'null');
  }
  return type;
}

function getDefaultParamKey(tool) {
  const props = tool.inputSchema?.properties || {};
  const required = tool.inputSchema?.required || [];

  if (props.searchKey) {
    return 'searchKey';
  }
  if (props.keyword) {
    return 'keyword';
  }
  if (props.keywords) {
    return 'keywords';
  }
  return required[0];
}

function applyDefaultParam(tool, params, defaultValue) {
  const defaultParamKey = getDefaultParamKey(tool);
  if (
    !defaultParamKey
    || defaultValue === undefined
    || Object.prototype.hasOwnProperty.call(params, defaultParamKey)
  ) {
    return defaultParamKey;
  }

  const propDef = tool.inputSchema?.properties?.[defaultParamKey] || {};
  params[defaultParamKey] = getSchemaType(propDef) === 'array' && !Array.isArray(defaultValue)
    ? [defaultValue]
    : defaultValue;
  return defaultParamKey;
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

function printDefaultParamUsageError(serverName, toolName) {
  console.error(chalk.red('错误: 默认参数简写仅支持单个业务参数'));
  console.log(chalk.yellow('建议: 多参数调用请显式指定所有参数名'));
  console.log(chalk.gray(`  qcc ${serverName} ${toolName} --help`));
  process.exit(1);
}

function validateDefaultParamUsage(serverName, toolName, params, positionalArgs) {
  const hasMultiplePositionalArgs = positionalArgs.length > 1;
  const mixesDefaultAndNamedParams = positionalArgs.length > 0 && Object.keys(params).length > 0;

  if (!hasMultiplePositionalArgs && !mixesDefaultAndNamedParams) {
    return true;
  }

  printDefaultParamUsageError(serverName, toolName);
  return false;
}

function parseToolInvocationArgs(serverName, tool, argv = []) {
  const params = {};
  let json = false;
  const positionalArgs = [];

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

    positionalArgs.push(token);
  }

  if (!validateDefaultParamUsage(serverName, tool.name, params, positionalArgs)) {
    return { params, json };
  }

  applyDefaultParam(tool, params, positionalArgs[0]);

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
      .description('初始化连接配置')
      .option('--mcpBaseUrl <url>', 'MCP 服务基础地址')
      .option('--authorization <token>', 'MCP Authorization Token')
      .action((options) => {
        return initCommand(options);
      })
  );

  withStrictOptionValidation(
    program
      .command('list-tools [serverName]')
      .description('显示服务或工具列表')
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
      .description('更新 MCP 工具定义缓存')
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
      .description('查看或修改配置')
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
            const invocation = parseToolInvocationArgs(shortName, matchedTool, process.argv.slice(4));
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
          const invocation = parseToolInvocationArgs(shortName, tool, process.argv.slice(4));
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
        .allowExcessArguments(false)
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

          if (err.code === 'commander.excessArguments') {
            printDefaultParamUsageError(shortName, tool.name);
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

      const defaultParamKey = getDefaultParamKey(tool);
      if (defaultParamKey) {
        toolCmd.argument('[defaultValue]', `默认参数，映射到 --${defaultParamKey}`);
      }

      toolCmd.action(async (...actionArgs) => {
        const command = actionArgs[actionArgs.length - 1];
        const defaultValue = defaultParamKey ? actionArgs[0] : undefined;
        const { json, ...params } = command.opts();

        const positionalArgs = defaultValue === undefined ? [] : [defaultValue];
        if (!validateDefaultParamUsage(shortName, tool.name, params, positionalArgs)) {
          return;
        }

        applyDefaultParam(tool, params, defaultValue);

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
        const defaultParamKey = getDefaultParamKey(tool);

        if (toolArgs.length > 0) {
          const invocation = parseToolInvocationArgs(arg1, tool, toolArgs);
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

function orderPublicCommands(program) {
  const publicServiceNames = [...mcpService.getShortServerNames(), 'document'];
  const publicServiceNameSet = new Set(publicServiceNames);
  const commandsByName = new Map(program.commands.map((command) => [command.name(), command]));

  program.commands = [
    ...program.commands.filter((command) => !publicServiceNameSet.has(command.name())),
    ...publicServiceNames.map((name) => commandsByName.get(name)).filter(Boolean)
  ];
}

async function createProgram(argv = process.argv.slice(2)) {
  const program = new Command();

  program
    .name('qcc')
    .description('企查查智能体数据平台 CLI')
    .usage('[options] [command|service] [tool] [args...]')
    .version(version, '-V, --version', '显示版本号')
    .helpOption('-h, --help', '显示帮助信息')
    .allowUnknownOption(true)
    .configureHelp({ formatHelp: formatCliHelp });

  const configIntegrity = configService.checkConfigIntegrity();
  if (!configIntegrity.exists && !isConfigExemptCommand(argv)) {
    showMissingConfigInitMessage();
    process.exit(1);
  }

  if (!configService.isMcpConfigValid()) {
    registerStaticCommands(program);
    registerMcpCommands(program);
    orderPublicCommands(program);
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
  orderPublicCommands(program);
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
  orderPublicCommands,
  shouldSkipBootstrapCacheRefresh
};
