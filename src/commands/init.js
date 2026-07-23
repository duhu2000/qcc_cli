const chalk = require('chalk');
const configService = require('../services/configService');
const mcpService = require('../services/mcpService');

function getFirstFailure(results = {}) {
  return Object.values(results).find((item) => item.error);
}

/**
 * 初始化配置命令
 * @param {object} options - 命令行选项
 */
async function init(options) {
  console.log(chalk.bold('\n企业信息查询 CLI 配置初始化\n'));

  const integrity = configService.checkConfigIntegrity();
  if (integrity.exists && !integrity.valid) {
    console.log(chalk.yellow('警告: 配置文件已损坏'));
    console.error(chalk.red(`错误详情: ${integrity.error}`));
    console.log(chalk.yellow('将创建新的配置文件覆盖损坏的配置\n'));
  }

  const loadedConfig = configService.load();
  const config = {
    ...(loadedConfig || configService.DEFAULT_CONFIG),
    mcp: {
      ...configService.DEFAULT_CONFIG.mcp,
      ...loadedConfig?.mcp
    }
  };
  const hasAnyParam = options.mcpBaseUrl || options.authorization;

  if (!hasAnyParam) {
    console.log(chalk.yellow('请通过命令行参数进行配置:'));
    console.log(chalk.gray('\n  qcc init --authorization "Bearer YOUR_API_KEY"'));
    console.log(chalk.gray('  qcc init --mcpBaseUrl "<url>" --authorization "Bearer YOUR_API_KEY"'));
    console.log(chalk.gray('\n提示: mcpBaseUrl 默认为 https://agent.qcc.com/mcp，通常可省略'));
    process.exitCode = 1;
    return;
  }

  if (options.mcpBaseUrl) {
    config.mcp.baseUrl = options.mcpBaseUrl;
  } else if (options.authorization) {
    config.mcp.baseUrl = configService.MCP_DEFAULT_BASE_URL;
  }
  if (options.authorization) {
    config.mcp.authorization = options.authorization;
  }

  if (options.mcpBaseUrl || options.authorization) {
    config.mcp.enabled = true;
  }

  if (!config.mcp.baseUrl) {
    config.mcp.baseUrl = configService.MCP_DEFAULT_BASE_URL;
  }

  const connectionConfigChanged = (
    loadedConfig?.mcp?.baseUrl !== config.mcp.baseUrl
    || loadedConfig?.mcp?.authorization !== config.mcp.authorization
  );

  try {
    configService.save(config);
    if (connectionConfigChanged) {
      configService.clearToolsCache();
    }
  } catch (error) {
    console.error(chalk.red(`错误: 配置保存失败: ${error.message}`));
    if (error.suggestion) {
      console.log(chalk.yellow(`建议: ${error.suggestion}`));
    }
    process.exitCode = 1;
    return;
  }
  console.log(chalk.green('✓ 配置已保存!'));
  console.log(chalk.gray(`配置文件路径: ${configService.getConfigPath()}`));

  console.log(chalk.gray('\n正在从服务器更新工具列表...'));
  try {
    const results = await mcpService.updateToolsCache();
    const hasSuccess = mcpService.hasSuccessfulResults(results);

    if (hasSuccess) {
      console.log(chalk.green('✓ 工具列表已更新!'));
      return;
    }

    const firstFailure = getFirstFailure(results);
    const failureSummary = mcpService.getUpdateFailureSummary(results);
    console.error(chalk.red('错误: 工具列表更新失败'));
    if (firstFailure?.error) {
      console.error(chalk.red(`错误详情: ${firstFailure.error}`));
    }
    if (failureSummary?.message) {
      console.log(chalk.yellow(`建议: ${failureSummary.message}`));
    }
    process.exitCode = 1;
  } catch (error) {
    if (error.type === 'AUTH_FAILED') {
      console.error(chalk.red('错误: 凭证不正确，工具列表更新失败'));
      console.log(chalk.yellow('建议: 请检查 Authorization 是否正确'));
    } else {
      console.error(chalk.red('错误: 工具列表更新失败'));
      console.error(chalk.red(`错误详情: ${error.message}`));
      if (error.suggestion) {
        console.log(chalk.yellow(`建议: ${error.suggestion}`));
      }
    }
    process.exitCode = 1;
  }
}

module.exports = init;
