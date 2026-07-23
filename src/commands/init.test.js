/* eslint-env jest */

describe('init command', () => {
  let configService;
  let mcpService;
  let logSpy;
  let previousExitCode;

  beforeEach(() => {
    jest.resetModules();
    previousExitCode = process.exitCode;
    process.exitCode = undefined;
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    configService = {
      MCP_DEFAULT_BASE_URL: 'https://agent.qcc.com/mcp',
      DEFAULT_CONFIG: {
        version: '2.1',
        mcp: {
          enabled: true,
          baseUrl: 'https://agent.qcc.com/mcp',
          authorization: '',
          timeout: 30000
        }
      },
      checkConfigIntegrity: jest.fn(() => ({ valid: true, exists: true })),
      load: jest.fn(() => ({
        version: '2.1',
        mcp: {
          enabled: true,
          baseUrl: 'https://agent.qcc.com/mcp/company/stream',
          authorization: 'Bearer old',
          timeout: 30000
        }
      })),
      save: jest.fn(),
      clearToolsCache: jest.fn(),
      getConfigPath: jest.fn(() => '/tmp/.qcc/config.json')
    };
    mcpService = {
      updateToolsCache: jest.fn(async () => ({ company: { tools: [] } })),
      hasSuccessfulResults: jest.fn(() => true),
      getUpdateFailureSummary: jest.fn(() => null)
    };

    jest.doMock('../services/configService', () => configService);
    jest.doMock('../services/mcpService', () => mcpService);
  });

  afterEach(() => {
    process.exitCode = previousExitCode;
    logSpy.mockRestore();
    jest.dontMock('../services/configService');
    jest.dontMock('../services/mcpService');
  });

  test('authorization-only init resets base URL to the default and clears cache', async () => {
    const init = require('./init');

    await init({ authorization: 'Bearer new' });

    expect(configService.save).toHaveBeenCalledWith(expect.objectContaining({
      mcp: expect.objectContaining({
        baseUrl: 'https://agent.qcc.com/mcp',
        authorization: 'Bearer new'
      })
    }));
    expect(configService.clearToolsCache).toHaveBeenCalledTimes(1);
    expect(mcpService.updateToolsCache).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBeUndefined();
  });

  test('explicit base URL takes precedence over the default', async () => {
    const init = require('./init');

    await init({
      mcpBaseUrl: 'http://localhost:8401/custom',
      authorization: 'Bearer new'
    });

    expect(configService.save).toHaveBeenCalledWith(expect.objectContaining({
      mcp: expect.objectContaining({
        baseUrl: 'http://localhost:8401/custom',
        authorization: 'Bearer new'
      })
    }));
  });

  test('sets a non-zero exit code when every tool-list request fails', async () => {
    mcpService.updateToolsCache.mockResolvedValue({
      company: {
        tools: [],
        error: 'Not Found',
        errorType: 'MCP_ERROR',
        httpStatus: 404
      }
    });
    mcpService.hasSuccessfulResults.mockReturnValue(false);
    mcpService.getUpdateFailureSummary.mockReturnValue({
      message: 'MCP baseUrl 可能包含了具体服务路径'
    });
    const init = require('./init');

    await init({ authorization: 'Bearer new' });

    expect(process.exitCode).toBe(1);
  });
});
