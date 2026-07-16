const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const packageMetadata = require('../../package.json');
const configService = require('./configService');
const {
  createHttpClient,
  QccError,
  ErrorType
} = require('../utils/httpClient');
const {
  getIdpErrorDescription,
  getIdpErrorExplanation,
  normalizeIdpErrorCode
} = require('../constants/idpErrors');
const { detectLocalFileEncryption } = require('../utils/idpDocumentEncryption');

const IDP_PARSE_ENDPOINT = '/idp/parse_document';
const IDP_CREATE_UPLOAD_URL_ENDPOINT = '/idp/create_upload_url';
const LOCAL_ENCRYPTION_PRECHECK_TYPES = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'jfif',
  'webp',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'wps',
  'et'
]);
const IDP_RESULT_ENDPOINT = '/idp/get_parse_result';
const IDP_NEXT_ACTION = 'get_parse_result';
const IDP_PROCESSING_MESSAGE = '任务已提交，解析处理中，请调用 get_parse_result 工具获取状态和结果。';
const IDP_SUCCESS_MESSAGE = '任务处理成功。';
const IDP_FAILED_MESSAGE = '任务处理失败。';
const IDP_UPLOAD_RESPONSE_INVALID_MESSAGE = '文档提交未完成，服务返回内容异常。';
const IDP_SERVICE_RESPONSE_INVALID_SUGGESTION = '请稍后重试；如持续失败，请联系管理员排查文档提交服务。';
const IDP_SERVICE_FAILURE_SUGGESTION = '请检查网络连接和授权配置，或稍后重试。';
const DEFAULT_IDP_TIMEOUT_MS = configService.DEFAULT_CONFIG.mcp.timeout;
const DEFAULT_UPLOAD_TOTAL_TIMEOUT_MS = 300000;
const DEFAULT_PARSE_DOCUMENT_TIMEOUT_MS = 300000;
const DEFAULT_UPLOAD_CONNECT_TIMEOUT_MS = 30000;
const DEFAULT_UPLOAD_IDLE_TIMEOUT_MS = 10000;
const DEFAULT_UPLOAD_RESPONSE_WAIT_TIMEOUT_MS = 60000;
const MAX_UPLOAD_ERROR_RESPONSE_BYTES = 64 * 1024;
const IDP_AUTH_FAILED_CODE = 200215;
const uploadHttpAgent = new http.Agent({
  keepAlive: false,
  maxSockets: 1,
  maxFreeSockets: 0
});
const uploadHttpsAgent = new https.Agent({
  keepAlive: false,
  maxSockets: 1,
  maxFreeSockets: 0
});
// Node falls back to the default when maxFreeSockets is passed as 0.
uploadHttpAgent.maxFreeSockets = 0;
uploadHttpsAgent.maxFreeSockets = 0;
let activeLocalUploads = 0;


function resolveIdpHttpConfig(env = process.env, userConfig = configService.load()) {
  void env;

  const mcpConfig = userConfig?.mcp || {};
  const baseUrl = mcpConfig.baseUrl || '';
  const authorization = mcpConfig.authorization || '';

  if (!baseUrl || !authorization) {
    throw new QccError(ErrorType.CONFIG_MISSING_FIELD, 'MCP 配置不完整', {
      suggestion: '请补充配置:\n' +
        '  qcc init --authorization <token>  配置授权信息\n' +
        '  qcc check                         检查配置状态'
    });
  }

  return {
    baseUrl,
    authorization,
    timeout: mcpConfig.timeout || DEFAULT_IDP_TIMEOUT_MS
  };
}

function buildEndpoint(baseUrl, path) {
  return `${baseUrl}${path}`;
}

function isIdpEnvelope(data) {
  return data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'status');
}

