const chalk = require('chalk');
const configService = require('../services/configService');

/**
 * 配置管理命令
 * 支持 set、get、list 子命令
 */

/**
 * 设置配置项
 * @param {string} keyPath - 配置路径，如 "mcp.baseUrl"
 * @param {string} value - 配置值
 */
async function setConfig(keyPath, value) {
  // 先检查参数
  if (!keyPath || value === undefined) {
    console.log(chalk.yellow('用法：qcc config set <keyPath> "<value>"'));
    console.log(chalk.gray('\n示例:'));
    console.log(chalk.gray('  qcc config set mcp.baseUrl "https://agent.qcc.com/mcp"'));
    console.log(chalk.gray('  qcc config set mcp.authorization "Bearer YOUR_API_KEY"'));
    process.exit(1);
    return;
  }

  // 验证配置路径格式
  const parts = keyPath.split('.');
  if (parts.length < 2) {
    console.error(chalk.red('错误：配置路径必须包含模块名'));
    console.log(chalk.yellow('格式：<module>.<key>，如 "mcp.baseUrl"'));
    process.exit(1);
    return;
  }

  const [module, key] = parts;
  const validModules = ['mcp'];
  const validKeys = {
    mcp: ['enabled', 'baseUrl', 'authorization', 'timeout']
  };

  if (!validModules.includes(module)) {
    console.error(chalk.red(`错误：未知模块 "${module}"`));
    console.log(chalk.yellow(`可用模块：${validModules.join(', ')}`));
    process.exit(1);
    return;
  }

  if (!validKeys[module].includes(key)) {
    console.error(chalk.red(`错误：未知配置项 "${module}.${key}"`));
    console.log(chalk.yellow(`可用配置项：${validKeys[module].join(', ')}`));
    process.exit(1);
    return;
  }

  // 类型转换
  let typedValue = value;
  if (key === 'enabled') {
    typedValue = value.toLowerCase() === 'true' || value === '1';
  } else if (key === 'timeout') {
    typedValue = parseInt(value, 10);
    if (isNaN(typedValue)) {
      console.error(chalk.red('错误：timeout 必须是数字'));
      process.exit(1);
      return;
    }
  }

  try {
    configService.setConfigValue(keyPath, typedValue);

    // 敏感信息遮蔽
    const sensitiveKeys = ['authorization'];
    const displayValue = sensitiveKeys.includes(key) ? '[已配置]' : typedValue;

    console.log(chalk.green(`✓ 配置已更新：${keyPath} = ${displayValue}`));
    console.log(chalk.gray(`配置文件：${configService.getConfigPath()}`));
  } catch (error) {
    console.error(chalk.red(`错误：${error.message}`));
    if (error.suggestion) {
      console.log(chalk.yellow(`建议：${error.suggestion}`));
    }
    process.exit(1);
    return;
  }
}

/**
 * 获取配置项
 * @param {string} keyPath - 配置路径
 */
async function getConfig(keyPath) {
  if (!keyPath) {
    console.log(chalk.yellow('用法：qcc config get <keyPath>'));
    console.log(chalk.gray('\n示例:'));
    console.log(chalk.gray('  qcc config get mcp.baseUrl'));
    process.exit(1);
    return;
  }

  const value = configService.getConfigValue(keyPath);
  if (value === null) {
    console.log(chalk.yellow(`配置项 "${keyPath}" 未设置`));
  } else {
    // 敏感信息遮蔽
    const sensitiveKeys = ['authorization'];
    const key = keyPath.split('.')[1];
    const displayValue = sensitiveKeys.includes(key) ? '[已配置]' : value;
    console.log(`${keyPath} = ${displayValue}`);
  }
}

/**
 * 列出所有配置
 */
async function listConfig() {
  const config = configService.load();

  if (!config) {
    console.log(chalk.yellow('配置文件不存在，请运行 qcc init 初始化'));
    process.exit(1);
    return;
  }

  console.log(chalk.bold('\n当前配置:\n'));

  console.log(chalk.cyan('MCP:'));
  console.log(`  enabled: ${config.mcp?.enabled ?? true}`);
  console.log(`  baseUrl: ${config.mcp?.baseUrl || '(未设置)'}`);
  console.log(`  authorization: ${config.mcp?.authorization ? '[已配置]' : '(未设置)'}`);
  console.log(`  timeout: ${config.mcp?.timeout || 30000}`);
}

module.exports = {
  setConfig,
  getConfig,
  listConfig
};
