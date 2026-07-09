/* eslint-env jest */

const fs = require('fs');
const os = require('os');
const path = require('path');

describe('config service schema', () => {
  let tmpDir;

  beforeEach(() => {
    jest.resetModules();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qcc-config-'));
    jest.doMock('os', () => ({
      ...jest.requireActual('os'),
      homedir: () => tmpDir
    }));
  });

  afterEach(() => {
    jest.dontMock('os');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function loadConfigService() {
    return require('./configService');
  }

  test('default and saved config do not create an idp section', () => {
    const configService = loadConfigService();

    expect(configService.DEFAULT_CONFIG).not.toHaveProperty('idp');

    configService.save(configService.DEFAULT_CONFIG);

    expect(configService.load()).not.toHaveProperty('idp');
  });

  test('rejects idp config keys', () => {
    const configService = loadConfigService();

    expect(() => configService.setConfigValue('idp.baseUrl', 'http://localhost:8401'))
      .toThrow('未知模块: idp。可用模块: mcp');
  });

});
