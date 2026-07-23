const chalk = require('chalk');
const configService = require('../services/configService');
const mcpService = require('../services/mcpService');
const { getServerToolsFromCache, getAllToolsFlat: getToolsFlat } = require('../utils/cacheUtils');

/**
 * 显示 MCP 工具列表
 * @param {string} [serverName] - 可选，指定服务名
 */
async function listTools(serverName) {
  if (configService.isToolsCacheExpired()) {
    console.log(chalk.gray('工具缓存已过期，正在从服务器更新...\n'));
    try {
      const updated = await mcpService.ensureToolsCache(serverName);
      if (updated) {
        if (serverName) {
          console.log(chalk.green(`已更新 ${serverName} 服务工具列表\n`));
        } else {
          console.log(chalk.green('已更新所有服务工具列表\n'));
        }
      } else {
        const failureSummary = mcpService.getLastUpdateFailureSummary();
        console.log(chalk.yellow('缓存更新失败，使用已有缓存\n'));
        if (failureSummary?.message) {
          console.log(chalk.yellow(`${failureSummary.message}\n`));
        }
      }
    } catch (error) {
      if (error.type === 'AUTH_FAILED') {
        console.error(chalk.red('错误: 更新失败: 凭证不正确\n'));
      } else {
        const failureSummary = mcpService.getFailureSummaryFromError(error);
        console.log(chalk.yellow(`更新失败: ${error.message}\n`));
        if (failureSummary?.message) {
          console.log(chalk.yellow(`${failureSummary.message}\n`));
        }
      }
    }
  }

  if (serverName) {
    const tools = getServerToolsFromCache(serverName);
    const serverConfig = mcpService.getServerByShortName(serverName);

    if (tools.length === 0) {
      console.error(chalk.red(`错误: 未知的服务 "${serverName}" 或无可用工具`));
      const shortNames = mcpService.getShortServerNames();
      console.log(chalk.yellow(`可用服务: ${shortNames.join(', ')}`));
      process.exit(1);
    }

    console.log(chalk.bold(`\n${serverConfig?.name || serverName} (${serverName})`));
    if (serverConfig?.description) {
      console.log(chalk.gray(serverConfig.description));
    }
    console.log(chalk.bold('\n可用工具:\n'));

    tools.forEach((tool, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${tool.name}`));
      console.log(chalk.gray(`     ${tool.description || ''}`));

      const props = tool.inputSchema?.properties || {};
      const required = tool.inputSchema?.required || [];

      if (Object.keys(props).length > 0) {
        console.log(chalk.gray('     参数:'));
        Object.entries(props).forEach(([key, value]) => {
          const isRequired = required.includes(key);
          const reqMark = isRequired ? chalk.red('*') : '';
          console.log(chalk.gray(`       --${key} ${reqMark} ${value.description || ''}`));
        });
      }
      console.log();
    });
  } else {
    console.log(chalk.bold('\n可用 MCP 服务:\n'));

    const shortNames = mcpService.getShortServerNames();

    shortNames.forEach((shortName) => {
      const serverConfig = mcpService.getServerByShortName(shortName);
      const tools = getServerToolsFromCache(shortName);

      console.log(chalk.cyan(`  ${shortName}`));
      console.log(chalk.gray(`    ${serverConfig?.name || ''}`));
      console.log(chalk.gray(`    ${serverConfig?.description || ''}`));
      console.log(chalk.gray(`    工具数量: ${tools.length}`));
      console.log();
    });

    console.log(chalk.yellow('提示:'));
    console.log(chalk.yellow('  使用 "qcc list-tools <服务名>" 查看详细工具列表'));
    console.log(chalk.yellow('  使用 "qcc update" 从服务器更新工具信息'));
    console.log(chalk.yellow('  使用 "qcc <服务名> <工具名> --参数 值" 调用工具'));
  }
}

function getAllToolsFlat() {
  return getToolsFlat();
}

function findTool(serverName, toolName) {
  const tools = getServerToolsFromCache(serverName);
  return tools.find((t) => t.name === toolName) || null;
}

module.exports = {
  listTools,
  getAllToolsFlat,
  findTool,
  getServerToolsFromCache
};
