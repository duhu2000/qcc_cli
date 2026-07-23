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

  test('normalizes valid MCP base URLs', () => {
    const configService = loadConfigService();

    expect(configService.normalizeMcpBaseUrl(' https://agent.qcc.com/mcp/ '))
      .toBe('https://agent.qcc.com/mcp');
    expect(configService.normalizeMcpBaseUrl('http://localhost:8401/custom/'))
      .toBe('http://localhost:8401/custom');
  });

  test.each([
    'https://agent.qcc.com/mcp/company/stream',
    'https://agent.qcc.com/mcp/company/stream/',
    'https://agent.qcc.com/mcp?tenant=test',
    'ftp://agent.qcc.com/mcp',
    'not-a-url'
  ])('rejects invalid MCP base URL %s', (baseUrl) => {
    const configService = loadConfigService();

    expect(() => configService.normalizeMcpBaseUrl(baseUrl)).toThrow(
      expect.objectContaining({ type: 'CONFIG_INVALID_BASE_URL' })
    );
  });

  test('provides the current URL, correct URL, and repair command for an endpoint URL', () => {
    const configService = loadConfigService();
    const invalidBaseUrl = 'https://agent.qcc.com/mcp/company/stream';

    try {
      configService.normalizeMcpBaseUrl(invalidBaseUrl);
      throw new Error('Expected normalizeMcpBaseUrl to fail');
    } catch (error) {
      expect(error.suggestion).toBe([
        `当前 mcp.baseUrl：${invalidBaseUrl}`,
        '正确默认地址：https://agent.qcc.com/mcp',
        '修复命令：qcc config set mcp.baseUrl "https://agent.qcc.com/mcp"'
      ].join('\n'));
    }
  });

  test('does not save an invalid MCP base URL', () => {
    const configService = loadConfigService();

    expect(() => configService.save({
      ...configService.DEFAULT_CONFIG,
      mcp: {
        ...configService.DEFAULT_CONFIG.mcp,
        baseUrl: 'https://agent.qcc.com/mcp/company/stream'
      }
    })).toThrow(expect.objectContaining({ type: 'CONFIG_INVALID_BASE_URL' }));
    expect(fs.existsSync(configService.getConfigPath())).toBe(false);
  });

  test('normalizes base URL and clears tools cache when connection config changes', () => {
    const configService = loadConfigService();
    configService.save(configService.DEFAULT_CONFIG);
    configService.saveToolsCache({ company: { tools: [] } });

    configService.setConfigValue('mcp.baseUrl', 'http://localhost:8401/custom/');

    expect(configService.getConfigValue('mcp.baseUrl')).toBe('http://localhost:8401/custom');
    expect(fs.existsSync(configService.getToolsCachePath())).toBe(false);
  });

  test('updating authorization preserves a custom base URL and clears tools cache', () => {
    const configService = loadConfigService();
    configService.save({
      ...configService.DEFAULT_CONFIG,
      mcp: {
        ...configService.DEFAULT_CONFIG.mcp,
        baseUrl: 'http://localhost:8401/custom',
        authorization: 'Bearer old'
      }
    });
    configService.saveToolsCache({ company: { tools: [] } });

    configService.setConfigValue('mcp.authorization', 'Bearer new');

    expect(configService.getConfigValue('mcp.baseUrl')).toBe('http://localhost:8401/custom');
    expect(configService.getConfigValue('mcp.authorization')).toBe('Bearer new');
    expect(fs.existsSync(configService.getToolsCachePath())).toBe(false);
  });

  test('reports an invalid saved MCP base URL before requests are sent', () => {
    const configService = loadConfigService();
    const configPath = configService.getConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({
      ...configService.DEFAULT_CONFIG,
      mcp: {
        ...configService.DEFAULT_CONFIG.mcp,
        baseUrl: 'https://agent.qcc.com/mcp/company/stream',
        authorization: 'Bearer token'
      }
    }));

    expect(configService.checkConfigIntegrity()).toEqual(expect.objectContaining({
      valid: false,
      exists: true,
      errorType: 'CONFIG_INVALID_BASE_URL'
    }));
    expect(() => configService.getMcpConfig()).toThrow(
      expect.objectContaining({ type: 'CONFIG_INVALID_BASE_URL' })
    );
  });

});
