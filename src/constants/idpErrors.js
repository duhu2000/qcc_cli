const IDP_ERROR_CATALOG = {
  100201: {
    code: 100201,
    description: '本地路径非法',
    explanation: '请提供当前机器可访问的本地文件路径，不要使用 URL、目录或通配符。'
  },
  100202: {
    code: 100202,
    description: '本地文件不可读',
    explanation: '请确认文件存在且当前进程有读取权限。'
  },
  100203: {
    code: 100203,
    description: '页码范围非法',
    explanation: '请提供非负整数页码，并确保起始页不大于结束页且位于文件实际范围内。'
  },
  100204: {
    code: 100204,
    description: '文件类型不支持',
    explanation: '当前文件类型暂不支持，请上传支持的文件格式后重试。'
  },
  100205: {
    code: 100205,
    description: '文件超过大小限制',
    explanation: '请压缩文件或拆分后重试。'
  },
  100206: {
    code: 100206,
    description: '文件数量超限',
    explanation: '当前仅支持单文件解析，请一次只提交 1 个文件。'
  },
  100207: {
    code: 100207,
    description: '暂不支持 ZIP',
    explanation: '当前不支持 ZIP 压缩包，请上传解压后的支持格式文件。'
  },
  100208: {
    code: 100208,
    description: '请求参数非法',
    explanation: '请检查请求字段和参数类型后重试。'
  },
  100209: {
    code: 100209,
    description: '任务不可查询',
    explanation: '请确认 task_id 存在且属于当前调用用户。'
  },
  100211: {
    code: 100211,
    description: '文件页数超限',
    explanation: '请缩小页码范围后重试。'
  },
  100212: {
    code: 100212,
    description: 'URL 文件解析失败',
    explanation: 'URL 文件不可获取、不可识别或不满足解析限制，请检查 URL 后重试。'
  },
  100213: {
    code: 100213,
    description: '文档解析失败',
    explanation: '文档解析任务失败，请查看文件内容或稍后重新提交。'
  },
  100214: {
    code: 100214,
    description: '结果不可用',
    explanation: '解析结果当前不可获取，请稍后重试或重新提交任务。'
  },
  200215: {
    code: 200215,
    description: '身份认证失败',
    explanation: '请检查 Authorization 配置是否完整且仍然有效。'
  },
  300216: {
    code: 300216,
    description: '工具无调用权限',
    explanation: '当前调用方没有该工具权限，请确认账号授权范围。'
  },
  100217: {
    code: 100217,
    description: '解析服务返回错误',
    explanation: '解析服务返回业务错误，请根据错误说明检查后重试。'
  },
  100218: {
    code: 100218,
    description: '文档提交频繁',
    explanation: '文档提交较为频繁，已触发提交保护，本次请求暂未提交。请稍后再试。'
  },
  100219: {
    code: 100219,
    description: '文档提交未完成',
    explanation: '文档提交未完成，请检查网络后重新提交。'
  },
  100220: {
    code: 100220,
    description: '文档提交信息不完整',
    explanation: '文档提交信息不完整，请升级客户端或重新提交。'
  },
  100221: {
    code: 100221,
    description: '文档提交集中',
    explanation: '当前文档提交较为集中，已触发提交保护，本次请求暂未提交。请稍后再试。'
  },
  100222: {
    code: 100222,
    description: '加密文档不支持',
    explanation: '暂不支持加密文档，请先取消密码保护后重新提交。'
  },
  400201: {
    code: 400201,
    description: '文件读取失败',
    explanation: '读取上传文件时发生异常，请重新选择文件后再试。'
  },
  400202: {
    code: 400202,
    description: '任务记录保存失败',
    explanation: '任务记录保存失败，请稍后重试。'
  },
  400203: {
    code: 400203,
    description: '上游调用超时',
    explanation: '解析服务响应超时，请稍后查询任务或重新提交。'
  },
  400204: {
    code: 400204,
    description: '上游响应结构异常',
    explanation: '解析服务返回内容无法识别，请稍后重试。'
  },
  400205: {
    code: 400205,
    description: '解析服务不可用',
    explanation: '解析服务暂不可用，请稍后重试。'
  },
  400299: {
    code: 400299,
    description: '服务内部异常',
    explanation: '服务处理时发生未预期异常，请稍后重试。'
  }
};

const FIXED_IDP_ERROR_EXPLANATION_CODES = new Set([100212, 100222]);

function isIdpErrorCode(code) {
  return Object.prototype.hasOwnProperty.call(IDP_ERROR_CATALOG, code);
}

function normalizeIdpErrorCode(code) {
  const numericCode = Number(code);
  if (Number.isInteger(numericCode) && isIdpErrorCode(numericCode)) {
    return numericCode;
  }
  return typeof code === 'string' && code.trim() ? code : 400299;
}

function getIdpErrorDescription(code, fallback) {
  return IDP_ERROR_CATALOG[code]?.description || fallback || IDP_ERROR_CATALOG[400299].description;
}

function getIdpErrorExplanation(code, description, candidate) {
  if (FIXED_IDP_ERROR_EXPLANATION_CODES.has(code)) {
    return IDP_ERROR_CATALOG[code].explanation;
  }

  const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
  if (trimmed) {
    if ((code === 100204 || code === 100205) && trimmed === String(description || '').trim()) {
      return IDP_ERROR_CATALOG[code].explanation;
    }
    return trimmed;
  }
  return IDP_ERROR_CATALOG[code]?.explanation || '请根据错误描述检查请求后重试。';
}

module.exports = {
  IDP_ERROR_CATALOG,
  getIdpErrorDescription,
  getIdpErrorExplanation,
  normalizeIdpErrorCode
};

