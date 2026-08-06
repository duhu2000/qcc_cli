/* eslint-env jest */

const mcpService = require('./mcpService');

describe('MCP server registry', () => {
  test('keeps the public MCP servers in the expected display order', () => {
    expect(mcpService.getShortServerNames()).toEqual([
      'company',
      'risk',
      'operation',
      'ipr',
      'history',
      'executive',
      'regulation',
      'case',
      'tender'
    ]);
  });

  test('includes the tender server for generic MCP calls', () => {
    expect(mcpService.getShortServerNames()).toContain('tender');

    expect(mcpService.getServerInfo('tender')).toEqual(expect.objectContaining({
      fullName: 'qcc_tender',
      displayName: '标讯数据',
      description: '提供招投标标讯与拟建项目的搜索、详情查询，以及企业搜索和企业相关招投标查询服务。',
      endpoint: '/tender/stream'
    }));

    expect(mcpService.resolveServerConfig('qcc_tender')).toEqual(expect.objectContaining({
      shortName: 'tender',
      endpoint: '/tender/stream'
    }));
  });

  test('includes legal regulation and case servers', () => {
    expect(mcpService.getShortServerNames()).toEqual(expect.arrayContaining([
      'regulation',
      'case'
    ]));

    expect(mcpService.getServerInfo('regulation')).toEqual(expect.objectContaining({
      fullName: 'qcc-legal-regulation',
      endpoint: '/regulation/stream'
    }));

    expect(mcpService.getServerInfo('case')).toEqual(expect.objectContaining({
      fullName: 'qcc-legal-case',
      endpoint: '/case/stream'
    }));
  });

  test('resolves legal servers by full server name', () => {
    expect(mcpService.resolveServerConfig('qcc-legal-regulation')).toEqual(expect.objectContaining({
      shortName: 'regulation',
      endpoint: '/regulation/stream'
    }));

    expect(mcpService.resolveServerConfig('qcc-legal-case')).toEqual(expect.objectContaining({
      shortName: 'case',
      endpoint: '/case/stream'
    }));
  });
});

describe('MCP tool-list failure diagnostics', () => {
  test('turns endpoint HTTP failures into an actionable MCP base URL error', async () => {
    const configService = require('./configService');
    const { McpService } = require('./mcpService');
    const { QccError, ErrorType } = require('../utils/httpClient');
    const service = new McpService();
    const configSpy = jest.spyOn(configService, 'getMcpConfig').mockReturnValue({
      baseUrl: 'https://agent.qcc.com/mcp/company/stram',
      authorization: 'Bearer token',
      timeout: 30000,
      enabled: true
    });
    service.httpClient = {
      post: jest.fn(async () => {
        throw new QccError(ErrorType.MCP_ERROR, '请求方式异常', {
          code: 405,
          httpStatus: 405,
          serverMessage: '请求方式异常',
          requestUrl: 'https://agent.qcc.com/mcp/company/stram/company/stream'
        });
      })
    };

    try {
      const request = service.callTool(
        'company',
        'get_company_registration_info',
        { searchKey: '企查查科技股份有限公司' }
      );

      await expect(request).rejects.toMatchObject({
        type: ErrorType.MCP_ERROR,
        message: 'MCP 服务地址不可用（HTTP 405）',
        serverMessage: '请求方式异常',
        suggestion: [
          '当前 mcp.baseUrl：https://agent.qcc.com/mcp/company/stram',
          '正确默认地址：https://agent.qcc.com/mcp',
          '修复命令：qcc config set mcp.baseUrl "https://agent.qcc.com/mcp"'
        ].join('\n')
      });
    } finally {
      configSpy.mockRestore();
    }
  });

  test('points 404 and 405 responses to the MCP base URL', () => {
    const summary = mcpService.getUpdateFailureSummary({
      company: {
        error: 'Not Found',
        errorType: 'MCP_ERROR',
        httpStatus: 404,
        requestUrl: 'https://agent.qcc.com/mcp/company/stream/company/stream'
      }
    });

    expect(summary.message).toContain('baseUrl');
    expect(summary.message).toContain('https://agent.qcc.com/mcp');
    expect(summary.message).not.toContain('请求参数是否正确');
  });

  test('identifies overseas-access restrictions from server code 100002', () => {
    const summary = mcpService.getUpdateFailureSummary({
      company: {
        error: 'Access restricted',
        errorType: 'MCP_ERROR',
        serverCode: 100002
      }
    });

    expect(summary.message).toContain('境外');
  });

  test.each([
    [407, '代理'],
    [429, '频率'],
    [503, '服务端']
  ])('provides a targeted suggestion for HTTP %s', (httpStatus, expectedText) => {
    const summary = mcpService.getUpdateFailureSummary({
      company: {
        error: `HTTP ${httpStatus}`,
        errorType: httpStatus >= 500 ? 'SERVER_ERROR' : 'MCP_ERROR',
        httpStatus
      }
    });

    expect(summary.message).toContain(expectedText);
  });

  test('preserves HTTP and server metadata while collecting failures', async () => {
    const { McpService } = require('./mcpService');
    const { QccError, ErrorType } = require('../utils/httpClient');
    const service = new McpService();
    service.getShortServerNames = () => ['company'];
    service.getServerByShortName = () => ({ endpoint: '/company/stream' });
    service.fetchToolsFromServer = jest.fn(async () => {
      throw new QccError(ErrorType.MCP_ERROR, 'Not Found', {
        httpStatus: 404,
        serverCode: 100404,
        serverMessage: 'Not Found',
        requestUrl: 'https://agent.qcc.com/mcp/company/stream/company/stream'
      });
    });

    await expect(service.fetchAllTools()).resolves.toEqual({
      company: expect.objectContaining({
        httpStatus: 404,
        serverCode: 100404,
        serverMessage: 'Not Found',
        requestUrl: 'https://agent.qcc.com/mcp/company/stream/company/stream'
      })
    });
  });
});
