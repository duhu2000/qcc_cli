/* eslint-env jest */

const { EventEmitter } = require('events');
const packageMetadata = require('../../package.json');

const {
  createRawUploadClient,
  DEFAULT_IDP_TIMEOUT_MS,
  getParseResult,
  normalizeHttpResponse,
  parseDocument,
  resolveIdpHttpConfig
} = require('./idpService');

const PROCESSING_MESSAGE = '任务已提交，解析处理中，请调用 get_parse_result 工具获取状态和结果。';
const SUCCESS_MESSAGE = '任务处理成功。';
const UPLOAD_RESPONSE_INVALID_MESSAGE = '文档提交未完成，服务返回内容异常。';
const SERVICE_RESPONSE_INVALID_SUGGESTION = '请稍后重试；如持续失败，请联系管理员排查文档提交服务。';
const IDP_SERVICE_FAILURE_SUGGESTION = '请检查网络连接和授权配置，或稍后重试。';

function expectNoInternalUploadTroubleshootingText(error) {
  const publicText = String(error.message || '') + '\n' + String(error.suggestion || '');
  expect(publicText).not.toMatch(/gateway|\/idp\/upload_file|upload_file_id/i);
}

function buildLocalFilePayload() {
  return {
    files: [
      {
        file_path: __filename,
        file_name: 'idpService.test.js',
        file_type: 'pdf',
        content_type: 'application/pdf',
        file_size: 1
      }
    ]
  };
}

function createNotEncryptedDetector() {
  return {
    detectLocalFileEncryption: jest.fn().mockResolvedValue({
      status: 'not_encrypted',
      sourceType: 'local',
      fileType: 'pdf',
      reasonCode: 'PDF_NOT_ENCRYPTED'
    })
  };
}

function createFakeRequest() {
  const request = new EventEmitter();
  request.destroyed = false;
  request.write = jest.fn(() => true);
  request.end = jest.fn(() => {
    request.emit('finish');
  });
  request.destroy = jest.fn(() => {
    if (request.destroyed) {
      return request;
    }

    request.destroyed = true;
    return request;
  });

  return request;
}

function createFakeFileStream() {
  const fileStream = new EventEmitter();
  fileStream.destroyed = false;
  fileStream.pause = jest.fn();
  fileStream.resume = jest.fn();
  fileStream.destroy = jest.fn(() => {
    fileStream.destroyed = true;
    return fileStream;
  });

  return fileStream;
}

function createRawUploadHarness() {
  const request = createFakeRequest();
  let responseHandler = null;
  const requestFactory = jest.fn((url, options, onResponse) => {
    responseHandler = onResponse;
    return request;
  });

  return {
    rawUploadClient: createRawUploadClient({ requestFactory }),
    request,
    requestFactory,
    getResponseHandler: () => responseHandler
  };
}

