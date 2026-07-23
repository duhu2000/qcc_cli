#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const pkg = require('../package.json');
const { createProgram } = require('../src/cliSetup');

const updateConfigPath = path.join(
  process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  'configstore',
  `update-notifier-${pkg.name}.json`
);
const isFirstUpdateCheck = !fs.existsSync(updateConfigPath);

async function notifyUpdateIfAvailable() {
  try {
    const updateNotifierModule = await import('update-notifier');
    const updateNotifier = updateNotifierModule.default || updateNotifierModule;

    updateNotifier({
      pkg,
      updateCheckInterval: isFirstUpdateCheck ? 0 : 1000 * 60 * 60 * 12
    }).notify({ isGlobal: true });
  } catch {
    // Update checks are best-effort and must not block CLI startup.
  }
}

async function main() {
  await notifyUpdateIfAvailable();

  const program = await createProgram(process.argv.slice(2));

  program.exitOverride((err) => {
    if (
      err.code === 'commander.help'
      || err.code === 'commander.version'
      || err.code === 'commander.helpDisplayed'
      || err.message === '(outputHelp)'
    ) {
      process.exit(0);
    }

    if (err.code === 'commander.unknownOption') {
      process.exit(1);
    }

    if (err.code === 'commander.optionMissingArgument') {
      console.error(chalk.red('错误: 参数缺少值'));
      process.exit(1);
    }

    process.exit(1);
  });

  await program.parseAsync();
}

main().catch((error) => {
  if (
    error?.code === 'commander.help'
    || error?.code === 'commander.version'
    || error?.code === 'commander.helpDisplayed'
    || error?.message === '(outputHelp)'
  ) {
    process.exit(0);
  }

  console.error(chalk.red(`CLI 启动失败: ${error.message}`));
  process.exit(1);
});
