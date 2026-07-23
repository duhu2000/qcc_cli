const {
  createHttpClient,
  parseSSEResponse,
  extractMcpContent,
  QccError,
  ErrorType,
  isAuthErrorResponse
} = require('../utils/httpClient');
const configService = require('./configService');
const mcpServers = require('../config/mcpServers.json');

function normalizeMcpRequestError(error, config) {
  if (
    !(error instanceof QccError)
    || ![404, 405].includes(error.httpStatus)
  ) {
    return error;
  }

  return new QccError(
    ErrorType.MCP_ERROR,
    `MCP 服务地址不可用（HTTP ${error.httpStatus}）`,
    {
      code: error.code,
      httpStatus: error.httpStatus,
      serverCode: error.serverCode,
      serverMessage: error.serverMessage || error.message,
      requestUrl: error.requestUrl,
      suggestion: [
        `当前 mcp.baseUrl：${config.baseUrl}`,
        `正确默认地址：${configService.MCP_DEFAULT_BASE_URL}`,
        `修复命令：qcc config set mcp.baseUrl "${configService.MCP_DEFAULT_BASE_URL}"`
      ].join('\n')
    }
  );
}

class McpService {
  constructor() {
    this.httpClient = createHttpClient();
    this._serverNameMap = null;
    this._toolsCache = null;
    this._updateAttempted = false;
    this._lastUpdateError = null;
    this._lastUpdateResults = null;
  }

  static extractServerName(endpoint) {
    const match = endpoint.match(/^\/([^/]+)/);
    return match ? match[1] : endpoint.replace(/^\//, '').replace(/\/.*$/, '');
  }

  static getServerNameMap() {
    const map = new Map();
    Object.entries(mcpServers).forEach(([fullName, config]) => {
      const shortName = McpService.extractServerName(config.endpoint);
      map.set(shortName, {
        fullName,
        shortName,
        ...config
      });
    });
    return map;
  }

  getServerNameMap() {
    if (!this._serverNameMap) {
      this._serverNameMap = McpService.getServerNameMap();
    }
    return this._serverNameMap;
  }

  getShortServerNames() {
    return Array.from(this.getServerNameMap().keys());
  }

  getServerByShortName(shortName) {
    return this.getServerNameMap().get(shortName) || null;
  }

  resolveServerConfig(serverName) {
    let serverConfig = this.getServerByShortName(serverName);

    if (!serverConfig && mcpServers[serverName]) {
      serverConfig = {
        fullName: serverName,
        shortName: McpService.extractServerName(mcpServers[serverName].endpoint),
        ...mcpServers[serverName]
      };
    }

    if (!serverConfig) {
      throw new QccError(
        ErrorType.SERVER_NOT_FOUND,
        `未知的服务器: ${serverName}`,
        { suggestion: `可用服务器: ${this.getShortServerNames().join(', ')}` }
      );
    }

    return serverConfig;
  }

  async callTool(serverName, toolName, args) {
    const serverConfig = this.resolveServerConfig(serverName);
    const config = configService.getMcpConfig();
    const url = `${config.baseUrl}${serverConfig.endpoint}`;

    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
        _meta: {
          progressToken: 1
        }
      }
    };

