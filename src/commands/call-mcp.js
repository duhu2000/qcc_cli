const chalk = require('chalk');
const mcpService = require('../services/mcpService');
const { findTool } = require('./list-tools');
const { QccError } = require('../utils/httpClient');
const { jsonToMarkdown } = require('../utils/jsonToMarkdown');
const validator = require('../utils/validator');
const configService = require('../services/configService');
const { buildToolCommandExample, getArrayParamHint } = require('../utils/commandExample');

function printJsonRpcError(result) {
  console.error(chalk.red(`  code: ${result.error?.code ?? '-'}`));
  console.error(chalk.red(`  message: ${result.error?.message || '-'}`));

  if (Object.prototype.hasOwnProperty.call(result.error || {}, 'data')) {
    const data = result.error.data == null
      ? '-'
      : typeof result.error.data === 'string'
        ? result.error.data
        : JSON.stringify(result.error.data, null, 2);
    console.error(chalk.red(`  data: ${data}`));
  }
}

async function callMcp(serverName, toolName, params, options = {}) {
  if (!configService.isMcpConfigValid()) {
    console.error(chalk.red('\n错误: 未找到配置文件或配置不完整'));
    console.error(chalk.yellow('\n请先初始化配置:'));
    console.error(chalk.gray('  qcc init --authorization <token>  配置授权信息'));
    console.error(chalk.gray('  qcc check                         检查配置状态'));
    process.exit(1);
  }

  if (configService.isToolsCacheExpired()) {
    console.log(chalk.gray('工具缓存已过期，正在从服务器更新...\n'));
    try {
      const updated = await mcpService.ensureToolsCache(serverName);
      if (!updated) {
        const failureSummary = mcpService.getLastUpdateFailureSummary();
        console.log(chalk.yellow('缓存更新失败，使用已有缓存\n'));
        if (failureSummary?.message) {
          console.log(chalk.yellow(`${failureSummary.message}\n`));
        }
      }
    } catch (error) {
      if (error.type === 'AUTH_FAILED') {
        console.log(chalk.red('更新失败: 凭证不正确\n'));
        console.error(chalk.red('错误: 工具列表获取失败'));
        console.log(chalk.yellow('建议: 请检查 Authorization 是否正确，或运行 qcc init 更新配置'));
        process.exit(1);
      } else {
        const failureSummary = mcpService.getFailureSummaryFromError(error);
        console.log(chalk.yellow(`更新失败: ${error.message}\n`));
        if (failureSummary?.message) {
          console.log(chalk.yellow(`${failureSummary.message}\n`));
        }
      }
    }
  }

  const tool = findTool(serverName, toolName);
  if (!tool) {
    const shortNames = mcpService.getShortServerNames();
    console.error(chalk.red(`错误: 未找到工具 "${serverName}/${toolName}"`));
    console.log(chalk.yellow('使用 "qcc list-tools" 查看可用工具'));
    console.log(chalk.yellow('或运行 "qcc update" 更新工具列表'));
    console.log(chalk.yellow(`可用服务: ${shortNames.join(', ')}`));
    process.exit(1);
    return;
  }

  const validation = validator.validateMcpTool(tool, params, { coerceTypes: true, checkType: true });
  if (!validation.valid) {
    console.error(chalk.red('错误: 参数校验失败'));
    validation.errors.forEach((err) => console.error(chalk.red(`  - ${err}`)));

    const props = tool.inputSchema?.properties || {};
    const required = tool.inputSchema?.required || [];
    const example = buildToolCommandExample(serverName, toolName, tool, params);
    const arrayHint = getArrayParamHint(tool, params);

    console.log(chalk.yellow('\n正确调用示例:'));
    console.log(chalk.gray(`  ${example}`));
    if (arrayHint) {
      console.log(chalk.gray(`  ${arrayHint}`));
    }

    console.log(chalk.yellow('\n工具参数说明:'));
    Object.entries(props).forEach(([key, value]) => {
      const isRequired = required.includes(key);
      const reqMark = isRequired ? chalk.red('(必填)') : chalk.gray('(可选)');
      console.log(chalk.gray(`  --${key} ${reqMark} ${value.description || ''}`));
    });
    process.exit(1);
  }

  try {
    console.log(chalk.gray(`正在调用 ${serverName}/${toolName}...\n`));

    const result = await mcpService.callTool(serverName, toolName, validation.params);

    if (!options.json && result?.error) {
      printJsonRpcError(result);
      process.exit(1);
      return;
    }

    if (options.json) {
      try {
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(chalk.red('错误: 无法序列化响应数据'));
        console.log(String(result));
      }
    } else {
      const markdown = jsonToMarkdown(result);
      if (markdown) {
        console.log(markdown);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    }
  } catch (error) {
    if (error instanceof QccError) {
      console.error(chalk.red(`\n错误: ${error.message}`));
      if (error.suggestion) {
        console.error(chalk.yellow(`建议:\n${error.suggestion}`));
      }
    } else {
      console.error(chalk.red(`\n错误: ${error.message}`));
    }
    process.exit(1);
  }
}

module.exports = callMcp;
