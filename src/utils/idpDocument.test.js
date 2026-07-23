/* eslint-env jest */

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  IdpDocumentError,
  buildParseDocumentPayload,
  parsePageRange
} = require('./idpDocument');

const OVERSIZED_TEST_FILE_OFFSET = 200 * 1024 * 1024;

describe('idp document payload builder', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qcc-idp-cli-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('inspects one file without reading it into base64 and preserves visible optional fields', () => {
    const filePath = path.join(tmpDir, 'sample.pdf');
    const content = Buffer.from('pdf-content');
    fs.writeFileSync(filePath, content);

    const payload = buildParseDocumentPayload({
      file_path: filePath
    });

    expect(payload).toEqual({
      files: [
        {
          file_path: path.resolve(filePath),
          file_name: 'sample.pdf',
          file_type: 'pdf',
          content_type: 'application/pdf',
          file_size: content.length
        }
      ],
      wait: false
    });
  });

  test('preserves wait and supports documented local file extensions', () => {
    ['sample.pdf', 'sample.png', 'sample.jpg', 'sample.jpeg', 'sample.doc', 'sample.docx', 'sample.xls', 'sample.xlsx', 'sample.wps', 'sample.et', 'sample.jfif', 'sample.webp']
      .forEach((fileName) => {
        const filePath = path.join(tmpDir, fileName);
        fs.writeFileSync(filePath, fileName);

        const payload = buildParseDocumentPayload({
          file_path: filePath,
          wait: true
        });

        expect(payload.files[0].file_type).toBe(path.extname(fileName).slice(1).toLowerCase());
        expect(payload.wait).toBe(true);
      });
  });

  test('treats glob metacharacters in existing file names as literal path characters', () => {
    const fileName = '合作风险排查[12].pdf';
    const filePath = path.join(tmpDir, fileName);
    const content = Buffer.from('pdf-content');
    fs.writeFileSync(filePath, content);

    const payload = buildParseDocumentPayload({
      file_path: filePath
    });

    expect(payload).toEqual({
      files: [
        {
          file_path: path.resolve(filePath),
          file_name: fileName,
          file_type: 'pdf',
          content_type: 'application/pdf',
          file_size: content.length
        }
      ],
      wait: false
    });
  });

  test('builds URL payload without local file access', () => {
    const payload = buildParseDocumentPayload({
      file_url: 'https://files.qcc.com/reports/demo.pdf',
      wait: true
    });

    expect(payload).toEqual({
      file_url: 'https://files.qcc.com/reports/demo.pdf',
      wait: true
    });
  });

  test.each([
    'https://test.qcc.com/report.pdf',
    'https://example.qcc.com/report.pdf',
    'https://files.qcc.com:8443/report.pdf',
    'http://redis:8080/report.pdf'
  ])('allows static direct URL boundary %s', (fileUrl) => {
    expect(buildParseDocumentPayload({ file_url: fileUrl })).toEqual({
      file_url: fileUrl,
      wait: false
    });
  });

  test.each([
    'http://127.0.0.1/private.pdf?token=secret',
    'http://10.0.0.1/private.pdf?token=secret',
    'https://qcc.test/private.pdf?token=secret',
    'https://user:password@files.qcc.com/private.pdf?token=secret'
  ])('rejects unsafe URL %s before local file access', (fileUrl) => {
    const statSpy = jest.spyOn(fs, 'statSync');

    let error;
    try {
      buildParseDocumentPayload({ file_url: fileUrl });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(IdpDocumentError);
    expect(error).toMatchObject({
      code: 100212,
      message: 'URL 文件不可获取、不可识别或不满足解析限制，请检查 URL 后重试。'
    });
    expect(error.message).not.toMatch(/127\.0\.0\.1|10\.0\.0\.1|qcc\.test|password|token=secret/u);
    expect(statSpy).not.toHaveBeenCalled();
    statSpy.mockRestore();
  });

  test('rejects missing or conflicting local and URL sources', () => {
    const filePath = path.join(tmpDir, 'sample.pdf');
    fs.writeFileSync(filePath, 'pdf-content');

    expect(() => buildParseDocumentPayload({})).toThrow('请指定 1 个文档来源：--file_path 或 --file_url。');
    expect(() => buildParseDocumentPayload({
      file_path: filePath,
      file_url: 'https://files.qcc.com/demo.pdf'
    })).toThrow('请只指定 1 个文档来源：--file_path 或 --file_url。');
  });

  test('passes URL path file types through without local business validation', () => {
    expect(buildParseDocumentPayload({
      file_url: 'https://files.qcc.com/archive.zip'
    })).toEqual({
      file_url: 'https://files.qcc.com/archive.zip',
      wait: false
    });
    expect(buildParseDocumentPayload({
      file_url: 'https://files.qcc.com/demo.txt'
    })).toEqual({
      file_url: 'https://files.qcc.com/demo.txt',
      wait: false
    });
  });

  test('passes unsupported local file type through without exposing file contents', () => {
    const filePath = path.join(tmpDir, 'notes.txt');
    fs.writeFileSync(filePath, 'secret-content');

    const payload = buildParseDocumentPayload({ file_path: filePath });

    expect(payload.files[0]).toEqual({
      file_path: path.resolve(filePath),
      file_name: 'notes.txt',
      file_type: 'txt',
      content_type: 'application/octet-stream',
      file_size: 'secret-content'.length
    });
  });

  test('passes zip local file type through to remote validation', () => {
    const filePath = path.join(tmpDir, 'archive.zip');
    fs.writeFileSync(filePath, 'zip-content');

    const payload = buildParseDocumentPayload({ file_path: filePath });

    expect(payload.files[0]).toEqual({
      file_path: path.resolve(filePath),
      file_name: 'archive.zip',
      file_type: 'zip',
      content_type: 'application/zip',
      file_size: 'zip-content'.length
    });
  });

  test('rejects invalid file_path value count and hidden or retired source aliases', () => {
    expect(() => buildParseDocumentPayload({ file: [] })).toThrow('参数 --file 无效');
    expect(() => buildParseDocumentPayload({
      file_url: 'https://files.qcc.com/demo.pdf',
      file_name: 'demo.pdf'
    })).toThrow('参数 --file_name 无效');
    expect(() => buildParseDocumentPayload({
      file_url: 'https://files.qcc.com/demo.pdf',
      file_type: 'pdf'
    })).toThrow('参数 --file_type 无效');
    expect(() => buildParseDocumentPayload({
      file_url: 'https://files.qcc.com/demo.pdf',
      start_page_id: '0'
    })).toThrow('参数 --start_page_id 无效');
    expect(() => buildParseDocumentPayload({
      file_url: 'https://files.qcc.com/demo.pdf',
      end_page_id: '2'
    })).toThrow('参数 --end_page_id 无效');
    expect(() => buildParseDocumentPayload({ file_path: ['a.pdf', 'b.pdf'] })).toThrow('参数 --file_path 只允许提供 1 个值');
  });

  test('rejects URL-like and glob-like paths before file system lookup', () => {
    expect(() => buildParseDocumentPayload({ file_path: 'https://example.com/a.pdf' })).toThrow('请提供本地文件路径。');
    expect(() => buildParseDocumentPayload({ file_path: 'file:///tmp/a.pdf' })).toThrow('请提供本地文件路径。');
    expect(() => buildParseDocumentPayload({ file_path: '*.pdf' })).toThrow('请提供本地文件路径。');
  });

  test('rejects invalid page range', () => {
    expect(() => parsePageRange({ start_page_id: '3', end_page_id: '2' })).toThrow('start_page_id 不能大于');
    expect(() => parsePageRange({ start_page_id: '-1' })).toThrow('必须是非负整数');
  });

  test('does not precheck selected page count', () => {
    expect(parsePageRange({ start_page_id: '0', end_page_id: '200' })).toEqual({
      startPageId: 0,
      endPageId: 200
    });
  });

  test('passes oversized local file through to remote validation', () => {
    const filePath = path.join(tmpDir, 'large.pdf');
    const fd = fs.openSync(filePath, 'w');
    fs.writeSync(fd, Buffer.from([0]), 0, 1, OVERSIZED_TEST_FILE_OFFSET);
    fs.closeSync(fd);

    const payload = buildParseDocumentPayload({ file_path: filePath });

    expect(payload.files[0]).toEqual({
      file_path: path.resolve(filePath),
      file_name: 'large.pdf',
      file_type: 'pdf',
      content_type: 'application/pdf',
      file_size: OVERSIZED_TEST_FILE_OFFSET + 1
    });
  });
});
