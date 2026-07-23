const axios = require('axios');
const chalk = require('chalk');
const { version } = require('../../package.json');

/**
 * 错误类型枚举
 */
const ErrorType = {
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_INVALID_BASE_URL: 'CONFIG_INVALID_BASE_URL',
  CONFIG_MISSING_FIELD: 'CONFIG_MISSING_FIELD',

  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',

  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  SERVER_NOT_FOUND: 'SERVER_NOT_FOUND',
  INVALID_TOOL_ARGS: 'INVALID_TOOL_ARGS',

  MCP_ERROR: 'MCP_ERROR',
  MCP_PARSE_ERROR: 'MCP_PARSE_ERROR'
};

/**
 * 自定义错误类
 */
class QccError extends Error {
  constructor(type, message, options = {}) {
    super(message);
    this.name = 'QccError';
    this.type = type;
    this.code = options.code ?? -1;
    this.recoverable = options.recoverable ?? false;
    this.suggestion = options.suggestion || '';
    if (options.httpStatus !== undefined) {
      this.httpStatus = options.httpStatus;
    }
    if (options.serverCode !== undefined) {
      this.serverCode = options.serverCode;
    }
    if (options.serverMessage !== undefined) {
      this.serverMessage = options.serverMessage;
    }
    if (options.requestUrl !== undefined) {
      this.requestUrl = options.requestUrl;
    }
    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}

function normalizeErrorData(data) {
  if (!data || typeof data !== 'string') {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    return data;
  }
}

function isAuthErrorResponse(status, data) {
  const normalizedData = normalizeErrorData(data);

  if (status === 401 || status === 403) {
    return true;
  }

  const errorCode = normalizedData?.error?.code;
  const messages = [normalizedData?.error?.message, normalizedData?.message].filter(Boolean);

  return errorCode === 200001 || messages.some((message) => (
    typeof message === 'string' && message.includes('身份凭证')
  ));
}

function sanitizeRequestUrl(config = {}) {
  const rawUrl = config.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  try {
    const url = config.baseURL ? new URL(rawUrl, config.baseURL) : new URL(rawUrl);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch (error) {
    return rawUrl.split(/[?#]/, 1)[0];
  }
}

function getServerErrorDetails(data) {
  const normalizedData = normalizeErrorData(data);
  return {
    normalizedData,
    serverCode: normalizedData?.error?.code ?? normalizedData?.code,
    serverMessage: normalizedData?.error?.message ?? normalizedData?.message
  };
}

function getHttpErrorSuggestion(status) {
  if (status === 404 || status === 405) {
    return '请检查 MCP baseUrl 是否为基础地址，且不要包含 /company/stream 等具体服务路径';
  }
  if (status === 407) {
    return '代理服务器要求认证，请检查 HTTP_PROXY、HTTPS_PROXY 或系统代理配置';
  }
  if (status === 429) {
    return '请求频率或配额已受限，请稍后重试或确认账号配额';
  }
  return '请求被服务端拒绝，请检查 MCP 服务地址、访问权限和服务状态';
}

/**
 * 创建 HTTP 客户端
 * @param {object} options - 配置选项
 * @returns {object} HTTP 客户端实例
 */
function createHttpClient(options = {}) {
  const client = axios.create({
    timeout: options.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'source': 'qcc-agent-cli',
      'source-version': version
    }
  });

  client.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const requestConfig = error.config || error.response?.config || {};
      const requestUrl = sanitizeRequestUrl(requestConfig);

      if (error.code === 'ECONNABORTED') {
        throw new QccError(ErrorType.TIMEOUT, '请求超时', {
          recoverable: true,
          suggestion: '请检查网络连接后重试',
          requestUrl
        });
      }

      if (error.response) {
        const { status, data } = error.response;
        const { normalizedData, serverCode, serverMessage } = getServerErrorDetails(data);
        const errorMetadata = {
          code: status,
          httpStatus: status,
          serverCode,
          serverMessage,
          requestUrl
        };

        if (isAuthErrorResponse(status, normalizedData)) {
          throw new QccError(
            ErrorType.AUTH_FAILED,
            serverMessage || '认证失败',
            {
              ...errorMetadata,
              suggestion: '身份凭证错误，请检查 Authorization 是否正确，或运行 qcc init 更新配置'
            }
          );
        }

        if (status >= 500) {
          throw new QccError(ErrorType.SERVER_ERROR, serverMessage || `服务器错误: ${status}`, {
            ...errorMetadata,
            recoverable: true,
            suggestion: '服务端暂时不可用，请稍后重试'
          });
        }

        throw new QccError(ErrorType.MCP_ERROR, serverMessage || '请求失败', {
          ...errorMetadata,
          suggestion: getHttpErrorSuggestion(status)
        });
      }

      if (error.request) {
        throw new QccError(ErrorType.NETWORK_ERROR, '网络错误，无法连接到服务器', {
          recoverable: true,
          suggestion: '请检查网络连接、代理配置和 MCP 服务地址是否正确',
          requestUrl
        });
      }

      throw error;
    }
  );

  return client;
}

/**
 * 解析 SSE 流式响应
 * @param {string} data - SSE 数据
 * @returns {object|null} 解析后的 JSON 对象
 */
function parseSSEResponse(data) {
  if (!data) {
    return null;
  }

  const lines = data.split('\n');
  let jsonData = null;

  for (const line of lines) {
    if (line.startsWith('data:')) {
      const jsonStr = line.substring(5).trim();
      try {
        jsonData = JSON.parse(jsonStr);
      } catch (error) {
        continue;
      }
    }
  }

  return jsonData;
}

/**
 * 从 MCP 响应中提取内容
 * @param {object} response - MCP 响应对象
 * @returns {object|string|Array|null} 提取的内容
 */
function extractMcpContent(response) {
  if (!response) {
    return null;
  }

  if (response.result?.content) {
    const content = response.result.content;
    if (Array.isArray(content) && content.length > 0) {
      const textContent = content.find((item) => item.type === 'text');
      if (textContent?.text) {
        try {
          return JSON.parse(textContent.text);
        } catch (error) {
          return textContent.text;
        }
      }
    }
    return content;
  }

  return response;
}

/**
 * 处理错误并输出用户友好的消息
 * @param {Error} error - 错误对象
 */
function handleError(error) {
  console.error(chalk.red(`\n错误: ${error.message}`));

  if (error instanceof QccError) {
    if (error.suggestion) {
      console.error(chalk.yellow(`建议: ${error.suggestion}`));
    }
  } else {
    console.error(chalk.gray(`详细信息: ${error.stack}`));
  }

  if (error.recoverable) {
    console.log(chalk.yellow('建议: 这是一个临时性错误，可以稍后重试。'));
  }
}

module.exports = {
  ErrorType,
  QccError,
  isAuthErrorResponse,
  normalizeErrorData,
  sanitizeRequestUrl,
  createHttpClient,
  parseSSEResponse,
  extractMcpContent,
  handleError
};
