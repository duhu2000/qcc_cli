const { readFile } = require('node:fs/promises');
const { PDFDocument } = require('pdf-lib');
const { isEncrypted: isOfficeEncrypted } = require('officecrypto-tool');

const IMAGE_TYPES = new Set(['png', 'jpg', 'jpeg', 'jfif', 'webp']);
const PDF_TYPES = new Set(['pdf']);
const OFFICE_TYPES = new Set(['doc', 'docx', 'xls', 'xlsx', 'wps', 'et']);

async function detectLocalFileEncryption({ filePath, fileType }) {
  const normalizedType = String(fileType || '').toLowerCase();

  if (IMAGE_TYPES.has(normalizedType)) {
    return result(normalizedType, 'not_encrypted', 'IMAGE_ENCRYPTION_NOT_APPLICABLE');
  }

  if (!PDF_TYPES.has(normalizedType) && !OFFICE_TYPES.has(normalizedType)) {
    return result(normalizedType, 'unknown', 'UNSUPPORTED_LOCAL_ENCRYPTION_TYPE');
  }

  let buffer;
  try {
    buffer = await readFile(filePath);
  } catch (error) {
    return result(normalizedType, 'unknown', 'LOCAL_FILE_READ_FAILED', errorMessage(error));
  }

  if (PDF_TYPES.has(normalizedType)) {
    try {
      await PDFDocument.load(buffer, { ignoreEncryption: false });
      return result(normalizedType, 'not_encrypted', 'PDF_NOT_ENCRYPTED');
    } catch (error) {
      const message = errorMessage(error);
      return /encrypt|password/i.test(message)
        ? result(normalizedType, 'encrypted', 'PDF_ENCRYPTED', message)
        : result(normalizedType, 'unknown', 'PDF_ENCRYPTION_UNKNOWN', message);
    }
  }

  try {
    return isOfficeEncrypted(buffer)
      ? result(normalizedType, 'encrypted', 'OFFICE_ENCRYPTED')
      : result(normalizedType, 'not_encrypted', 'OFFICE_NOT_ENCRYPTED');
  } catch (error) {
    return result(normalizedType, 'unknown', 'OFFICE_ENCRYPTION_UNKNOWN', errorMessage(error));
  }
}

function result(fileType, status, reasonCode, detail) {
  return { status, sourceType: 'local', fileType, reasonCode, detail };
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

module.exports = { detectLocalFileEncryption };
