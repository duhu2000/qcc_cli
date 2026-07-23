/* eslint-env jest */

const { QccError, ErrorType } = require('../utils/httpClient');

describe('update command failure diagnostics', () => {
  let mcpService;
  let configService;
  let previousExitCode;
  let logSpy;
  let errorSpy;
  let writeSpy;

  beforeEach(() => {
    jest.resetModules();
    previousExitCode = process.exitCode;
    process.exitCode = undefined;
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    mcpService = {
      getShortServerNames: jest.fn(() => ['company']),
      getServerByShortName: jest.fn(() => ({ endpoint: '/company/stream' })),
      fetchToolsFromServer: jest.fn(async () => {
        throw new QccError(ErrorType.MCP_ERROR, 'Not Found', {
          httpStatus: 404,
          serverCode: 100404,
          serverMessage: 'Not Found',
          requestUrl: 'https://agent.qcc.com/mcp/company/stream/company/stream'
        });
      }),
      getUpdateFailureSummary: jest.fn(() => ({
        message: '请检查 mcp.baseUrl'
      }))
    };
    configService = {
      isMcpConfigValid: jest.fn(() => true),
      saveToolsCache: jest.fn(),
      getConfigPath: jest.fn(() => '/tmp/.qcc/config.json')
    };
    jest.doMock('../services/mcpService', () => mcpService);
    jest.doMock('../services/configService', () => configService);
  });

  afterEach(() => {
    process.exitCode = previousExitCode;
    logSpy.mockRestore();
    errorSpy.mockRestore();
    writeSpy.mockRestore();
    jest.dontMock('../services/mcpService');
    jest.dontMock('../services/configService');
  });

  test('keeps diagnostic metadata and exits non-zero when every service fails', async () => {
    const { updateTools } = require('./update');

    await updateTools();

    expect(mcpService.getUpdateFailureSummary).toHaveBeenCalledWith({
      company: expect.objectContaining({
        httpStatus: 404,
        serverCode: 100404,
        serverMessage: 'Not Found',
        requestUrl: 'https://agent.qcc.com/mcp/company/stream/company/stream'
      })
    });
    expect(configService.saveToolsCache).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
