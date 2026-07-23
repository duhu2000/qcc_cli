const chalk = require('chalk');
const configService = require('../services/configService');

/**
 * 检查配置状态
 */
async function check() {
  const configPath = configService.getConfigPath();
  const config = configService.load();

  // 检查配置文件是否存在
  if (!config) {
    console.log(chalk.red('✗') + ' 配置文件: 不存在');
    console.log(chalk.yellow('  请运行 qcc init 初始化配置'));
    process.exit(1);
    return;
  }

  // 检查配置文件完整性
  const integrity = configService.checkConfigIntegrity();
  if (!integrity.valid) {
    console.log(chalk.red('✗') + ` 配置文件: ${integrity.error}`);
    console.log(chalk.yellow(`  ${integrity.suggestion || '请运行 qcc init 重新配置'}`));
    process.exit(1);
    return;
  }

  console.log(chalk.green('✓') + ` 配置文件: ${configPath}`);
  console.log();

  // 检查 MCP 配置
  const isMcpEnabled = config.mcp?.enabled ?? true;
  const hasMcpConfig = configService.isMcpConfigValid();

  // 支持新旧字段名
  const mcpBaseUrl = config.mcp?.baseUrl || config.mcp?.endpoint;
  const mcpAuthorization = config.mcp?.authorization || config.mcp?.authToken;

  if (!isMcpEnabled) {
    console.log(chalk.gray('○') + ' MCP 模式已禁用 (mcp.enabled=false)');
    console.log(chalk.gray('  使用 qcc config set mcp.enabled "true" 启用'));
    process.exit(1);
  } else if (hasMcpConfig) {
    console.log(chalk.green('✓') + ` baseUrl: ${mcpBaseUrl}`);
    console.log(chalk.green('✓') + ' authorization: [已配置]');
  } else {
    console.log(chalk.red('✗') + ' MCP 配置未完整');
    if (mcpBaseUrl) {
      console.log(chalk.green('  ✓') + ` baseUrl: ${mcpBaseUrl}`);
    } else {
      console.log(chalk.red('  ✗') + ' baseUrl: 未配置');
    }
    if (mcpAuthorization) {
      console.log(chalk.green('  ✓') + ' authorization: [已配置]');
    } else {
      console.log(chalk.red('  ✗') + ' authorization: 未配置');
    }
    console.log(chalk.yellow('  请运行 qcc init --authorization "Bearer YOUR_API_KEY"'));
    process.exit(1);
  }
}

module.exports = check;