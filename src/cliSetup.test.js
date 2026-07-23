/* eslint-env jest */

const { Command } = require('commander');

describe('init command registration', () => {
  let initCommand;
  let finishInit;

  beforeEach(() => {
    jest.resetModules();
    initCommand = jest.fn(() => new Promise((resolve) => {
      finishInit = resolve;
    }));
    jest.doMock('./commands/init', () => initCommand);
  });

  afterEach(() => {
    jest.dontMock('./commands/init');
  });

  test('waits for asynchronous initialization to finish', async () => {
    const { registerStaticCommands } = require('./cliSetup');
    const program = new Command();
    registerStaticCommands(program);
    let settled = false;

    const parsing = program.parseAsync([
      'node',
      'qcc',
      'init',
      '--authorization',
      'Bearer token'
    ]).then(() => {
      settled = true;
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(initCommand).toHaveBeenCalledWith(expect.objectContaining({
      authorization: 'Bearer token'
    }));
    expect(settled).toBe(false);

    finishInit();
    await parsing;
    expect(settled).toBe(true);
  });
});

describe('document command registration', () => {
  let parseDocument;
  let getParseResult;

  beforeEach(() => {
    jest.resetModules();
    parseDocument = jest.fn();
    getParseResult = jest.fn();
    jest.doMock('./commands/idp', () => ({
      parseDocument,
      getParseResult
    }));
  });

  afterEach(() => {
    jest.dontMock('./commands/idp');
  });

  function loadCliSetup() {
    return require('./cliSetup');
  }

  test('registers document as the public document parsing command', () => {
    const { registerStaticCommands } = loadCliSetup();
    const program = new Command();

    registerStaticCommands(program);

    const commandNames = program.commands.map((command) => command.name());
    const documentCommand = program.commands.find((command) => command.name() === 'document');

    expect(commandNames).toContain('document');
    expect(commandNames).not.toContain('idp');
    expect(documentCommand.commands.map((command) => command.name())).toEqual([
      'parse_document',
      'get_parse_result'
    ]);
  });

  test('document parse_document invokes the existing IDP parser implementation', async () => {
    const { registerStaticCommands } = loadCliSetup();
    const program = new Command();
    registerStaticCommands(program);

    await program.parseAsync([
      'node',
      'qcc',
      'document',
      'parse_document',
      '--file_path',
      './sample.pdf'
    ]);

    expect(parseDocument).toHaveBeenCalledWith(expect.objectContaining({
      file_path: './sample.pdf'
    }));
  });
  test('document parse_document hides page range options at the CLI entry', () => {
    const { registerStaticCommands } = loadCliSetup();
    const program = new Command();

    registerStaticCommands(program);

    const documentCommand = program.commands.find((command) => command.name() === 'document');
    const parseCommand = documentCommand.commands.find((command) => command.name() === 'parse_document');
    const optionNames = parseCommand.options.map((option) => option.long);

    expect(optionNames).toEqual(['--file_path', '--file_url', '--wait']);
    expect(optionNames).not.toContain('--start_page_id');
    expect(optionNames).not.toContain('--end_page_id');
  });


  test('document command skips bootstrap cache refresh', () => {
    const { shouldSkipBootstrapCacheRefresh } = loadCliSetup();

    expect(shouldSkipBootstrapCacheRefresh(['document'])).toBe(true);
    expect(shouldSkipBootstrapCacheRefresh(['idp'])).toBe(false);
  });
});

describe('invalid MCP base URL command registration', () => {
  let exitSpy;
  let errorSpy;
  let logSpy;

  beforeEach(() => {
    jest.resetModules();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT:${code}`);
    });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.doMock('chalk', () => ({
      red: (value) => `<red>${value}</red>`,
      yellow: (value) => `<yellow>${value}</yellow>`
    }));
    jest.doMock('./services/configService', () => ({
      isMcpConfigValid: () => false,
      getMcpConfig: () => {
        const error = new Error('MCP baseUrl 包含了具体服务路径 /company/stream');
        error.type = 'CONFIG_INVALID_BASE_URL';
        error.suggestion = [
          '当前 mcp.baseUrl：https://agent.qcc.com/mcp/company/stream',
          '正确默认地址：https://agent.qcc.com/mcp',
          '修复命令：qcc config set mcp.baseUrl "https://agent.qcc.com/mcp"'
        ].join('\n');
        throw error;
      }
    }));
    jest.doMock('./services/mcpService', () => ({
      getShortServerNames: () => ['company'],
      getServerByShortName: () => ({ name: '企业信息' })
    }));
    jest.doMock('./commands/idp', () => ({
      parseDocument: jest.fn(),
      getParseResult: jest.fn()
    }));
    jest.doMock('./utils/cacheUtils', () => ({
      getCachedTools: () => null,
      getCachedToolsWithFallback: () => null,
      getServerToolsFromCache: () => [],
      getServerToolsFromCacheWithFallback: () => []
    }));
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    logSpy.mockRestore();
    jest.dontMock('./services/configService');
    jest.dontMock('./services/mcpService');
    jest.dontMock('./commands/idp');
    jest.dontMock('./utils/cacheUtils');
    jest.dontMock('chalk');
  });

  test('reports the invalid base URL instead of saying configuration is uninitialized', async () => {
    const { registerMcpCommands } = require('./cliSetup');
    const program = new Command();
    registerMcpCommands(program);

    await expect(program.parseAsync([
      'node',
      'qcc',
      'company',
      'get_company_registration_info',
      '企查查科技股份有限公司'
    ]))
      .rejects.toThrow('EXIT:1');

    expect(errorSpy).toHaveBeenCalledWith(
      '<red>错误: MCP baseUrl 包含了具体服务路径 /company/stream</red>'
    );
    expect(logSpy).toHaveBeenCalledWith(
      `<yellow>${[
        '建议: 当前 mcp.baseUrl：https://agent.qcc.com/mcp/company/stream',
        '正确默认地址：https://agent.qcc.com/mcp',
        '修复命令：qcc config set mcp.baseUrl "https://agent.qcc.com/mcp"'
      ].join('\n')}</yellow>`
    );
    expect(errorSpy).not.toHaveBeenCalledWith('<red>错误: 配置未初始化</red>');
  });
});

describe('MCP default positional parameter mapping', () => {
  let callMcp;
  let keywordTool;
  let cachedTools;

  beforeEach(() => {
    jest.resetModules();
    callMcp = jest.fn();
    keywordTool = {
      name: 'search_law',
      description: 'Search laws',
      inputSchema: {
        properties: {
          keyword: { type: 'string' },
          category: { type: 'string' }
        },
        required: ['category']
      }
    };
    cachedTools = [keywordTool];

    jest.doMock('./commands/call-mcp', () => callMcp);
    jest.doMock('./commands/idp', () => ({
      parseDocument: jest.fn(),
      getParseResult: jest.fn()
    }));
    jest.doMock('./services/configService', () => ({
      isMcpConfigValid: () => true
    }));
    jest.doMock('./services/mcpService', () => ({
      getShortServerNames: () => ['legal'],
      getServerByShortName: (name) => (
        name === 'legal'
          ? { name: 'Legal', description: 'Legal tools' }
          : null
      ),
      getUpdateFailureSummary: () => null
    }));
    jest.doMock('./utils/cacheUtils', () => ({
      getCachedTools: () => ({
        legal: {
          tools: cachedTools
        }
      }),
      getCachedToolsWithFallback: () => ({
        legal: {
          tools: cachedTools
        }
      }),
      getServerToolsFromCache: () => cachedTools,
      getServerToolsFromCacheWithFallback: () => cachedTools
    }));
  });

  afterEach(() => {
    jest.dontMock('./commands/call-mcp');
    jest.dontMock('./commands/idp');
    jest.dontMock('./services/configService');
    jest.dontMock('./services/mcpService');
    jest.dontMock('./utils/cacheUtils');
  });

  function loadCliSetup() {
    return require('./cliSetup');
  }

  test('maps a dynamic command default value to keyword before the first required parameter', async () => {
    const { registerMcpCommands } = loadCliSetup();
    const program = new Command();

    registerMcpCommands(program);

    await program.parseAsync(['node', 'qcc', 'legal', 'search_law', '民法典']);

    expect(callMcp).toHaveBeenCalledWith(
      'legal',
      'search_law',
      { keyword: '民法典' },
      { json: undefined }
    );
  });

  test('maps a fallback invocation default value to keyword before the first required parameter', async () => {
    const { registerDefaultHandler } = loadCliSetup();
    const program = new Command();

    registerDefaultHandler(program, ['legal', 'search_law', '民法典']);

    await program.parseAsync(['node', 'qcc', 'legal', 'search_law', '民法典']);

    expect(callMcp).toHaveBeenCalledWith(
      'legal',
      'search_law',
      { keyword: '民法典' },
      { json: false }
    );
  });

  test('does not leak Commander internals when a tool has no default parameter key', async () => {
    cachedTools = [{
      name: 'list_laws',
      description: 'List laws',
      inputSchema: {
        properties: {
          effectScope: { type: 'string' }
        }
      }
    }];
    const { registerMcpCommands } = loadCliSetup();
    const program = new Command();

    registerMcpCommands(program);

    await program.parseAsync(['node', 'qcc', 'legal', 'list_laws', '--effectScope', '全国']);

    expect(callMcp).toHaveBeenCalledWith(
      'legal',
      'list_laws',
      { effectScope: '全国' },
      { json: undefined }
    );
  });
});