function normalizeHttpResponse(response) {
  if (isIdpEnvelope(response.data)) {
    const normalized = normalizeIdpEnvelope(response.data);
    throwIdpAuthErrorIfNeeded(normalized);
    return normalized;
  }

  if (response.status >= 400) {
    throw new QccError(ErrorType.MCP_ERROR, response.data?.message || `IDP HTTP Gateway 请求失败: ${response.status}`, {
      code: response.status,
      suggestion: '请检查请求参数、鉴权配置和 gateway 状态'
    });
  }

  return response.data;
}

function throwIdpAuthErrorIfNeeded(normalized) {
  if (normalized?.status !== 'failed' || normalized?.error?.code !== IDP_AUTH_FAILED_CODE) {
    return;
  }

  throw new QccError(ErrorType.AUTH_FAILED, normalized.error.description || normalized.message || '身份认证失败', {
    code: IDP_AUTH_FAILED_CODE,
    suggestion: '身份凭证错误，请检查 Authorization 是否正确，或运行 qcc init 更新配置'
  });
}

function normalizeIdpEnvelope(envelope) {
  const status = toPublicIdpStatus(envelope.status);
  const error = normalizeIdpError(envelope.error, status);
  const normalized = {
    task_id: normalizeTaskId(envelope.task_id),
    status,
    message: getIdpPublicMessage(status, error)
  };

  if (status === 'processing') {
    normalized.next_action = IDP_NEXT_ACTION;
  }

  const details = compactDetails(envelope.details);
  if (details !== undefined) {
    normalized.details = details;
  }

  if (error) {
    normalized.error = error;
  }

  return normalized;
}

function toPublicIdpStatus(status) {
  if (status === 'success' || status === 'failed') {
    return status;
  }

  if (status === 'submitting' || status === 'pending' || status === 'processing') {
    return 'processing';
  }

  return 'failed';
}

function getIdpPublicMessage(status, error) {
  if (status === 'processing') {
    return IDP_PROCESSING_MESSAGE;
  }

  if (status === 'success') {
    return IDP_SUCCESS_MESSAGE;
  }

  return error ? buildFailedMessage(error) : IDP_FAILED_MESSAGE;
}

function buildFailedMessage(error) {
  const description = normalizeSentence(error.description || getIdpErrorDescription(error.code));
  const explanation = typeof error.explanation === 'string' ? error.explanation.trim() : '';

  if (!explanation || stripEndingPunctuation(explanation) === stripEndingPunctuation(description)) {
    return ensureSentenceEnding(description);
  }

  return `${stripEndingPunctuation(description)}，${ensureSentenceEnding(explanation)}`;
}

function normalizeSentence(value) {
  return value.trim() || IDP_FAILED_MESSAGE;
}

function stripEndingPunctuation(value) {
  return value.trim().replace(/[。.!！?？]+$/u, '');
}

function ensureSentenceEnding(value) {
  const trimmed = value.trim();
  return /[。.!！?？]$/u.test(trimmed) ? trimmed : `${trimmed}。`;
}

function normalizeTaskId(taskId) {
  return typeof taskId === 'string' && taskId.length > 0 ? taskId : null;
}

function normalizeIdpError(error, status) {
  if (status !== 'failed') {
    return null;
  }

  if (!error || typeof error !== 'object') {
    return {
      code: 400299,
      description: getIdpErrorDescription(400299),
      explanation: getIdpErrorExplanation(400299, getIdpErrorDescription(400299))
    };
  }

  const code = normalizeIdpErrorCode(error.code);
  const description = typeof error.description === 'string' && error.description.trim()
    ? error.description
    : getIdpErrorDescription(code);
  const explanation = getIdpErrorExplanation(code, description, error.explanation || error.description);
  const normalized = {
    code,
    description,
    explanation
  };

  if (error.details !== undefined && error.details !== null) {
    normalized.details = error.details;
  }

  return normalized;
}

function compactDetails(details) {
  if (details === null || details === undefined) {
    return undefined;
  }

  const compacted = compactNullishFields(details);
  if (Array.isArray(compacted) && compacted.length === 0) {
    return undefined;
  }

  return compacted;
}

