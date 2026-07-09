/* eslint-env jest */

const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { PDFDocument } = require('pdf-lib');

const { detectLocalFileEncryption } = require('./idpDocumentEncryption');

describe('detectLocalFileEncryption', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'qcc-agent-cli-idp-encryption-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test('treats local image files as not encrypted without reading the file', async () => {
    await expect(detectLocalFileEncryption({
      filePath: path.join(tempDir, 'missing.png'),
      fileType: 'png'
    })).resolves.toEqual({
      status: 'not_encrypted',
      sourceType: 'local',
      fileType: 'png',
      reasonCode: 'IMAGE_ENCRYPTION_NOT_APPLICABLE',
      detail: undefined
    });
  });

  test('returns unknown for invalid local pdf content', async () => {
    const invalidPdfPath = path.join(tempDir, 'invalid.pdf');
    await writeFile(invalidPdfPath, Buffer.from('definitely-not-a-pdf'));

    await expect(detectLocalFileEncryption({
      filePath: invalidPdfPath,
      fileType: 'pdf'
    })).resolves.toMatchObject({
      status: 'unknown',
      sourceType: 'local',
      fileType: 'pdf',
      reasonCode: 'PDF_ENCRYPTION_UNKNOWN'
    });
  });

  test('returns not_encrypted for a generated local pdf', async () => {
    const pdfPath = path.join(tempDir, 'plain.pdf');
    const pdfDocument = await PDFDocument.create();
    pdfDocument.addPage([100, 100]);
    await writeFile(pdfPath, await pdfDocument.save());

    await expect(detectLocalFileEncryption({
      filePath: pdfPath,
      fileType: 'pdf'
    })).resolves.toEqual({
      status: 'not_encrypted',
      sourceType: 'local',
      fileType: 'pdf',
      reasonCode: 'PDF_NOT_ENCRYPTED',
      detail: undefined
    });
  });
});