describe('idp service configuration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('uses mcp config file values for IDP HTTP calls', () => {
    const config = {
      idp: {
        baseUrl: 'https://idp-config.example.com',
        authorization: 'Bearer CONFIG',
        timeout: 30
      },
      mcp: {
        baseUrl: 'https://agent.qcc.com/mcp',
        authorization: 'Bearer MCP',
        timeout: 30000
      }
    };

    const result = resolveIdpHttpConfig({}, config);

    expect(result).toEqual({
      baseUrl: 'https://agent.qcc.com/mcp',
      authorization: 'Bearer MCP',
      timeout: 30000
    });
  });

  test('ignores document environment variables and retired idp config values', () => {
    const result = resolveIdpHttpConfig({
      QCC_DOCUMENT_URL: 'http://localhost:8401/idp/parse_document',
      QCC_DOCUMENT_AUTHORIZATION: 'Bearer ENV',
      QCC_DOCUMENT_TIMEOUT_SECONDS: '123'
    }, {
      idp: {
        baseUrl: 'https://idp-config.example.com',
        authorization: 'Bearer CONFIG',
        timeout: 321
      },
      mcp: {
        baseUrl: 'https://agent.qcc.com/mcp',
        authorization: 'Bearer MCP',
        timeout: 30000
      }
    });

    expect(result).toEqual({
      baseUrl: 'https://agent.qcc.com/mcp',
      authorization: 'Bearer MCP',
      timeout: 30000
    });
  });

  test('uses configured gateway URL as-is without protocol validation', () => {
    const result = resolveIdpHttpConfig({}, {
      mcp: {
        baseUrl: 'localhost:8401/idp',
        authorization: 'Bearer MCP'
      }
    });

    expect(result.baseUrl).toBe('localhost:8401/idp');
  });

  test('requires complete mcp config', () => {
    expect(() => resolveIdpHttpConfig({}, {
      mcp: {
        baseUrl: 'https://agent.qcc.com/mcp'
      }
    })).toThrow('MCP 配置不完整');
  });

  test('uses default MCP timeout when config omits timeout', () => {
    const result = resolveIdpHttpConfig({}, {
      mcp: {
        baseUrl: 'https://agent.qcc.com/mcp',
        authorization: 'Bearer MCP'
      }
    });

    expect(result.baseUrl).toBe('https://agent.qcc.com/mcp');
    expect(result.timeout).toBe(30000);
    expect(result.timeout).toBe(DEFAULT_IDP_TIMEOUT_MS);
  });

  test('does not read retired QCC_MCP environment variables for IDP', () => {
    expect(() => resolveIdpHttpConfig({
      QCC_MCP_URL: 'http://localhost:8401',
      QCC_MCP_TOKEN: 'Bearer OLD',
      QCC_MCP_TIMEOUT_MS: '123000'
    }, null)).toThrow('MCP 配置不完整');
  });

  test('parseDocument uploads local file to Gateway then posts JSON parse_document', async () => {
    const rawUploadClient = jest.fn().mockResolvedValue({
      status: 200,
      data: {
        upload_file_id: 'qcc_upload_1',
        expires_in: 300,
        file_name: 'idpService.test.js',
        file_size: 1,
        content_type: 'application/pdf'
      }
    });
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          task_id: 'qcc_idp_1',
          status: 'pending',
          next_action: 'get_parse_result'
        }
      })
    };

    const result = await parseDocument({
      ...buildLocalFilePayload(),
      wait: true,
      start_page_id: 0,
      end_page_id: 2
    }, {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient,
      rawUploadClient,
      encryptionDetector: createNotEncryptedDetector()
    });

    expect(result).toEqual({
      task_id: 'qcc_idp_1',
      status: 'processing',
      message: PROCESSING_MESSAGE,
      next_action: 'get_parse_result'
    });
    expect(rawUploadClient).toHaveBeenCalledWith(expect.objectContaining({
      url: 'http://localhost:8401/idp/upload_file',
      headers: expect.objectContaining({
        Authorization: 'Bearer TOKEN',
        Accept: 'application/json',
        'Content-Type': 'application/pdf',
        'Content-Length': '1',
        'X-QCC-File-Name': encodeURIComponent('idpService.test.js'),
        source: packageMetadata.name,
        'source-version': packageMetadata.version
      }),
      totalTimeoutMs: 300000,
      connectTimeoutMs: 30000,
      uploadIdleTimeoutMs: 10000,
      responseWaitTimeoutMs: 60000,
      maxResponseBytes: 65536,
      fileStream: expect.anything()
    }));
    const uploadedStream = rawUploadClient.mock.calls[0][0].fileStream;
    expect(uploadedStream.path).toBe(__filename);
    expect(uploadedStream.destroyed).toBe(true);
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(httpClient.post).toHaveBeenNthCalledWith(1, 'http://localhost:8401/idp/parse_document', {
      upload_file_id: 'qcc_upload_1',
      wait: true,
      start_page_id: 0,
      end_page_id: 2
    }, expect.objectContaining({
      timeout: 300000
    }));
  });

  test('parseDocument preserves unsupported local file type semantics by skipping encryption precheck', async () => {
    const rawUploadClient = jest.fn().mockResolvedValueOnce({
      status: 200,
      data: {
        upload_file_id: 'qcc_upload_zip_1'
      }
    });
    const httpClient = {
      post: jest.fn().mockResolvedValueOnce({
        status: 200,
        data: {
          task_id: null,
          status: 'failed',
          error: {
            code: 100207,
            description: '暂不支持 ZIP',
            explanation: '当前不支持 ZIP 压缩包，请上传解压后的支持格式文件。'
          }
        }
      })
    };
    const encryptionDetector = {
      detectLocalFileEncryption: jest.fn(() => {
        throw new Error('encryption detector should not run for unsupported local types');
      })
    };
    const payload = buildLocalFilePayload();
    payload.files[0] = {
      ...payload.files[0],
      file_name: 'archive.zip',
      file_type: 'zip',
      content_type: 'application/zip'
    };

    const result = await parseDocument(payload, {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient,
      rawUploadClient,
      encryptionDetector
    });

    expect(encryptionDetector.detectLocalFileEncryption).not.toHaveBeenCalled();
    expect(rawUploadClient).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'application/zip',
        'X-QCC-File-Name': encodeURIComponent('archive.zip')
      })
    }));
    expect(httpClient.post).toHaveBeenCalledWith(
      'http://localhost:8401/idp/parse_document',
      { upload_file_id: 'qcc_upload_zip_1' },
      expect.anything()
    );
    expect(result).toMatchObject({
      task_id: null,
      status: 'failed',
      error: expect.objectContaining({ code: 100207 })
    });
  });

  test('raw upload connect timeout is cleared only by a socket connection event', async () => {
    const harness = createRawUploadHarness();
    const uploadStream = createFakeFileStream();
    const socket = new EventEmitter();
    socket.connecting = true;

    const uploadPromise = harness.rawUploadClient({
      url: 'http://localhost:8401/idp/upload_file',
      headers: {
        Authorization: 'Bearer TOKEN'
      },
      fileStream: uploadStream,
      totalTimeoutMs: 500,
      connectTimeoutMs: 20,
      uploadIdleTimeoutMs: 10,
      responseWaitTimeoutMs: 30,
      maxResponseBytes: 65536
    });

    harness.request.emit('socket', socket);
    uploadStream.emit('data', Buffer.from('chunk-1')); 

    const uploadError = await uploadPromise.then(() => null, (error) => error);

    expect(uploadError).toMatchObject({
      type: 'TIMEOUT',
      code: 100219,
      message: '文档上传连接超时'
    });
    expect(harness.requestFactory).toHaveBeenCalledTimes(1);
    expect(harness.request.write).toHaveBeenCalled();
    expect(harness.request.destroy).toHaveBeenCalled();
    expect(uploadStream.destroyed).toBe(true);
  });

  test('raw upload idle timeout aborts when upload progress stalls', async () => {
    const harness = createRawUploadHarness();
    const uploadStream = createFakeFileStream();
    const socket = new EventEmitter();
    socket.connecting = true;

    const uploadPromise = harness.rawUploadClient({
      url: 'http://localhost:8401/idp/upload_file',
      headers: {
        Authorization: 'Bearer TOKEN'
      },
      fileStream: uploadStream,
      totalTimeoutMs: 500,
      connectTimeoutMs: 30,
      uploadIdleTimeoutMs: 20,
      responseWaitTimeoutMs: 30,
      maxResponseBytes: 65536
    });

    harness.request.emit('socket', socket);
    socket.emit('connect');
    uploadStream.emit('data', Buffer.from('chunk-1')); 

    const uploadError = await uploadPromise.then(() => null, (error) => error);

    expect(uploadError).toMatchObject({
      type: 'TIMEOUT',
      code: 100219,
      message: '文档上传空闲超时'
    });
    expect(harness.request.destroy).toHaveBeenCalled();
    expect(uploadStream.destroyed).toBe(true);
  });

  test('raw upload response wait timeout aborts after upload finishes without a response', async () => {
    const harness = createRawUploadHarness();
    const uploadStream = createFakeFileStream();
    const socket = new EventEmitter();
    socket.connecting = true;

    const uploadPromise = harness.rawUploadClient({
      url: 'https://localhost:8401/idp/upload_file',
      headers: {
        Authorization: 'Bearer TOKEN'
      },
      fileStream: uploadStream,
      totalTimeoutMs: 500,
      connectTimeoutMs: 30,
      uploadIdleTimeoutMs: 20,
      responseWaitTimeoutMs: 20,
      maxResponseBytes: 65536
    });

    harness.request.emit('socket', socket);
    socket.emit('secureConnect');
    uploadStream.emit('data', Buffer.from('chunk-1'));
    uploadStream.emit('end');

    const uploadError = await uploadPromise.then(() => null, (error) => error);

    expect(uploadError).toMatchObject({
      type: 'TIMEOUT',
      code: 100219,
      message: '文档上传响应等待超时'
    });
    expect(harness.request.end).toHaveBeenCalled();
    expect(harness.request.destroy).toHaveBeenCalled();
  });

  test('raw upload total timeout keeps submit-incomplete code', async () => {
    const harness = createRawUploadHarness();
    const uploadStream = createFakeFileStream();

    const uploadPromise = harness.rawUploadClient({
      url: 'http://localhost:8401/idp/upload_file',
      headers: {
        Authorization: 'Bearer TOKEN'
      },
      fileStream: uploadStream,
      totalTimeoutMs: 20,
      connectTimeoutMs: 500,
      uploadIdleTimeoutMs: 500,
      responseWaitTimeoutMs: 500,
      maxResponseBytes: 65536
    });

    const uploadError = await uploadPromise.then(() => null, (error) => error);

    expect(uploadError).toMatchObject({
      type: 'TIMEOUT',
      code: 100219,
      message: '文档上传总超时'
    });
    expect(harness.request.destroy).toHaveBeenCalled();
    expect(uploadStream.destroyed).toBe(true);
  });

  test('raw upload maps HTTP 504 response read limit to upload timeout', async () => {
    const harness = createRawUploadHarness();
    const uploadStream = createFakeFileStream();
    const uploadPromise = harness.rawUploadClient({
      url: 'http://localhost:8401/idp/upload_file',
      headers: { Authorization: 'Bearer TOKEN' },
      fileStream: uploadStream,
      totalTimeoutMs: 500,
      connectTimeoutMs: 20,
      uploadIdleTimeoutMs: 20,
      responseWaitTimeoutMs: 20,
      maxResponseBytes: 4
    });

    harness.request.emit('socket', new EventEmitter());
    uploadStream.emit('end');
    const responseHandler = harness.getResponseHandler();
    const response = new EventEmitter();
    response.statusCode = 504;
    response.headers = {};
    responseHandler(response);
    response.emit('data', Buffer.from('12345'));

    await expect(uploadPromise).rejects.toMatchObject({
      type: 'TIMEOUT',
      code: 100219
    });
  });

  test('raw upload hides non-timeout response read limits from users', async () => {
    const harness = createRawUploadHarness();
    const uploadStream = createFakeFileStream();
    const uploadPromise = harness.rawUploadClient({
      url: 'http://localhost:8401/idp/upload_file',
      headers: { Authorization: 'Bearer TOKEN' },
      fileStream: uploadStream,
      totalTimeoutMs: 500,
      connectTimeoutMs: 20,
      uploadIdleTimeoutMs: 20,
      responseWaitTimeoutMs: 20,
      maxResponseBytes: 4
    });

    harness.request.emit('socket', new EventEmitter());
    uploadStream.emit('end');
    const responseHandler = harness.getResponseHandler();
    const response = new EventEmitter();
    response.statusCode = 500;
    response.headers = {};
    responseHandler(response);
    response.emit('data', Buffer.from('12345'));

    let error;
    try {
      await uploadPromise;
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      type: 'MCP_ERROR',
      message: UPLOAD_RESPONSE_INVALID_MESSAGE,
      suggestion: SERVICE_RESPONSE_INVALID_SUGGESTION
    });
    expectNoInternalUploadTroubleshootingText(error);
  });

  test('raw upload request uses an upload-specific non-keepalive agent', async () => {
    const harness = createRawUploadHarness();
    const uploadStream = createFakeFileStream();

    const uploadPromise = harness.rawUploadClient({
      url: 'http://localhost:8401/idp/upload_file',
      headers: {
        Authorization: 'Bearer TOKEN'
      },
      fileStream: uploadStream,
      totalTimeoutMs: 500,
      connectTimeoutMs: 500,
      uploadIdleTimeoutMs: 500,
      responseWaitTimeoutMs: 500,
      maxResponseBytes: 65536
    }).catch(() => undefined);

    const requestOptions = harness.requestFactory.mock.calls[0][1];
    expect(requestOptions.agent).toMatchObject({
      keepAlive: false,
      maxSockets: 1,
      maxFreeSockets: 0
    });

    harness.request.emit('error', new Error('stop upload agent test'));
    await uploadPromise;
  });

  test('parseDocument rejects encrypted local files before upload_file is called', async () => {
    const rawUploadClient = jest.fn();
    const httpClient = {
      post: jest.fn()
    };
    const encryptionDetector = {
      detectLocalFileEncryption: jest.fn().mockResolvedValue({
        status: 'encrypted',
        sourceType: 'local',
        fileType: 'pdf',
        reasonCode: 'PDF_ENCRYPTED'
      })
    };

    await expect(parseDocument(buildLocalFilePayload(), {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient,
      rawUploadClient,
      encryptionDetector
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      code: 100222,
      message: '暂不支持加密文档，请先取消密码保护后重新提交。',
      suggestion: '暂不支持加密文档，请先取消密码保护后重新提交。',
      details: {
        source: 'local',
        encryption_status: 'encrypted',
        reason_code: 'PDF_ENCRYPTED',
        file_type: 'pdf'
      }
    });
    expect(encryptionDetector.detectLocalFileEncryption).toHaveBeenCalledWith({
      filePath: __filename,
      fileType: 'pdf'
    });
    expect(rawUploadClient).not.toHaveBeenCalled();
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('parseDocument rejects unknown local encryption state before upload_file is called', async () => {
    const rawUploadClient = jest.fn();
    const httpClient = {
      post: jest.fn()
    };
    const encryptionDetector = {
      detectLocalFileEncryption: jest.fn().mockResolvedValue({
        status: 'unknown',
        sourceType: 'local',
        fileType: 'pdf',
        reasonCode: 'PDF_ENCRYPTION_UNKNOWN'
      })
    };

    await expect(parseDocument(buildLocalFilePayload(), {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient,
      rawUploadClient,
      encryptionDetector
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      code: 100222,
      message: '无法确认文档是否加密，请更换未加密且格式正常的文档后重试。',
      suggestion: '无法确认文档是否加密，请更换未加密且格式正常的文档后重试。',
      details: {
        source: 'local',
        encryption_status: 'unknown',
        reason_code: 'PDF_ENCRYPTION_UNKNOWN',
        file_type: 'pdf'
      }
    });
    expect(encryptionDetector.detectLocalFileEncryption).toHaveBeenCalledWith({
      filePath: __filename,
      fileType: 'pdf'
    });
    expect(rawUploadClient).not.toHaveBeenCalled();
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('parseDocument stops before parse request when upload_file returns submit protection envelope', async () => {
    const rawUploadClient = jest.fn().mockResolvedValueOnce({
      status: 429,
      data: {
        task_id: null,
        status: 'failed',
        message: '文档提交频繁，文档提交较为频繁，已触发提交保护，本次请求暂未提交。请稍后再试。',
        error: {
          code: 100218,
          description: '文档提交频繁',
          explanation: '文档提交较为频繁，已触发提交保护，本次请求暂未提交。请稍后再试。',
          details: { reason: 'user_submit_protection' }
        }
      }
    });
    const httpClient = {
      post: jest.fn()
    };

    let error;
    try {
      await parseDocument(buildLocalFilePayload(), {
        remoteConfig: {
          baseUrl: 'http://localhost:8401',
          authorization: 'Bearer TOKEN',
          timeout: 1234
        },
        httpClient,
        rawUploadClient,
        encryptionDetector: createNotEncryptedDetector()
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      type: 'MCP_ERROR',
      code: 100218,
      suggestion: '文档提交较为频繁，已触发提交保护，本次请求暂未提交。请稍后再试。'
    });
    expect(error.message).toBe('文档提交频繁');
    expect(rawUploadClient).toHaveBeenCalledTimes(1);
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('parseDocument stops before parse request when upload_file fails with HTTP error', async () => {
    const rawUploadClient = jest.fn().mockResolvedValue({
      status: 413,
      data: {
        message: '文件超过大小限制'
      }
    });
    const httpClient = {
      post: jest.fn()
    };

    await expect(parseDocument(buildLocalFilePayload(), {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient,
      rawUploadClient,
      encryptionDetector: createNotEncryptedDetector()
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      message: '文件超过大小限制',
      code: 413
    });
    expect(rawUploadClient).toHaveBeenCalledTimes(1);
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test.each([
    ['empty body', null],
    ['non-json text', 'Gateway timeout'],
    ['non-envelope object', { message: 'Gateway timeout' }],
    ['unknown status object', { status: 'unknown' }]
  ])('parseDocument maps upload_file HTTP 504 %s to timeout', async (_name, data) => {
    const rawUploadClient = jest.fn().mockResolvedValueOnce({ status: 504, data });
    const httpClient = { post: jest.fn() };

    await expect(parseDocument({
      files: [{ file_path: __filename, file_type: 'pdf', start_page_id: 0, end_page_id: 0, wait: true }]
    }, {
      remoteConfig: { baseUrl: 'http://localhost:8401', authorization: 'Bearer TOKEN', timeout: 1234 },
      httpClient,
      rawUploadClient,
      encryptionDetector: createNotEncryptedDetector()
    })).rejects.toMatchObject({
      type: 'TIMEOUT',
      code: 100219
    });

    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('parseDocument preserves upload_file HTTP 504 failed envelope when it is not timeout code', async () => {
    const rawUploadClient = jest.fn().mockResolvedValueOnce({
      status: 504,
      data: {
        task_id: null,
        status: 'failed',
        message: '服务内部异常，文档提交暂未完成，请稍后再试。',
        error: {
          code: 400299,
          description: '服务内部异常',
          explanation: '文档提交暂未完成，请稍后再试。',
          details: { reason: 'idp_upload_file_failed' }
        }
      }
    });
    const httpClient = { post: jest.fn() };

    await expect(parseDocument({
      files: [{ file_path: __filename, file_type: 'pdf', start_page_id: 0, end_page_id: 0, wait: true }]
    }, {
      remoteConfig: { baseUrl: 'http://localhost:8401', authorization: 'Bearer TOKEN', timeout: 1234 },
      httpClient,
      rawUploadClient,
      encryptionDetector: createNotEncryptedDetector()
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      code: 400299
    });

    expect(httpClient.post).not.toHaveBeenCalled();
  });
  test.each([
    [429, null, 429],
    [401, 'unauthorized', 401],
    [403, { message: 'forbidden' }, 403],
    [400, { message: 'bad request' }, 400],
    [500, null, 500]
  ])('parseDocument does not map upload_file HTTP %s bad response to timeout', async (status, data, expectedCode) => {
    const rawUploadClient = jest.fn().mockResolvedValueOnce({ status, data });
    const httpClient = { post: jest.fn() };

    await expect(parseDocument({
      files: [{ file_path: __filename, file_type: 'pdf', start_page_id: 0, end_page_id: 0, wait: true }]
    }, {
      remoteConfig: { baseUrl: 'http://localhost:8401', authorization: 'Bearer TOKEN', timeout: 1234 },
      httpClient,
      rawUploadClient,
      encryptionDetector: createNotEncryptedDetector()
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      code: expectedCode
    });

    await expect(parseDocument({
      files: [{ file_path: __filename, file_type: 'pdf', start_page_id: 0, end_page_id: 0, wait: true }]
    }, {
      remoteConfig: { baseUrl: 'http://localhost:8401', authorization: 'Bearer TOKEN', timeout: 1234 },
      httpClient,
      rawUploadClient: jest.fn().mockResolvedValueOnce({ status, data }),
      encryptionDetector: createNotEncryptedDetector()
    })).rejects.not.toMatchObject({ code: 100219 });

    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('parseDocument destroys the file stream when upload_file rejects before parse request', async () => {
    let uploadStream = null;
    const rawUploadClient = jest.fn(async ({ fileStream }) => {
      uploadStream = fileStream;
      throw new Error('socket hang up');
    });

    const httpClient = {
      post: jest.fn()
    };

    await expect(parseDocument(buildLocalFilePayload(), {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient,
      rawUploadClient,
      encryptionDetector: createNotEncryptedDetector()
    })).rejects.toMatchObject({
      type: 'TIMEOUT',
      code: 100219
    });
    expect(rawUploadClient).toHaveBeenCalledTimes(1);
    expect(httpClient.post).not.toHaveBeenCalled();
    expect(uploadStream.destroyed).toBe(true);
  });

  test('parseDocument rejects upload_file responses with blank upload_file_id', async () => {
    const rawUploadClient = jest.fn().mockResolvedValueOnce({
      status: 200,
      data: {
        upload_file_id: '   ',
        expires_in: 300,
        file_name: 'idpService.test.js',
        file_size: 1,
        content_type: 'application/pdf'
      }
    });
    const httpClient = {
      post: jest.fn()
    };

    await expect(parseDocument(buildLocalFilePayload(), {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient,
      rawUploadClient,
      encryptionDetector: createNotEncryptedDetector()
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      message: UPLOAD_RESPONSE_INVALID_MESSAGE,
      suggestion: SERVICE_RESPONSE_INVALID_SUGGESTION
    });
    expect(rawUploadClient).toHaveBeenCalledTimes(1);
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('parseDocument rejects upload_file responses missing upload_file_id', async () => {
    const rawUploadClient = jest.fn().mockResolvedValueOnce({
      status: 200,
      data: {
        file_name: 'idpService.test.js',
        file_size: 1,
        content_type: 'application/pdf',
        expires_in: 300
      }
    });
    const httpClient = {
      post: jest.fn()
    };

    await expect(parseDocument(buildLocalFilePayload(), {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient,
      rawUploadClient,
      encryptionDetector: createNotEncryptedDetector()
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      message: UPLOAD_RESPONSE_INVALID_MESSAGE,
      suggestion: SERVICE_RESPONSE_INVALID_SUGGESTION
    });
    expect(rawUploadClient).toHaveBeenCalledTimes(1);
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test.each([
    ['success', { status: 'success' }],
    ['processing', { status: 'processing' }]
  ])('parseDocument rejects envelope-shaped upload_file %s responses missing upload_file_id', async (_name, data) => {
    const rawUploadClient = jest.fn().mockResolvedValueOnce({
      status: 200,
      data
    });
    const httpClient = {
      post: jest.fn()
    };

    let error;
    try {
      await parseDocument(buildLocalFilePayload(), {
        remoteConfig: {
          baseUrl: 'http://localhost:8401',
          authorization: 'Bearer TOKEN',
          timeout: 1234
        },
        httpClient,
        rawUploadClient,
        encryptionDetector: createNotEncryptedDetector()
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeDefined();
    expect(error.type).toBe('MCP_ERROR');
    expect(error.code).toBe(-1);
    expect(error.message).toBe(UPLOAD_RESPONSE_INVALID_MESSAGE);
    expect(error.suggestion).toBe(SERVICE_RESPONSE_INVALID_SUGGESTION);
    expectNoInternalUploadTroubleshootingText(error);
    expect(rawUploadClient).toHaveBeenCalledTimes(1);
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('parseDocument hides gateway configuration details on unexpected parse request failures', async () => {
    const httpClient = {
      post: jest.fn().mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:8401'))
    };

    let error;
    try {
      await parseDocument({
        file_url: 'https://files.example.com/report.pdf'
      }, {
        remoteConfig: {
          baseUrl: 'http://localhost:8401',
          authorization: 'Bearer TOKEN',
          timeout: 1234
        },
        httpClient
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      type: 'MCP_ERROR',
      message: '调用文档解析服务失败: connect ECONNREFUSED 127.0.0.1:8401',
      suggestion: IDP_SERVICE_FAILURE_SUGGESTION
    });
    expect(String(error.message) + '\n' + String(error.suggestion)).not.toMatch(
      /IDP HTTP Gateway|mcp\.baseUrl|mcp\.authorization|gateway 状态/i
    );
  });

  test('parseDocument ignores caller supplied upload_file_id for URL payloads', async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          task_id: 'qcc_idp_url_2',
          status: 'pending',
          next_action: 'get_parse_result'
        }
      })
    };

    await parseDocument({
      file_url: 'https://files.example.com/report.pdf',
      upload_file_id: 'caller-controlled-id',
      wait: true
    }, {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      'http://localhost:8401/idp/parse_document',
      {
        file_url: 'https://files.example.com/report.pdf',
        wait: true
      },
      expect.any(Object)
    );
  });

  test('parseDocument rejects caller supplied upload_file_id without a local upload', async () => {
    const httpClient = {
      post: jest.fn()
    };

    await expect(parseDocument({
      upload_file_id: 'caller-controlled-id'
    }, {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      message: '请指定 1 个文档来源。'
    });
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('parseDocument posts URL payload without running URL probe', async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          task_id: 'qcc_idp_url_1',
          status: 'pending',
          next_action: 'get_parse_result'
        }
      })
    };

    const result = await parseDocument({
      file_url: 'https://files.example.com/archive.zip?token=secret#frag',
      wait: false
    }, {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient
    });

    expect(result).toMatchObject({
      task_id: 'qcc_idp_url_1',
      status: 'processing',
      message: PROCESSING_MESSAGE,
      next_action: 'get_parse_result'
    });
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(httpClient.post).toHaveBeenCalledWith(
      'http://localhost:8401/idp/parse_document',
      {
        file_url: 'https://files.example.com/archive.zip?token=secret#frag',
        wait: false
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer TOKEN',
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }),
        timeout: 300000,
        validateStatus: expect.any(Function)
      })
    );
  });

  test('parseDocument requires a single document source with neutral guidance', async () => {
    const httpClient = {
      post: jest.fn()
    };

    await expect(parseDocument({ wait: false }, {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient
    })).rejects.toMatchObject({
      type: 'MCP_ERROR',
      message: '请指定 1 个文档来源。',
      suggestion: '请提供 --file_path 或 --file_url。'
    });
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  test('getParseResult queries task id from path', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          task_id: 'qcc_idp_1',
          status: 'success'
        }
      })
    };

    const result = await getParseResult('qcc_idp_1', {
      remoteConfig: {
        baseUrl: 'http://localhost:8401',
        authorization: 'Bearer TOKEN',
        timeout: 1234
      },
      httpClient
    });

    expect(result).toEqual({
      task_id: 'qcc_idp_1',
      status: 'success',
      message: SUCCESS_MESSAGE
    });
    expect(httpClient.get).toHaveBeenCalledWith(
      'http://localhost:8401/idp/get_parse_result/qcc_idp_1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer TOKEN',
          Accept: 'application/json'
        }),
        validateStatus: expect.any(Function)
      })
    );
  });

  test('normalizes idp error envelopes without duplicate error message field', () => {
    const result = normalizeHttpResponse({
      status: 400,
      data: {
        status: 'failed',
        error: {
          code: '100204',
          description: '文件类型不支持',
          explanation: '文件类型不支持',
          details: { file_name: 'file' }
        }
      }
    });

    expect(result).toEqual({
      task_id: null,
      status: 'failed',
      message: '文件类型不支持，当前文件类型暂不支持，请上传支持的文件格式后重试。',
      error: {
        code: 100204,
        description: '文件类型不支持',
        explanation: '当前文件类型暂不支持，请上传支持的文件格式后重试。',
        details: { file_name: 'file' }
      }
    });
    expect(result.error).not.toHaveProperty('message');
  });

  test('normalizes file size errors without hard-coded limit when gateway omits max size', () => {
    const result = normalizeHttpResponse({
      status: 400,
      data: {
        status: 'failed',
        error: {
          code: '100205',
          description: '文件超过大小限制',
          explanation: '文件超过大小限制'
        }
      }
    });

    expect(result).toEqual({
      task_id: null,
      status: 'failed',
      message: '文件超过大小限制，请压缩文件或拆分后重试。',
      error: {
        code: 100205,
        description: '文件超过大小限制',
        explanation: '请压缩文件或拆分后重试。'
      }
    });
  });

  test('throws auth error for idp authentication failure envelopes', () => {
    let thrown;

    try {
      normalizeHttpResponse({
        status: 200,
        data: {
          task_id: null,
          status: 'failed',
          error: {
            code: 200215,
            description: '身份认证失败',
            explanation: '请检查 Authorization 配置是否完整且仍然有效。'
          }
        }
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      type: 'AUTH_FAILED',
      message: '身份认证失败',
      suggestion: '身份凭证错误，请检查 Authorization 是否正确，或运行 qcc init 更新配置'
    });
  });

  test('adds fallback error for failed idp envelopes without error', () => {
    const result = normalizeHttpResponse({
      status: 500,
      data: {
        status: 'failed'
      }
    });

    expect(result).toEqual({
      task_id: null,
      status: 'failed',
      message: '服务内部异常，服务处理时发生未预期异常，请稍后重试。',
      error: {
        code: 400299,
        description: '服务内部异常',
        explanation: '服务处理时发生未预期异常，请稍后重试。'
      }
    });
  });

  test('preserves upstream explanations even when they match descriptions', () => {
    const result = normalizeHttpResponse({
      status: 504,
      data: {
        status: 'failed',
        error: {
          code: 400203,
          description: '上游调用超时',
          explanation: '上游调用超时'
        }
      }
    });

    expect(result).toEqual({
      task_id: null,
      status: 'failed',
      message: '上游调用超时。',
      error: {
        code: 400203,
        description: '上游调用超时',
        explanation: '上游调用超时'
      }
    });
  });

  test('getParseResult hides gateway configuration details on unexpected result request failures', async () => {
    const httpClient = {
      get: jest.fn().mockRejectedValueOnce(new Error('read ECONNRESET'))
    };

    let error;
    try {
      await getParseResult('qcc_idp_1', {
        remoteConfig: {
          baseUrl: 'http://localhost:8401',
          authorization: 'Bearer TOKEN',
          timeout: 1234
        },
        httpClient
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      type: 'MCP_ERROR',
      message: '调用文档解析服务失败: read ECONNRESET',
      suggestion: IDP_SERVICE_FAILURE_SUGGESTION
    });
    expect(String(error.message) + '\n' + String(error.suggestion)).not.toMatch(
      /IDP HTTP Gateway|mcp\.baseUrl|mcp\.authorization|gateway 状态/i
    );
  });

  test('compacts null fields in idp detail records without renaming detail error fields', () => {
    const result = normalizeHttpResponse({
      status: 200,
      data: {
        task_id: 'qcc_idp_1',
        status: 'success',
        details: [
          {
            file_name: 'demo.pdf',
            file_type: 'pdf',
            status: 'success',
            start_page_id: 0,
            end_page_id: 0,
            error_code: null,
            error_msg: null,
            error_message: null,
            result_error: null,
            result_md: '# ok'
          }
        ]
      }
    });

    expect(result).toEqual({
      task_id: 'qcc_idp_1',
      status: 'success',
      message: SUCCESS_MESSAGE,
      details: [
        {
          file_name: 'demo.pdf',
          file_type: 'pdf',
          status: 'success',
          start_page_id: 0,
          end_page_id: 0,
          result_md: '# ok'
        }
      ]
    });
  });
});