    try {
      const response = await this.httpClient.post(url, payload, {
        headers: {
          Authorization: config.authorization,
          Accept: 'application/json, text/event-stream'
        },
        timeout: config.timeout,
        responseType: 'text'
      });

      return this.parseResponse(response.data);
    } catch (error) {
      if (error instanceof QccError) {
        throw normalizeMcpRequestError(error, config);
      }

      throw new QccError(
        ErrorType.MCP_ERROR,
        `调用 MCP 工具失败: ${error.message}`,
        { suggestion: '请检查网络连接和配置' }
      );
    }
  }

  async fetchToolsFromServer(serverName) {
    const serverConfig = this.resolveServerConfig(serverName);
    const config = configService.getMcpConfig();
    const url = `${config.baseUrl}${serverConfig.endpoint}`;

    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/list',
      params: {}
    };

    try {
      const response = await this.httpClient.post(url, payload, {
        headers: {
          Authorization: config.authorization,
          Accept: 'application/json, text/event-stream'
        },
        timeout: config.timeout,
        responseType: 'text'
      });

      return this.parseToolsListResponse(response.data) || [];
    } catch (error) {
      if (error instanceof QccError) {
        throw normalizeMcpRequestError(error, config);
      }

      throw new QccError(
        ErrorType.MCP_ERROR,
        `获取工具列表失败: ${error.message}`,
        { suggestion: '请检查网络连接和配置' }
      );
    }
  }

  parseToolsListResponse(data) {
    const throwMcpResponseError = (response) => {
      if (!response?.error) {
        return;
      }

      const code = typeof response.error.code === 'number' ? response.error.code : undefined;
      const message = response.error.message || '获取工具列表失败';

      if (isAuthErrorResponse(code, response)) {
        throw new QccError(ErrorType.AUTH_FAILED, message, {
          code,
          serverCode: code,
          serverMessage: message,
          suggestion: '身份凭证错误，请检查 Authorization 是否正确，或运行 qcc init 更新配置'
        });
      }

      throw new QccError(ErrorType.MCP_ERROR, message, {
        code,
        serverCode: code,
        serverMessage: message,
        suggestion: '请检查服务权限或稍后重试'
      });
    };

    const sseData = parseSSEResponse(data);
    if (sseData) {
      throwMcpResponseError(sseData);
      if (Array.isArray(sseData?.result?.tools)) {
        return sseData.result.tools;
      }
    }

    try {
      const jsonData = JSON.parse(data);
      throwMcpResponseError(jsonData);
      if (Array.isArray(jsonData?.result?.tools)) {
        return jsonData.result.tools;
      }
    } catch (error) {
      if (error instanceof QccError) {
        throw error;
      }
    }

    return null;
  }

  async fetchAllTools() {
    const results = {};
    const serverNames = this.getShortServerNames();

    await Promise.all(serverNames.map(async (serverName) => {
      try {
        const tools = await this.fetchToolsFromServer(serverName);
        results[serverName] = {
          serverName,
          serverConfig: this.getServerByShortName(serverName),
          tools
        };
      } catch (error) {
        if (error instanceof QccError && error.type === ErrorType.AUTH_FAILED) {
          throw error;
        }

        results[serverName] = {
          serverName,
          serverConfig: this.getServerByShortName(serverName),
          tools: [],
          error: error.message,
          errorType: error.type,
          suggestion: error.suggestion,
          httpStatus: error.httpStatus,
          serverCode: error.serverCode,
          serverMessage: error.serverMessage,
          requestUrl: error.requestUrl
        };
      }
    }));

    this._lastUpdateResults = results;
    this._lastUpdateError = null;
    return results;
  }

  hasSuccessfulResults(results = {}) {
    return Object.values(results).some((result) => !result.error);
  }

  getUpdateFailureSummary(results = {}) {
    const failures = Object.values(results).filter((result) => result.error);
    if (failures.length === 0) {
      return null;
    }

    const authFailure = failures.find((result) => result.errorType === ErrorType.AUTH_FAILED);
    if (authFailure) {
      return {
        message: '请检查身份凭证是否有效: qcc init --authorization "Bearer YOUR_API_KEY"',
        suggestion: authFailure.suggestion || '请检查 Authorization 是否正确，或运行 qcc init 更新配置'
      };
    }

    const invalidBaseUrlFailure = failures.find((result) => (
      result.errorType === ErrorType.CONFIG_INVALID_BASE_URL
    ));
    if (invalidBaseUrlFailure) {
      const message = invalidBaseUrlFailure.suggestion
        || `MCP baseUrl 配置不正确，请运行 qcc init --authorization "Bearer YOUR_API_KEY" 恢复默认地址 ${configService.MCP_DEFAULT_BASE_URL}`;
      return { message, suggestion: message };
    }

    const overseasFailure = failures.find((result) => result.serverCode === 100002);
    if (overseasFailure) {
      const message = '当前网络出口可能受到境外访问限制，请切换至中国大陆网络出口后重试；如仍失败请联系服务支持';
      return { message, suggestion: message };
    }

    const endpointFailure = failures.find((result) => (
      result.httpStatus === 404 || result.httpStatus === 405
    ));
    if (endpointFailure) {
      const message = endpointFailure.suggestion || [
        `MCP 服务地址不可用（HTTP ${endpointFailure.httpStatus}），请检查 mcp.baseUrl 配置`,
        `正确默认地址：${configService.MCP_DEFAULT_BASE_URL}`,
        `修复命令：qcc config set mcp.baseUrl "${configService.MCP_DEFAULT_BASE_URL}"`
      ].join('\n');
      return { message, suggestion: message };
    }

    const proxyFailure = failures.find((result) => result.httpStatus === 407);
    if (proxyFailure) {
      const message = '代理服务器要求认证，请检查 HTTP_PROXY、HTTPS_PROXY 或操作系统代理配置';
      return { message, suggestion: message };
    }

    const rateLimitFailure = failures.find((result) => result.httpStatus === 429);
    if (rateLimitFailure) {
      const message = '请求频率或账号配额已受限，请稍后重试或确认账号配额';
      return { message, suggestion: message };
    }

    const serverFailure = failures.find((result) => (
      result.errorType === ErrorType.SERVER_ERROR || result.httpStatus >= 500
    ));
    if (serverFailure) {
      const message = 'MCP 服务端暂时不可用，请稍后重试；持续失败时请联系服务支持';
      return {
        message,
        suggestion: message
      };
    }

    const networkFailure = failures.find((result) => (
      result.errorType === ErrorType.NETWORK_ERROR || result.errorType === ErrorType.TIMEOUT
    ));
    if (networkFailure) {
      return {
        message: '请检查网络连接，或稍后重试',
        suggestion: networkFailure.suggestion || '请检查网络连接，或稍后重试'
      };
    }

    const firstFailure = failures[0];
    const serverDetail = firstFailure.serverMessage
      ? `服务端返回：${firstFailure.serverMessage}。`
      : '';
    const message = firstFailure.suggestion
      || `${serverDetail}请检查 MCP baseUrl、Authorization 和服务权限，或稍后重试`;
    return {
      message,
      suggestion: message
    };
  }

  getFailureSummaryFromError(error) {
    if (!error) {
      return null;
    }

    return this.getUpdateFailureSummary({
      latest: {
        error: error.message,
        errorType: error.type,
        suggestion: error.suggestion,
        httpStatus: error.httpStatus,
        serverCode: error.serverCode,
        serverMessage: error.serverMessage,
        requestUrl: error.requestUrl
      }
    });
  }

  getLastUpdateFailureSummary() {
    if (this._lastUpdateResults) {
      return this.getUpdateFailureSummary(this._lastUpdateResults);
    }

    if (this._lastUpdateError) {
      return this.getFailureSummaryFromError(this._lastUpdateError);
    }

    return null;
  }

  async updateToolsCache() {
    const results = await this.fetchAllTools();
    this._lastUpdateResults = results;
    this._lastUpdateError = null;

    if (this.hasSuccessfulResults(results)) {
      configService.saveToolsCache(results);
      this._toolsCache = results;
    }

    return results;
  }

  getCachedTools() {
    if (this._toolsCache) {
      return this._toolsCache;
    }
    return configService.loadToolsCache();
  }

  async ensureToolsCache(serverName) {
    if (!configService.isToolsCacheExpired()) {
      return true;
    }

    if (this._updateAttempted) {
      return false;
    }

    this._updateAttempted = true;

    try {
      if (serverName) {
        const tools = await this.fetchToolsFromServer(serverName);

        if (tools && tools.length >= 0) {
          const existingCache = this.getCachedTools() || {};
          existingCache[serverName] = {
            serverName,
            serverConfig: this.getServerByShortName(serverName),
            tools: tools || []
          };

          configService.saveToolsCache(existingCache);
          this._toolsCache = existingCache;
          this._updateAttempted = false;
          return true;
        }

        return false;
      }

      const results = await this.updateToolsCache();
      const hasSuccess = this.hasSuccessfulResults(results);

      if (hasSuccess) {
        this._updateAttempted = false;
      }

      return hasSuccess;
    } catch (error) {
      if (error instanceof QccError && error.type === ErrorType.AUTH_FAILED) {
        this._lastUpdateError = error;
        throw error;
      }

      this._lastUpdateError = error;
      return false;
    }
  }

  parseResponse(data) {
    const sseData = parseSSEResponse(data);
    if (sseData) {
      return extractMcpContent(sseData);
    }

    try {
      const jsonData = JSON.parse(data);
      return extractMcpContent(jsonData);
    } catch (error) {
      return data;
    }
  }

  getServers() {
    return Array.from(this.getServerNameMap().entries()).map(([shortName, config]) => ({
      name: shortName,
      fullName: config.fullName,
      displayName: config.name,
      description: config.description,
      endpoint: config.endpoint
    }));
  }

  getServerInfo(serverName) {
    const config = this.getServerByShortName(serverName);
    if (!config) {
      if (mcpServers[serverName]) {
        return {
          name: McpService.extractServerName(mcpServers[serverName].endpoint),
          fullName: serverName,
          displayName: mcpServers[serverName].name,
          description: mcpServers[serverName].description,
          endpoint: mcpServers[serverName].endpoint
        };
      }
      return null;
    }

    return {
      name: config.shortName,
      fullName: config.fullName,
      displayName: config.name,
      description: config.description,
      endpoint: config.endpoint
    };
  }

  isConfigured() {
    return configService.isMcpConfigValid();
  }
}

const mcpService = new McpService();

module.exports = mcpService;
module.exports.McpService = McpService;
module.exports.extractServerName = McpService.extractServerName;
module.exports.getServerNameMap = McpService.getServerNameMap;
