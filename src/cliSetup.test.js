/* eslint-env jest */

const { Command } = require('commander');

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
