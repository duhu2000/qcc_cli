/**
 * CLI 设置模块
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
const { updateTools } = require('./commands/update');
const configService = require('./services/configService');
const mcpService = require('./services/mcpService');
const { getServerToolsFromCache, getServerToolsFromCacheWithFallback, getCachedTools, getCachedToolsWithFallback } = require('./utils/cacheUtils');

/**
 * 获取服务器的工具列表（从缓存获取）
 * @param {string} serverName - 服务器名称
 * @returns {Array} 工具列表
 */
function getServerTools(serverName) {
  return getServerToolsFromCache(serverName);
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
        console.error(`错误: 未知选项 ${option}`);
        console.log('\n使用 --help 查看参数说明');
        process.exit(1);
      }

      if (err.code === 'commander.optionMissingArgument') {
        const option = err.message.match(/'([^']+)'/)?.[1] || '参数';
        console.error(`错误: 选项 ${option} 缺少值`);
        console.log('\n使用 --help 查看参数说明');
        process.exit(1);
      }

      throw err;
    });
}

/**
 * 注册静态命令（init, list-tools, update, check, config）
 * @param {Command} program - Commander 程序实例
 */
function registerStaticCommands(program) {
  // init 子命令
  withStrictOptionValidation(program
    .command('init')
    .description('初始化配置')
    .option('--mcpBaseUrl <url>', 'MCP 服务基础地址')
    .option('--authorization <token>', 'MCP Authorization Token')
    .action((options) => {
      initCommand(options);
    }));

  // list-tools 子命令
  withStrictOptionValidation(program
    .command('list-tools [serverName]')
    .description('显示 MCP 工具列表')
    .action((serverName) => {
      listToolsCommand.listTools(serverName);
    }));

  // update 子命令
  withStrictOptionValidation(program
    .command('update')
    .description('从 MCP 服务更新工具信息缓存')
    .action(async () => {
      await updateTools();
    }));

  // check 子命令
  withStrictOptionValidation(program
    .command('check')
    .description('检查配置状态')
    .action(() => {
      checkCommand();
    }));

  // config 子命令
  const configCmd = withStrictOptionValidation(program
    .command('config')
    .description('配置管理')
    .action(() => {
      // 不带子命令时默认列出所有配置
      configCommand.listConfig();
    }));

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

/**
 * 注册 MCP 服务器命令
 * @param {Command} program - Commander 程序实例
 * @param {boolean} useFallback - 是否使用降级缓存（刷新失败时）
 * @param {boolean} authFailed - 是否因为认证失败
 */
function registerMcpCommands(program, useFallback = false, authFailed = false) {
  const shortServerNames = mcpService.getShortServerNames();
  // 使用降级缓存或正常缓存
  const cache = useFallback ? getCachedToolsWithFallback() : getCachedTools();
  const getToolsFn = useFallback ? getServerToolsFromCacheWithFallback : getServerToolsFromCache;

  // 场景1: 配置无效时提示初始化
  if (!configService.isMcpConfigValid()) {
    shortServerNames.forEach((shortName) => {
      const serverConfig = mcpService.getServerByShortName(shortName);
      program
        .command(shortName)
        .description(`${serverConfig?.name || shortName} - 请先运行 qcc init 初始化配置`)
        .action(() => {
          console.error('错误: 配置未初始化');
          console.log('请先运行: qcc init --authorization "Bearer YOUR_API_KEY"');
          process.exit(1);
        })
        .on('command:*', () => {
          console.error('错误: 配置未初始化');
          console.log('请先运行: qcc init --authorization "Bearer YOUR_API_KEY"');
          process.exit(1);
        });
    });
    return;
  }

  // 场景2: 配置有效但无缓存（包括降级缓存也没有）
  if (!cache || Object.keys(cache).length === 0) {
    shortServerNames.forEach((shortName) => {
      const serverConfig = mcpService.getServerByShortName(shortName);
      program
        .command(shortName)
        .description(`${serverConfig?.name || shortName}`)
        .action(() => {
          console.error('错误: 工具列表获取失败');
          if (authFailed) {
            console.log('请检查 Authorization 是否正确，或运行 qcc init 更新配置');
          } else {
            console.log('请检查网络连接后重试: qcc update');
          }
          process.exit(1);
        })
        .on('command:*', () => {
          console.error('错误: 工具列表获取失败');
          if (authFailed) {
            console.log('请检查 Authorization 是否正确，或运行 qcc init 更新配置');
          } else {
            console.log('请检查网络连接后重试: qcc update');
          }
          process.exit(1);
        });
    });
    return;
  }

  // 检查缓存中是否有有效的工具数据
  const hasValidTools = Object.values(cache).some(
    (r) => r.tools && r.tools.length > 0
  );

  if (!hasValidTools) {
    // 缓存中没有有效工具（可能是之前的失败缓存）
    shortServerNames.forEach((shortName) => {
      const serverConfig = mcpService.getServerByShortName(shortName);
      program
        .command(shortName)
        .description(`${serverConfig?.name || shortName}`)
        .action(() => {
          console.error('错误: 工具列表为空');
          console.log('请检查身份凭证是否有效: qcc init --authorization "Bearer YOUR_API_KEY"');
          process.exit(1);
        })
        .on('command:*', () => {
          console.error('错误: 工具列表为空');
          console.log('请检查身份凭证是否有效: qcc init --authorization "Bearer YOUR_API_KEY"');
          process.exit(1);
        });
    });
    return;
  }

  // 场景3: 正常注册命令（有缓存）
  shortServerNames.forEach((shortName) => {
    const serverConfig = mcpService.getServerByShortName(shortName);
    if (!serverConfig) return;

    const serverCmd = program
      .command(shortName)
      .description(`${serverConfig.name} - ${serverConfig.description}`)
      .action(() => {
        // 不带工具名时，提示用户指定工具
        console.error(`错误: 请指定要使用的工具`);
        console.log(`\n使用 "qcc list-tools ${shortName}" 查看可用工具`);
        console.log(`或运行 "qcc update" 更新工具列表`);
        const tools = getToolsFn(shortName);
        if (tools.length > 0) {
          console.log('\n可用工具:');
          tools.slice(0, 10).forEach(t => {
            console.log(`  ${t.name}`);
          });
          if (tools.length > 10) {
            console.log(`  ... 共 ${tools.length} 个工具`);
          }
        }
        process.exit(1);
      })
      .on('command:*', (operands) => {
        // 捕获无效工具名
        console.error(`错误: 服务 "${shortName}" 中未找到工具 "${operands[0]}"`);
        console.log(`\n使用 "qcc list-tools ${shortName}" 查看可用工具`);
        console.log(`或运行 "qcc update" 更新工具列表`);
        const tools = getToolsFn(shortName);
        if (tools.length > 0) {
          console.log('\n可用工具:');
          tools.slice(0, 10).forEach(t => {
            console.log(`  ${t.name}`);
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
        .configureOutput({
          writeErr: () => {} // 抑制 Commander 默认错误输出
        })
        .exitOverride((err) => {
          // 处理未知选项错误
          if (err.code === 'commander.unknownOption') {
            const option = err.message.match(/'([^']+)'/)?.[1] || err.message;
            console.error(`错误: 未知选项 ${option}`);
            console.log(`\n工具 ${tool.name} 参数说明:`);
            const toolProps = tool.inputSchema?.properties || {};
            const toolRequired = tool.inputSchema?.required || [];
            Object.entries(toolProps).forEach(([key, value]) => {
              const isRequired = toolRequired.includes(key);
              const reqMark = isRequired ? '(必填)' : '(可选)';
              console.log(`  --${key} ${reqMark} ${value.description || ''}`);
            });
            process.exit(1);
          }
          // 处理缺少参数值错误
          if (err.code === 'commander.optionMissingArgument') {
            const option = err.message.match(/'([^']+)'/)?.[1] || '参数';
            console.error(`错误: 选项 ${option} 缺少值`);
            console.log('\n使用 --help 查看参数说明');
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
        toolCmd.option(flag, desc);
      });

      const defaultParamKey = props.searchKey ? 'searchKey' : required[0];
      if (defaultParamKey) {
        toolCmd.argument('[positionalArg]', `默认参数（映射到 --${defaultParamKey}）`);
      }

      toolCmd.action(async (positionalArg, options) => {
        const { json, ...params } = options;

        if (defaultParamKey && positionalArg !== undefined && !params[defaultParamKey]) {
          params[defaultParamKey] = positionalArg;
        }

        await callMcpCommand(shortName, tool.name, params, { json });
      });
    });
  });
}

/**
 * 注册默认行为处理器
 * @param {Command} program - Commander 程序实例
 * @param {boolean} useFallback - 是否使用降级缓存
 */
function registerDefaultHandler(program, useFallback = false) {
  const shortServerNames = mcpService.getShortServerNames();
  const getToolsFn = useFallback ? getServerToolsFromCacheWithFallback : getServerToolsFromCache;

  program
    .argument('[arg1]')
    .argument('[arg2]')
    .argument('[positionalArg]', '搜索关键词')
    .action(async (arg1, arg2, positionalArg) => {
      // 如果 arg1 是 MCP 服务器名（简短名）
      const serverConfig = mcpService.getServerByShortName(arg1);

      if (serverConfig) {
        if (!arg2) {
          listToolsCommand.listTools(arg1);
          return;
        }

        const tools = getToolsFn(arg1);
        const tool = tools.find(t => t.name === arg2);

        if (!tool) {
          console.error(`错误：服务 ${arg1} 中未找到工具 ${arg2}`);
          console.log(`使用 "qcc list-tools ${arg1}" 查看可用工具`);
          console.log(`或运行 "qcc update" 更新工具列表`);
          process.exit(1);
        }

        const props = tool.inputSchema?.properties || {};
        const required = tool.inputSchema?.required || [];
        const defaultParamKey = props.searchKey ? 'searchKey' : required[0];

        if (positionalArg) {
          const params = defaultParamKey ? { [defaultParamKey]: positionalArg } : {};
          await callMcpCommand(arg1, arg2, params, {});
          return;
        }

        console.error(`错误：请提供工具参数`);
        console.log(`\n用法: qcc ${arg1} ${arg2} <参数值>`);
        console.log(`      qcc ${arg1} ${arg2} --<参数名> <参数值>`);
        console.log('\n参数说明:');
        Object.entries(props).forEach(([key, value]) => {
          const req = required.includes(key) ? '(必填)' : '(可选)';
          const isDefault = key === defaultParamKey ? ' [默认]' : '';
          console.log(`  --${key} ${req}${isDefault} ${value.description || ''}`);
        });
        process.exit(1);
      }

      // 未知命令
      if (arg1) {
        console.error(`错误：未知命令或服务 ${arg1}`);
        console.log('\n可用命令:');
        console.log('  qcc init          初始化配置');
        console.log('  qcc list-tools    显示 MCP 工具列表');
        console.log('  qcc update        更新工具信息缓存');
        console.log('  qcc config        配置管理');
        console.log('\nMCP 服务:');
        shortServerNames.forEach(s => {
          const cfg = mcpService.getServerByShortName(s);
          console.log(`  ${s.padEnd(12)} ${cfg?.name || ''}`);
        });
        process.exit(1);
      }

      program.help();
    });
}

/**
 * 解析前拦截无效的服务/工具组合，避免带未知选项时被 Commander 静默吞掉
 * @param {string[]} argv - CLI 参数
 * @param {boolean} useFallback - 是否使用降级缓存
 */
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

  console.error(`错误: 服务 "${serverName}" 中未找到工具 "${toolName}"`);
  console.log(`\n使用 "qcc list-tools ${serverName}" 查看可用工具`);
  console.log('或运行 "qcc update" 更新工具列表');

  console.log('\n可用工具:');
  tools.slice(0, 10).forEach((tool) => {
    console.log(`  ${tool.name}`);
  });
  if (tools.length > 10) {
    console.log(`  ... 共 ${tools.length} 个工具`);
  }

  process.exit(1);
}

/**
 * 创建并配置 CLI 程序
 * @returns {Promise<Command>} 配置好的 Commander 程序实例
 */
function shouldSkipBootstrapCacheRefresh(argv = []) {
  const [command] = argv;
  return command === 'init';
}

function isConfigExemptCommand(argv = []) {
  const [command] = argv;
  return !command || ['init', 'config', '--help', '-h', '--version', '-V'].includes(command);
}

function showMissingConfigInitMessage() {
  console.error(chalk.red('错误: 配置文件不存在，运行 qcc init 进行初始化'));
}

async function createProgram(argv = process.argv.slice(2)) {
  const program = new Command();

  program
    .name('qcc')
    .description('企业信息查询 CLI 工具')
    .version(version)
    .allowUnknownOption(true); // 允许未知选项，由默认处理器处理

  const configIntegrity = configService.checkConfigIntegrity();
  if (!configIntegrity.exists && !isConfigExemptCommand(argv)) {
    showMissingConfigInitMessage();
    process.exit(1);
  }

  // 场景1: 无配置文件 → 提示用户初始化（不刷新缓存）
  if (!configService.isMcpConfigValid()) {
    registerStaticCommands(program);
    registerMcpCommands(program);  // 注册空命令，提示初始化
    registerDefaultHandler(program);
    setupGlobalErrorHandler(program);
    return program;
  }

  // 场景2: 配置有效 + 缓存过期或不存在 → 自动刷新
  let useFallback = false;
  let authFailed = false;
  const cachePath = configService.getToolsCachePath();
  const cacheExists = fs.existsSync(cachePath);
  if (!shouldSkipBootstrapCacheRefresh(argv) && (!cacheExists || configService.isToolsCacheExpired())) {
    console.log(chalk.gray('工具缓存不存在或已过期，正在从服务器更新...'));
    try {
      const success = await mcpService.ensureToolsCache();
      if (success) {
        console.log(chalk.gray('缓存更新完成。\n'));
      } else {
        useFallback = true;
        console.log(chalk.yellow('缓存更新失败，将使用已有缓存。\n'));
      }
    } catch (error) {
      if (error.type === 'AUTH_FAILED') {
        console.log(chalk.red(`缓存更新失败: 凭证不正确`));
        console.log(chalk.yellow('建议: 请检查 Authorization 是否正确，或运行 qcc init 更新配置\n'));
        // 凭证不正确时直接退出，因为后续 API 调用也会失败
        console.error(chalk.red('错误: 工具列表获取失败'));
        console.log(chalk.yellow('请检查 Authorization 是否正确，或运行 qcc init 更新配置'));
        process.exit(1);
      } else {
        useFallback = true;
        console.log(chalk.yellow(`缓存更新失败: ${error.message}`));
        console.log(chalk.yellow('将使用已有缓存。\n'));
      }
    }
  }

  // 注册命令（可能使用降级缓存）
  registerStaticCommands(program);
  registerMcpCommands(program, useFallback, authFailed);
  registerDefaultHandler(program, useFallback);
  setupGlobalErrorHandler(program);
  handleInvalidToolInvocation(argv, useFallback);

  return program;
}

/**
 * 设置全局错误处理器
 * @param {Command} program - Commander 程序实例
 */
function setupGlobalErrorHandler(program) {
  // 全局错误处理：捕获未知命令（当没有匹配任何子命令时）
  program.on('command:*', (operands) => {
    const unknownCmd = operands[0];
    console.error(`错误: 未知命令或服务 "${unknownCmd}"`);
    console.log('\n可用命令:');
    console.log('  qcc init          初始化配置');
    console.log('  qcc list-tools    显示 MCP 工具列表');
    console.log('  qcc update        更新工具信息缓存');
    console.log('  qcc check         检查配置状态');
    console.log('  qcc config        配置管理');
    console.log('\nMCP 服务:');
    const shortServerNames = mcpService.getShortServerNames();
    shortServerNames.forEach(s => {
      const cfg = mcpService.getServerByShortName(s);
      console.log(`  ${s.padEnd(12)} ${cfg?.name || ''}`);
    });
    console.log('\n使用 "qcc --help" 查看更多帮助');
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