function compactNullishFields(value) {
  if (Array.isArray(value)) {
    return value.map(item => compactNullishFields(item));
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== null && item !== undefined)
      .map(([key, item]) => [key, compactNullishFields(item)])
  );
}

function buildJsonParsePayload(payload) {
  const body = {};

  if (payload.upload_file_id) {
    body.upload_file_id = payload.upload_file_id;
  } else if (payload.file_url) {
    body.file_url = payload.file_url;
  }

  if (typeof payload.wait === 'boolean') {
    body.wait = payload.wait;
  }
  if (payload.start_page_id !== undefined) {
    body.start_page_id = payload.start_page_id;
  }
  if (payload.end_page_id !== undefined) {
    body.end_page_id = payload.end_page_id;
  }

  return body;
}

function buildGatewayJsonOptions(remoteConfig) {
  return {
    headers: {
      Authorization: remoteConfig.authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      source: packageMetadata.name,
      'source-version': packageMetadata.version
    },
    timeout: DEFAULT_PARSE_DOCUMENT_TIMEOUT_MS,
    validateStatus: () => true
  };
}

function selectUploadHeaders(headers) {
  return {
    'Content-Type': headers['Content-Type'],
    'Content-Length': headers['Content-Length'],
    'QCC-Upload-Source': headers['QCC-Upload-Source'],
    ...(headers['QCC-Upload-Version'] === undefined
      ? {}
      : { 'QCC-Upload-Version': headers['QCC-Upload-Version'] })
  };
}

function buildRawUploadRequestConfig(upload, fileStream) {
  return {
    url: upload.upload_url,
    method: upload.method,
    headers: selectUploadHeaders(upload.headers),
    fileStream,
    totalTimeoutMs: DEFAULT_UPLOAD_TOTAL_TIMEOUT_MS,
    connectTimeoutMs: DEFAULT_UPLOAD_CONNECT_TIMEOUT_MS,
    uploadIdleTimeoutMs: DEFAULT_UPLOAD_IDLE_TIMEOUT_MS,
    responseWaitTimeoutMs: DEFAULT_UPLOAD_RESPONSE_WAIT_TIMEOUT_MS,
    maxResponseBytes: MAX_UPLOAD_ERROR_RESPONSE_BYTES
  };
}

function createUploadTimeoutError(message) {
  return new QccError(ErrorType.TIMEOUT, message, {
    code: 100219,
    recoverable: true,
    suggestion: message === '文档上传响应等待超时'
      ? '文档提交结果未确认，请稍后重新提交。'
      : '文档提交未完成，请检查网络后重新提交。'
  });
}

function isUploadTransportTimeoutError(error) {
  const message = error && error.message ? String(error.message) : String(error);
  const code = error && error.code ? String(error.code) : '';
  return /timed?\s*out|timeout|超时/i.test(message)
    || code === 'ETIMEDOUT'
    || code === 'ECONNABORTED';
}

function createUploadResponseTooLargeError(statusCode) {
  if (statusCode === 504) {
    return createUploadTimeoutError('文档上传响应等待超时');
  }

  return new QccError(ErrorType.MCP_ERROR, IDP_UPLOAD_RESPONSE_INVALID_MESSAGE, {
    suggestion: IDP_SERVICE_RESPONSE_INVALID_SUGGESTION
  });
}

