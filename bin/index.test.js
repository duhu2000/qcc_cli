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

test('CLI entrypoint starts when CommonJS require cannot load ESM dependencies', () => {
  const cliPath = path.join(__dirname, 'index.js');
  const result = spawnSync(
    process.execPath,
    [...getRequireEsmDisabledArgs(), cliPath, '--version'],
    {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      env: {
        ...process.env,
        NO_UPDATE_NOTIFIER: '1'
      }
    }
  );

  expect(result.stderr).not.toContain('ERR_REQUIRE_ESM');
  expect(result.status).toBe(0);
  expect(result.stdout.trim()).toBe(version);
});
