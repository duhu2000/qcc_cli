const chalk = require('chalk');
const mcpService = require('../services/mcpService');
const configService = require('../services/configService');

function buildFailureResults(failedItems) {
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

function printVerboseSummary(results) {
  if (results.success.length > 0) {
    console.log(chalk.bold('\n更新结果:'));
    console.log(chalk.green(`  成功: ${results.success.length} 个服务`));
    console.log(chalk.green(`  工具: ${results.totalTools} 个`));

    if (results.failed.length > 0) {
      console.log(chalk.yellow(`  失败: ${results.failed.length} 个服务`));
      results.failed.forEach((item) => {
        console.log(chalk.yellow(`    - ${item.server}: ${item.error}`));
      });
    }

    console.log(chalk.gray(`\n缓存已保存到: ${configService.getConfigPath().replace('config.json', 'cache/tools.json')}`));
    return;
  }

  console.log(chalk.bold('\n更新结果:'));
  console.log(chalk.red('  成功: 0 个服务'));
  console.log(chalk.red(`  失败: ${results.failed.length} 个服务`));
  results.failed.forEach((item) => {
    console.log(chalk.red(`    - ${item.server}: ${item.error}`));
  });
  console.log(chalk.yellow('\n所有服务更新失败，缓存未更新'));

  const failureSummary = mcpService.getUpdateFailureSummary(buildFailureResults(results.failed));
  if (failureSummary?.message) {
    console.log(chalk.yellow(`建议: ${failureSummary.message}`));
  }
}

/**
 * 更新 MCP 工具缓存
 * @param {{ silent?: boolean }} options
 * @returns {Promise<{success: Array, failed: Array, totalTools: number}>}
 */
async function updateTools(options = {}) {
  const { silent = false } = options;

  if (!silent) {
    console.log(chalk.gray('\n正在更新工具信息...\n'));
  }

  if (!configService.isMcpConfigValid()) {
    const integrity = configService.checkConfigIntegrity();
    if (integrity.errorType === 'CONFIG_INVALID_BASE_URL') {
      console.error(chalk.red(`错误: ${integrity.error}`));
      console.log(chalk.yellow(`建议: ${integrity.suggestion}`));
    } else {
      console.error(chalk.red('错误: 配置不完整'));
      console.log(chalk.yellow('请先运行 qcc init --authorization "Bearer YOUR_API_KEY" 进行配置'));
    }
    process.exit(1);
    return null;
  }

  const servers = mcpService.getShortServerNames();
  const allTools = {};
  const results = {
    success: [],
    failed: [],
    totalTools: 0
  };

  for (const serverName of servers) {
    if (!silent) {
      process.stdout.write(chalk.gray(`  获取 ${serverName} 工具列表... `));
    }

    try {
      const tools = await mcpService.fetchToolsFromServer(serverName);
      results.success.push({
        server: serverName,
        toolCount: tools.length
      });
      results.totalTools += tools.length;

      allTools[serverName] = {
        serverName,
        serverConfig: mcpService.getServerByShortName(serverName),
        tools: tools || []
      };

      if (!silent) {
        console.log(chalk.green(`✓ ${tools.length} 个工具`));
      }
    } catch (error) {
      results.failed.push({
        server: serverName,
        error: error.message,
        errorType: error.type,
        suggestion: error.suggestion,
        httpStatus: error.httpStatus,
        serverCode: error.serverCode,
        serverMessage: error.serverMessage,
        requestUrl: error.requestUrl
      });

      if (!silent) {
        console.log(chalk.red(`✗ ${error.message}`));
      }
    }
  }

  if (results.success.length > 0) {
    configService.saveToolsCache(allTools);
  }

  if (!silent) {
    printVerboseSummary(results);
    if (results.success.length === 0) {
      process.exitCode = 1;
    }
  }

  return results;
}

module.exports = {
  updateTools
};