function normalizeUploadResponseBody(buffer) {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  const text = buffer.toString('utf8').trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function createRawUploadClient(options = {}) {
  const requestFactory = options.requestFactory || ((url, requestOptions, onResponse) => {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === 'https:' ? https : http;
    return transport.request(parsedUrl, requestOptions, onResponse);
  });

  return function rawUploadClient(config) {
    return new Promise((resolve, reject) => {
      const {
        url,
        method = 'PUT',
        headers,
        fileStream,
        totalTimeoutMs = DEFAULT_UPLOAD_TOTAL_TIMEOUT_MS,
        connectTimeoutMs = DEFAULT_UPLOAD_CONNECT_TIMEOUT_MS,
        uploadIdleTimeoutMs = DEFAULT_UPLOAD_IDLE_TIMEOUT_MS,
        responseWaitTimeoutMs = DEFAULT_UPLOAD_RESPONSE_WAIT_TIMEOUT_MS,
        maxResponseBytes = MAX_UPLOAD_ERROR_RESPONSE_BYTES
      } = config;

      let settled = false;
      let requestFinished = false;
      let connected = false;
      let request = null;
      let response = null;
      let socket = null;
      let connectTimer = null;
      let totalTimer = null;
      let uploadIdleTimer = null;
      let responseWaitTimer = null;
      const responseChunks = [];
      let responseBytes = 0;

      function clearTimer(timer) {
        if (timer) {
          clearTimeout(timer);
        }
      }

      function clearConnectTimer() {
        clearTimer(connectTimer);
        connectTimer = null;
      }

      function clearUploadIdleTimer() {
        clearTimer(uploadIdleTimer);
        uploadIdleTimer = null;
      }

      function clearResponseWaitTimer() {
        clearTimer(responseWaitTimer);
        responseWaitTimer = null;
      }

      function clearTotalTimer() {
        clearTimer(totalTimer);
        totalTimer = null;
      }

      function cleanup({ preserveErrorListeners = false } = {}) {
        clearConnectTimer();
        clearUploadIdleTimer();
        clearResponseWaitTimer();
        clearTotalTimer();

        if (socket) {
          socket.removeListener('connect', handleConnected);
          socket.removeListener('secureConnect', handleConnected);
        }

        if (request) {
          request.removeListener('drain', handleRequestDrain);
          if (!preserveErrorListeners && !request.destroyed) {
            request.removeListener('error', handleRequestError);
          }
          request.removeListener('finish', handleRequestFinish);
        }

        if (response) {
          response.removeListener('data', handleResponseData);
          if (!preserveErrorListeners) {
            response.removeListener('error', handleResponseError);
          }
          response.removeListener('end', finalizeResponse);
        }

        fileStream.removeListener('data', handleFileChunk);
        fileStream.removeListener('end', finalizeUploadBody);
        if (!preserveErrorListeners) {
          fileStream.removeListener('error', handleFileError);
        }
      }

      function safeDestroy(resource) {
        if (!resource || resource.destroyed || typeof resource.destroy !== 'function') {
          return;
        }

        try {
          resource.destroy();
        } catch {
          // Promise rejection is the upload failure channel; teardown errors must not crash the CLI.
        }
      }

      function settleSuccess(result, stopIncompleteRequest = false) {
        if (settled) {
          return;
        }

        settled = true;
        cleanup({ preserveErrorListeners: stopIncompleteRequest });
        if (stopIncompleteRequest) {
          clearUploadIdleTimer();
          safeDestroy(fileStream);
          safeDestroy(request);
        }
        resolve(result);
      }

      function abortUpload(error) {
        if (settled) {
          return;
        }

        settled = true;
        cleanup({ preserveErrorListeners: true });
        safeDestroy(response);
        safeDestroy(request);
        safeDestroy(fileStream);
        reject(error);
      }

      function resetUploadIdleTimer() {
        if (!connected || uploadIdleTimeoutMs <= 0) {
          return;
        }

        clearUploadIdleTimer();
        uploadIdleTimer = setTimeout(() => {
          abortUpload(createUploadTimeoutError('文档上传空闲超时'));
        }, uploadIdleTimeoutMs);
      }

      function handleConnected() {
        connected = true;
        clearConnectTimer();
        resetUploadIdleTimer();
      }

      function handleUploadProgress() {
        resetUploadIdleTimer();
      }

      function handleFileChunk(chunk) {
        try {
          const canContinue = request.write(chunk);
          handleUploadProgress();
          if (canContinue === false && typeof fileStream.pause === 'function') {
            fileStream.pause();
          }
        } catch (error) {
          abortUpload(error);
        }
      }

      function finalizeUploadBody() {
        if (settled) {
          return;
        }
        clearUploadIdleTimer();
        request.end();
      }

      function handleFileError(error) {
        abortUpload(error);
      }

      function handleRequestError(error) {
        abortUpload(error);
      }

      function handleRequestClose() {
        request.removeListener('error', handleRequestError);
      }

      function handleRequestFinish() {
        requestFinished = true;
        startResponseWaitTimer();
      }

      function handleResponseError(error) {
        abortUpload(error);
      }

      function startResponseWaitTimer() {
        clearUploadIdleTimer();

        if (responseWaitTimeoutMs <= 0) {
          return;
        }

        clearResponseWaitTimer();
        responseWaitTimer = setTimeout(() => {
          abortUpload(createUploadTimeoutError('文档上传响应等待超时'));
        }, responseWaitTimeoutMs);
      }

      function handleResponseData(chunk) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
        responseBytes += buffer.length;

        if (responseBytes > maxResponseBytes) {
          abortUpload(createUploadResponseTooLargeError(response?.statusCode));
          return;
        }

        responseChunks.push(buffer);
      }

      function finalizeResponse() {
        clearResponseWaitTimer();
        settleSuccess({
          status: response.statusCode || 0,
          data: normalizeUploadResponseBody(Buffer.concat(responseChunks, responseBytes)),
          headers: response.headers
        }, !requestFinished);
      }

      function handleRequestDrain() {
        if (typeof fileStream.resume === 'function') {
          fileStream.resume();
        }
        handleUploadProgress();
      }

      try {
        const parsedUploadUrl = new URL(url);
        const uploadAgent = parsedUploadUrl.protocol === 'https:' ? uploadHttpsAgent : uploadHttpAgent;
        request = requestFactory(url, {
          method,
          headers,
          agent: uploadAgent
        }, (incomingResponse) => {
          response = incomingResponse;
          response.on('data', handleResponseData);
          response.once('error', handleResponseError);
          response.once('end', finalizeResponse);
        });
      } catch (error) {
        abortUpload(error);
        return;
      }

      request.once('socket', (assignedSocket) => {
        socket = assignedSocket;

        if (socket && socket.connecting === false && !socket.destroyed) {
          handleConnected();
          return;
        }

        if (socket) {
          socket.once('connect', handleConnected);
          socket.once('secureConnect', handleConnected);
        }
      });
      request.on('drain', handleRequestDrain);
      request.once('finish', handleRequestFinish);
      request.once('error', handleRequestError);
      request.once('close', handleRequestClose);

      if (connectTimeoutMs > 0) {
        connectTimer = setTimeout(() => {
          abortUpload(createUploadTimeoutError('文档上传连接超时'));
        }, connectTimeoutMs);
      }

      if (totalTimeoutMs > 0) {
        totalTimer = setTimeout(() => {
          abortUpload(createUploadTimeoutError('文档上传总超时'));
        }, totalTimeoutMs);
      }

      fileStream.on('data', handleFileChunk);
      fileStream.once('end', finalizeUploadBody);
      fileStream.once('error', handleFileError);
    });
  };
}

