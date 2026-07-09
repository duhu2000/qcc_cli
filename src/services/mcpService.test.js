/* eslint-env jest */

const mcpService = require('./mcpService');

describe('MCP server registry', () => {
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
