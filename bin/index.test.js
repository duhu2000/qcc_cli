/* eslint-env jest */

const { spawnSync } = require('child_process');
const path = require('path');
const { version } = require('../package.json');

function getRequireEsmDisabledArgs() {
  const probe = spawnSync(process.execPath, ['--no-experimental-require-module', '-e', ''], {
    encoding: 'utf8'
  });

  return probe.status === 0 ? ['--no-experimental-require-module'] : [];
}

function runCli(args, env = {}) {
  return spawnSync(
    process.execPath,
    [...getRequireEsmDisabledArgs(), path.join(__dirname, 'index.js'), ...args],
    {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      env: {
        ...process.env,
        ...env
      }
    }
  );
}

test('CLI entrypoint starts when CommonJS require cannot load ESM dependencies', () => {
  const result = runCli(['--version'], { NO_UPDATE_NOTIFIER: '1' });

  expect(result.stderr).not.toContain('ERR_REQUIRE_ESM');
  expect(result.status).toBe(0);
  expect(result.stdout.trim()).toBe(version);
});

test('root help groups public capabilities and shows the approved examples', () => {
  const result = runCli(['--help'], { NO_UPDATE_NOTIFIER: '1' });

  expect(result.status).toBe(0);
  expect(result.stdout).toContain('首次使用:');
  expect(result.stdout).toContain('qcc init --authorization "Bearer YOUR_API_KEY"');
  expect(result.stdout).toContain('企业数据:');
  expect(result.stdout).toContain('法律数据:');
  expect(result.stdout).toContain('标讯数据:');
  expect(result.stdout).toContain('智能文档解析:');
  expect(result.stdout).toContain('qcc regulation get_legal_regulation_search "数据出境"');
  expect(result.stdout).toContain('qcc case get_judicial_case_search "卖方违约的买卖合同纠纷判决"');
  expect(result.stdout).toContain('qcc tender search_tenders "智慧工地"');
  expect(result.stdout).toContain('qcc document parse_document --file_path "./财报.pdf"');
  expect(result.stdout).toContain('qcc document get_parse_result "TASK_ID"');
  expect(result.stdout).not.toContain('Commands:');
  expect(result.stdout).not.toContain('服务标识:');
  expect(result.stdout).not.toContain('其他数据:');

  [
    'company',
    'risk',
    'operation',
    'ipr',
    'history',
    'executive',
    'regulation',
    'case',
    'tender',
    'document'
  ].forEach((name) => {
    expect(result.stdout.match(new RegExp(`^  ${name}\\s`, 'gm'))).toHaveLength(1);
  });

  const apiKeyIndex = result.stdout.indexOf('qcc init --authorization');
  const companyGroupIndex = result.stdout.indexOf('企业数据:');
  const legalGroupIndex = result.stdout.indexOf('法律数据:');
  const tenderGroupIndex = result.stdout.indexOf('标讯数据:');
  const documentGroupIndex = result.stdout.indexOf('智能文档解析:');
  expect(apiKeyIndex).toBeLessThan(companyGroupIndex);
  expect(companyGroupIndex).toBeLessThan(legalGroupIndex);
  expect(legalGroupIndex).toBeLessThan(tenderGroupIndex);
  expect(tenderGroupIndex).toBeLessThan(documentGroupIndex);
});

test.each([['--help'], ['--version']])('%s skips update checks', (arg) => {
  const env = { ...process.env, XDG_CONFIG_HOME: __filename };
  delete env.NO_UPDATE_NOTIFIER;
  const result = runCli([arg], env);
  const output = `${result.stdout}\n${result.stderr}`;

  expect(result.status).toBe(0);
  expect(output).not.toContain('update check failed');
});

test('subcommand help keeps its focused Commander output', () => {
  const result = runCli(['document', '--help'], { NO_UPDATE_NOTIFIER: '1' });

  expect(result.status).toBe(0);
  expect(result.stdout).toContain('Usage: qcc document [options] [command]');
  expect(result.stdout).toContain('Commands:');
  expect(result.stdout).toContain('parse_document');
  expect(result.stdout).toContain('get_parse_result');
  expect(result.stdout).not.toContain('企业数据:');
  expect(result.stdout).not.toContain('数据查询示例:');
});