function normalizeCreateUploadUrlResponse(response) {
  const data = normalizeHttpResponse(response);
  if (isIdpEnvelope(data)) {
    return data;
  }

  if (!isCreateUploadUrlResponse(data)) {
    throw new QccError(ErrorType.MCP_ERROR, IDP_UPLOAD_RESPONSE_INVALID_MESSAGE, {
      code: 400204,
      suggestion: IDP_SERVICE_RESPONSE_INVALID_SUGGESTION
    });
  }

  return data;
}

function normalizeUploadServiceResponse(response, upload) {
  const errorCode = mapUploadServiceStatus(response.status);
  if (errorCode) {
    const description = getIdpErrorDescription(errorCode);
    throw new QccError(ErrorType.MCP_ERROR, description, {
      code: errorCode,
      suggestion: getIdpErrorExplanation(errorCode, description, description)
    });
  }

  return upload;
}

function isCreateUploadUrlResponse(value) {
  return value && typeof value === 'object' &&
    typeof value.upload_url === 'string' && value.upload_url.trim() &&
    typeof value.upload_file_id === 'string' && value.upload_file_id.trim() &&
    value.method === 'PUT' &&
    Number.isSafeInteger(value.expires_in) && value.expires_in > 0 &&
    value.headers && typeof value.headers === 'object' &&
    typeof value.headers['Content-Type'] === 'string' &&
    typeof value.headers['Content-Length'] === 'string' &&
    typeof value.headers['QCC-Upload-Source'] === 'string' &&
    (value.headers['QCC-Upload-Version'] === undefined || typeof value.headers['QCC-Upload-Version'] === 'string');
}

