/* eslint-env jest */

const idpService = require('../services/idpService');
const { parseDocument } = require('./idp');

jest.mock('../services/idpService', () => ({
  getParseResult: jest.fn(),
  parseDocument: jest.fn()
}));

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

describe('document parse command progress notice', () => {
  let stdoutSpy;
  let stderrSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    stdoutSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    idpService.parseDocument.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('prints submitting notice to stderr without contaminating JSON stdout', async () => {
    const deferred = createDeferred();
    const result = {
      task_id: 'qcc_idp_1',
      status: 'processing',
      message: '任务已提交，解析处理中，请调用 get_parse_result 工具获取状态和结果。',
      next_action: 'get_parse_result'
    };
    idpService.parseDocument.mockReturnValueOnce(deferred.promise);

    const commandPromise = parseDocument({
      file_url: 'https://files.qcc.com/sample.pdf'
    });

    expect(stderrSpy).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();

    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('正在提交文档解析任务，请稍候...'));

    deferred.resolve(result);
    await commandPromise;

    expect(stdoutSpy).toHaveBeenCalledWith(JSON.stringify(result, null, 2));
    expect(stdoutSpy).not.toHaveBeenCalledWith(expect.stringContaining('正在提交文档解析任务，请稍候...'));
  });

  test('prints wait-mode notice to stderr without contaminating JSON stdout', async () => {
    const deferred = createDeferred();
    const result = {
      task_id: 'qcc_idp_1',
      status: 'success',
      message: '任务处理成功。'
    };
    idpService.parseDocument.mockReturnValueOnce(deferred.promise);

    const commandPromise = parseDocument({
      file_url: 'https://files.qcc.com/sample.pdf',
      wait: true
    });

    jest.runOnlyPendingTimers();

    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('正在提交文档解析任务并等待文档解析结果，请稍候...'));

    deferred.resolve(result);
    await commandPromise;

    expect(stdoutSpy).toHaveBeenCalledWith(JSON.stringify(result, null, 2));
    expect(stdoutSpy).not.toHaveBeenCalledWith(expect.stringContaining('正在提交文档解析任务并等待文档解析结果，请稍候...'));
  });

  test('rejects unsafe URL before service call and progress timer', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);

    await parseDocument({
      file_url: 'http://127.0.0.1/private.pdf?token=secret'
    });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(idpService.parseDocument).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('URL 文件不可获取、不可识别或不满足解析限制，请检查 URL 后重试。')
    );
    expect(JSON.stringify(stderrSpy.mock.calls)).not.toMatch(/127\.0\.0\.1|token=secret/u);
    expect(stdoutSpy).not.toHaveBeenCalled();
  });
});
