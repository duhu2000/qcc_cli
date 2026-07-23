const fs = require('fs');
const path = require('path');
const { IDP_ERROR_CATALOG } = require('../constants/idpErrors');
const { validateIdpDirectUrlStatic } = require('./idpDirectUrlStaticValidation');

const PARSE_DOCUMENT_OPTION_NAMES = new Set([
  'file_path',
  'file_url',
  'wait'
]);

const CONTENT_TYPES_BY_EXTENSION = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  wps: 'application/vnd.ms-works',
  et: 'application/wps-office.et',
  zip: 'application/zip'
};

class IdpDocumentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'IdpDocumentError';
    this.code = code;
  }
}

function getDisplayFileName(filePath) {
  return path.basename(String(filePath || ''));
}

function getFileType(filePath) {
  return path.extname(filePath).replace(/^\./, '').toLowerCase();
}

function getContentType(fileType) {
  return CONTENT_TYPES_BY_EXTENSION[fileType] || 'application/octet-stream';
}

function assertAllowedParseDocumentOptions(options = {}) {
  const unexpected = Object.keys(options).find((key) => !PARSE_DOCUMENT_OPTION_NAMES.has(key));
  if (unexpected) {
    throw new IdpDocumentError(
      'invalid_option',
      `参数 --${unexpected} 无效；可用参数：--file_path、--file_url、--wait`
    );
  }
}

function isUrlLike(filePath) {
  const text = String(filePath || '').trim();

  return /^file:/i.test(text) || /^[a-z][a-z\d+.-]*:\/\//i.test(text);
}

function hasGlobSyntax(filePath) {
  return /[*?{}[\]]/.test(String(filePath || ''));
}

function normalizeSingleString(value, optionName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    if (value.length !== 1) {
      throw new IdpDocumentError('invalid_option', `参数 --${optionName} 只允许提供 1 个值`);
    }
    return normalizeSingleString(value[0], optionName);
  }

  const text = String(value).trim();
  return text || undefined;
}

function inspectUrlSource(options = {}) {
  const fileUrl = normalizeSingleString(options.file_url, 'file_url');
  if (!fileUrl) {
    return null;
  }

  const validation = validateIdpDirectUrlStatic(fileUrl);
  if (!validation.ok) {
    throw new IdpDocumentError(100212, IDP_ERROR_CATALOG[100212].explanation);
  }

  return { file_url: validation.value };
}

function parseNonNegativeInteger(optionName, value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const text = String(value).trim();
  if (!/^\d+$/.test(text)) {
    throw new IdpDocumentError('invalid_page_range', `参数 --${optionName} 必须是非负整数`);
  }

  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed)) {
    throw new IdpDocumentError('invalid_page_range', `参数 --${optionName} 超出安全整数范围`);
  }

  return parsed;
}

function parsePageRange(options = {}) {
  const startPageId = parseNonNegativeInteger('start_page_id', options.start_page_id);
  const endPageId = parseNonNegativeInteger('end_page_id', options.end_page_id);

  if (startPageId !== undefined && endPageId !== undefined && startPageId > endPageId) {
    throw new IdpDocumentError('invalid_page_range', '页码范围非法：start_page_id 不能大于 end_page_id');
  }

  return { startPageId, endPageId };
}

function inspectDocumentFile(filePath) {
  const displayName = getDisplayFileName(filePath);
  const fileType = getFileType(filePath);

  if (isUrlLike(filePath)) {
    throw new IdpDocumentError('unsupported_path', '请提供本地文件路径。');
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (error) {
    if (hasGlobSyntax(filePath)) {
      throw new IdpDocumentError('unsupported_path', '请提供本地文件路径。');
    }
    throw new IdpDocumentError('file_not_readable', `文件不可读: ${displayName}`);
  }

  if (!stat.isFile()) {
    throw new IdpDocumentError('file_not_readable', `文件不可读: ${displayName}`);
  }

  return {
    file_path: path.resolve(filePath),
    file_name: displayName,
    file_type: fileType,
    content_type: getContentType(fileType),
    file_size: stat.size
  };
}

function buildParseDocumentPayload(options = {}) {
  assertAllowedParseDocumentOptions(options);

  const filePath = normalizeSingleString(options.file_path, 'file_path');
  const urlSource = inspectUrlSource(options);
  const hasLocalSource = Boolean(filePath);
  const hasUrlSource = Boolean(urlSource);

  if (hasLocalSource && hasUrlSource) {
    throw new IdpDocumentError('source_conflict', '请只指定 1 个文档来源：--file_path 或 --file_url。');
  }
  if (!hasLocalSource && !hasUrlSource) {
    throw new IdpDocumentError('source_required', '请指定 1 个文档来源：--file_path 或 --file_url。');
  }

  const { startPageId, endPageId } = parsePageRange(options);
  const payload = {
    ...(hasLocalSource ? { files: [inspectDocumentFile(filePath)] } : {}),
    ...(urlSource || {})
  };

  payload.wait = options.wait === true;
  if (startPageId !== undefined) {
    payload.start_page_id = startPageId;
  }
  if (endPageId !== undefined) {
    payload.end_page_id = endPageId;
  }

  return payload;
}

module.exports = {  IdpDocumentError,  buildParseDocumentPayload,
  getFileType,
  getContentType,
  inspectDocumentFile,
  inspectUrlSource,
  isUrlLike,
  parsePageRange
};