function mapUploadServiceStatus(status) {
  if (status === 204) return null;
  if (status === 400) return 100220;
  if ([403, 408, 502, 503, 504].includes(status)) return 100219;
  if (status === 413) return 100205;
  if (status === 429) return 100221;
  if (status === 500 || status >= 500) return 400299;
  return 400204;
}

async function uploadLocalFileToGateway(file, remoteConfig, httpClient, rawUploadClient) {
  if (activeLocalUploads >= 1) {
    throw new QccError(ErrorType.MCP_ERROR, '文档提交频繁', {
      code: 100218,
      suggestion: '文档提交较为频繁，已触发提交保护，本次请求暂未提交。请稍后再试。'
    });
  }

  activeLocalUploads += 1;
  let fileStream;

  try {
    const createResponse = await httpClient.post(
      buildEndpoint(remoteConfig.baseUrl, IDP_CREATE_UPLOAD_URL_ENDPOINT),
      {
        file_name: file.file_name,
        file_size: file.file_size,
        content_type: file.content_type
      },
      buildGatewayJsonOptions(remoteConfig)
    );
    const upload = normalizeCreateUploadUrlResponse(createResponse);
    if (isIdpEnvelope(upload)) {
      return upload;
    }

    fileStream = fs.createReadStream(file.file_path);
    const uploadResponse = await rawUploadClient(buildRawUploadRequestConfig(upload, fileStream));
    return normalizeUploadServiceResponse(uploadResponse, upload);
  } catch (error) {
    if (error instanceof QccError) {
      throw error;
    }
    if (isUploadTransportTimeoutError(error)) {
      throw createUploadTimeoutError('文档上传连接中断');
    }
    const description = getIdpErrorDescription(400299);
    throw createCliIdpError(400299, description);
  } finally {
    if (fileStream && !fileStream.destroyed) {
      fileStream.destroy();
    }

    activeLocalUploads -= 1;
  }
}
function redactSignedUrlQuery(value) {
  return String(value || '').replace(/(https?:\/\/[^\s?#'"<>]+)\?[^\s'"<>]*/g, '$1?[已省略签名参数]');
}

function createCliIdpError(code, message, explanationOverride, details) {
  return new QccError(ErrorType.MCP_ERROR, message, {
    code,
    suggestion: typeof explanationOverride === 'string'
      ? explanationOverride
      : getIdpErrorExplanation(code, message, message),
    ...(details !== undefined ? { details } : {})
  });
}

function shouldRunLocalEncryptionPrecheck(fileType) {
  return LOCAL_ENCRYPTION_PRECHECK_TYPES.has(String(fileType || '').toLowerCase());
}

function buildLocalEncryptionErrorDetails(encryptionResult) {
  return {
    source: 'local',
    encryption_status: encryptionResult.status,
    reason_code: encryptionResult.reasonCode,
    file_type: encryptionResult.fileType
  };
}

async function parseDocument(payload, options = {}) {
  const remoteConfig = options.remoteConfig || resolveIdpHttpConfig();
  const httpClient = options.httpClient || createHttpClient();
  const rawUploadClient = options.rawUploadClient || createRawUploadClient();
  const localFile = payload.files?.[0];
  const parsePayload = { ...payload };
  delete parsePayload.upload_file_id;

  try {
    if (localFile) {
      if (shouldRunLocalEncryptionPrecheck(localFile.file_type)) {
        const encryptionDetector = options.encryptionDetector || { detectLocalFileEncryption };
        const encryptionResult = await encryptionDetector.detectLocalFileEncryption({
          filePath: localFile.file_path,
          fileType: localFile.file_type
        });

        if (encryptionResult.status === 'encrypted') {
          throw createCliIdpError(
            100222,
            '暂不支持加密文档，请先取消密码保护后重新提交。',
            undefined,
            buildLocalEncryptionErrorDetails(encryptionResult)
          );
        }

        if (encryptionResult.status === 'unknown') {
          throw createCliIdpError(
            100222,
            '无法确认文档是否加密，请更换未加密且格式正常的文档后重试。',
            '无法确认文档是否加密，请更换未加密且格式正常的文档后重试。',
            buildLocalEncryptionErrorDetails(encryptionResult)
          );
        }
      }

      const upload = await uploadLocalFileToGateway(localFile, remoteConfig, httpClient, rawUploadClient);
      if (isIdpEnvelope(upload)) {
        return upload;
      }
      delete parsePayload.file_url;
      parsePayload.upload_file_id = upload.upload_file_id.trim();
    }

    if (!parsePayload.file_url && !parsePayload.upload_file_id) {
      throw new QccError(ErrorType.MCP_ERROR, '请指定 1 个文档来源。', {
        suggestion: '请提供 --file_path 或 --file_url。'
      });
    }

    const response = await httpClient.post(
      buildEndpoint(remoteConfig.baseUrl, IDP_PARSE_ENDPOINT),
      buildJsonParsePayload(parsePayload),
      buildGatewayJsonOptions(remoteConfig)
    );

    return normalizeHttpResponse(response);
  } catch (error) {
    if (error instanceof QccError) {
      throw error;
    }

    throw new QccError(ErrorType.MCP_ERROR, `调用文档解析服务失败: ${redactSignedUrlQuery(error.message)}`, {
      suggestion: IDP_SERVICE_FAILURE_SUGGESTION
    });
  }
}

async function getParseResult(taskId, options = {}) {
  const remoteConfig = options.remoteConfig || resolveIdpHttpConfig();
  const httpClient = options.httpClient || createHttpClient();

  try {
    const response = await httpClient.get(
      buildEndpoint(remoteConfig.baseUrl, `${IDP_RESULT_ENDPOINT}/${encodeURIComponent(taskId)}`),
      {
        headers: {
          Authorization: remoteConfig.authorization,
          Accept: 'application/json'
        },
        timeout: remoteConfig.timeout,
        validateStatus: () => true
      }
    );

    return normalizeHttpResponse(response);
  } catch (error) {
    if (error instanceof QccError) {
      throw error;
    }

    throw new QccError(ErrorType.MCP_ERROR, `调用文档解析服务失败: ${error.message}`, {
      suggestion: IDP_SERVICE_FAILURE_SUGGESTION
    });
  }
}

module.exports = {
  IDP_PARSE_ENDPOINT,
  IDP_RESULT_ENDPOINT,
  createRawUploadClient,
  DEFAULT_IDP_TIMEOUT_MS,
  getParseResult,
  normalizeHttpResponse,
  parseDocument,
  resolveIdpHttpConfig
};

