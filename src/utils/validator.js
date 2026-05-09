/**
 * MCP 参数验证模块
 */

function getSchemaType(propDef = {}) {
  const type = propDef.type;
  if (Array.isArray(type)) {
    return type.find((item) => item !== 'null');
  }
  return type;
}

function isMissingOptionValue(propDef = {}, value) {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  return value === true && getSchemaType(propDef) !== 'boolean';
}

function normalizeParamValue(propDef = {}, value) {
  if (Array.isArray(value)) {
    const itemDef = getSchemaType(propDef) === 'array' ? propDef.items || {} : propDef;
    const normalizedItems = value.filter((item) => !isMissingOptionValue(itemDef, item));
    return normalizedItems.length > 0 ? normalizedItems : undefined;
  }

  if (isMissingOptionValue(propDef, value)) {
    return undefined;
  }

  return value;
}

function isEmptyCoercedOptionalValue(value) {
  return Array.isArray(value) && value.length === 0;
}

/**
 * 验证 MCP 工具参数
 * 基于 inputSchema 进行白名单验证和必填参数检查
 * @param {object} tool - 工具定义对象，包含 inputSchema
 * @param {object} userInput - 用户输入的参数对象
 * @returns {object} 验证结果 { valid: boolean, errors: string[], params: object }
 */
function validateMcpParams(tool, userInput) {
  const errors = [];
  const params = {};

  if (!tool) {
    return { valid: false, errors: ['工具定义不存在'], params: {} };
  }

  const inputSchema = tool.inputSchema || {};
  const properties = inputSchema.properties || {};
  const required = inputSchema.required || [];

  // 获取定义的参数键
  const definedKeys = new Set(Object.keys(properties));

  // 获取用户输入的所有参数键
  const userInputKeys = Object.keys(userInput || {});
  const normalizedInput = {};

  // 白名单校验：检查用户输入的参数是否都在定义中存在
  userInputKeys.forEach(key => {
    if (!definedKeys.has(key)) {
      errors.push(`未知参数：--${key}`);
      return;
    }

    normalizedInput[key] = normalizeParamValue(properties[key], userInput[key]);
  });

  // 如果有白名单错误，直接返回
  if (errors.length > 0) {
    return { valid: false, errors, params: {} };
  }

  // 必填参数校验
  required.forEach(key => {
    const value = normalizedInput[key];
    if (value === undefined || value === null || value === '') {
      const propDef = properties[key] || {};
      errors.push(`缺少必填参数：--${key}${propDef.description ? ` (${propDef.description})` : ''}`);
    }
  });

  // 收集有效参数
  userInputKeys.forEach(key => {
    const value = normalizedInput[key];
    if (definedKeys.has(key) && value !== undefined && value !== null) {
      params[key] = value;
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    params
  };
}

function formatReceivedValue(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return JSON.stringify(value);
}

function validateNumericRange(propDef, key, value) {
  if (typeof propDef.minimum === 'number' && value < propDef.minimum) {
    return { error: `参数 --${key} 不能小于 ${propDef.minimum}，收到 ${formatReceivedValue(value)}` };
  }
  if (typeof propDef.maximum === 'number' && value > propDef.maximum) {
    return { error: `参数 --${key} 不能大于 ${propDef.maximum}，收到 ${formatReceivedValue(value)}` };
  }
  return null;
}

function coerceNumericValue(type, key, value, propDef = {}) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { error: `参数 --${key} 期望 ${type}，收到 ${formatReceivedValue(value)}` };
    }
    if (type === 'integer' && !Number.isInteger(value)) {
      return { error: `参数 --${key} 期望整数，收到 ${formatReceivedValue(value)}` };
    }
    const rangeError = validateNumericRange(propDef, key, value);
    if (rangeError) {
      return rangeError;
    }
    return { value };
  }

  if (typeof value !== 'string') {
    return { error: `参数 --${key} 期望 ${type}，收到 ${typeof value}` };
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return { error: `参数 --${key} 期望 ${type}，收到空值` };
  }
  if (type === 'integer' && !/^[+-]?\d+$/.test(trimmed)) {
    return { error: `参数 --${key} 期望整数，收到 ${formatReceivedValue(value)}` };
  }

  const numberValue = Number(trimmed);
  if (!Number.isFinite(numberValue)) {
    return { error: `参数 --${key} 期望 ${type}，收到 ${formatReceivedValue(value)}` };
  }
  if (type === 'integer' && !Number.isInteger(numberValue)) {
    return { error: `参数 --${key} 期望整数，收到 ${formatReceivedValue(value)}` };
  }
  const rangeError = validateNumericRange(propDef, key, numberValue);
  if (rangeError) {
    return rangeError;
  }

  return { value: numberValue };
}

function coerceBooleanValue(key, value) {
  if (typeof value === 'boolean') {
    return { value };
  }
  if (typeof value !== 'string') {
    return { error: `参数 --${key} 期望 boolean，收到 ${typeof value}` };
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return { value: true };
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return { value: false };
  }

  return { error: `参数 --${key} 期望 boolean，收到 ${formatReceivedValue(value)}` };
}

function coerceStringValue(key, value) {
  if (typeof value === 'string') {
    return { value };
  }

  return { error: `参数 --${key} 期望 string，收到 ${typeof value}` };
}

function parseJsonParam(key, value, expectedType) {
  try {
    return { value: JSON.parse(value) };
  } catch (error) {
    return { error: `参数 --${key} 期望 ${expectedType}，JSON 解析失败: ${error.message}` };
  }
}

function coerceArrayItems(itemSchema, key, values) {
  const coercedItems = [];
  const errors = [];

  values.forEach((item, index) => {
    const result = coerceParamValue(itemSchema || {}, item, `${key}[${index}]`);
    if (result.error) {
      errors.push(result.error);
      return;
    }
    coercedItems.push(result.value);
  });

  if (errors.length > 0) {
    return { error: errors.join('\n') };
  }
  return { value: coercedItems };
}

function coerceArrayValue(propDef, key, value) {
  if (Array.isArray(value)) {
    return coerceArrayItems(propDef.items, key, value);
  }

  if (typeof value !== 'string') {
    return { error: `参数 --${key} 期望 array，收到 ${typeof value}` };
  }

  if (value.trim() === '') {
    return { value: [] };
  }

  if (value.trim().startsWith('[')) {
    const parsed = parseJsonParam(key, value.trim(), 'array');
    if (parsed.error) {
      return parsed;
    }
    if (!Array.isArray(parsed.value)) {
      return { error: `参数 --${key} 期望 array，收到 ${typeof parsed.value}` };
    }
    return coerceArrayItems(propDef.items, key, parsed.value);
  }

  return coerceArrayItems(propDef.items, key, [value]);
}

function coerceObjectValue(key, value) {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return { value };
  }
  if (typeof value !== 'string') {
    return { error: `参数 --${key} 期望 object，收到 ${typeof value}` };
  }

  const parsed = parseJsonParam(key, value, 'object');
  if (parsed.error) {
    return parsed;
  }
  if (typeof parsed.value !== 'object' || parsed.value === null || Array.isArray(parsed.value)) {
    return { error: `参数 --${key} 期望 object，收到 ${Array.isArray(parsed.value) ? 'array' : typeof parsed.value}` };
  }
  return parsed;
}

function coerceParamValue(propDef, value, key) {
  const expectedType = getSchemaType(propDef);
  const enumValues = propDef.enum;
  if (Array.isArray(enumValues) && !enumValues.includes(value)) {
    return { error: `参数 --${key} 取值无效: ${formatReceivedValue(value)}。可选值: ${enumValues.join(', ')}` };
  }

  switch (expectedType) {
    case 'integer':
    case 'number':
      return coerceNumericValue(expectedType, key, value, propDef);
    case 'boolean':
      return coerceBooleanValue(key, value);
    case 'array':
      return coerceArrayValue(propDef, key, value);
    case 'object':
      return coerceObjectValue(key, value);
    case 'string':
      return coerceStringValue(key, value);
    default:
      return { value };
  }
}

function coerceMcpParams(tool, params) {
  const properties = tool?.inputSchema?.properties || {};
  const required = tool?.inputSchema?.required || [];
  const coercedParams = {};
  const errors = [];

  Object.entries(params || {}).forEach(([key, value]) => {
    const result = coerceParamValue(properties[key] || {}, value, key);
    if (result.error) {
      errors.push(result.error);
      return;
    }

    if (!isEmptyCoercedOptionalValue(result.value) || required.includes(key)) {
      coercedParams[key] = result.value;
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    params: errors.length === 0 ? coercedParams : {}
  };
}

/**
 * 类型验证辅助函数
 * @param {string} type - JSON Schema 类型
 * @param {any} value - 要验证的值
 * @returns {boolean} 是否符合类型
 */
function validateType(type, value) {
  if (value === undefined || value === null) {
    return true; // 允许可选参数为空
  }

  if (Array.isArray(type)) {
    return type.some((item) => item !== 'null' && validateType(item, value));
  }

  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
    case 'integer':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && !Array.isArray(value) && value !== null;
    default:
      return true; // 未知类型允许通过
  }
}

/**
 * 验证 MCP 工具参数（包含类型检查）
 * @param {object} tool - 工具定义对象
 * @param {object} userInput - 用户输入的参数对象
 * @param {object} options - 验证选项 { checkType: boolean }
 * @returns {object} 验证结果 { valid: boolean, errors: string[], params: object }
 */
function validateMcpTool(tool, userInput, options = {}) {
  const { checkType = false, coerceTypes = false } = options;

  // 先进行基本验证（白名单 + 必填）
  const basicResult = validateMcpParams(tool, userInput);
  if (!basicResult.valid) {
    return basicResult;
  }

  let params = basicResult.params;

  if (coerceTypes) {
    const coercedResult = coerceMcpParams(tool, params);
    if (!coercedResult.valid) {
      return coercedResult;
    }
    params = coercedResult.params;
  }

  // 如果启用类型检查
  if (checkType) {
    const errors = [];
    const properties = tool.inputSchema?.properties || {};

    Object.entries(params).forEach(([key, value]) => {
      const propDef = properties[key] || {};
      const expectedType = propDef.type;

      if (expectedType && !validateType(expectedType, value)) {
        errors.push(`参数 --${key} 类型错误：期望 ${expectedType}，实际 ${typeof value}`);
      }
    });

    if (errors.length > 0) {
      return { valid: false, errors, params: {} };
    }
  }

  return {
    valid: true,
    errors: [],
    params
  };
}

module.exports = {
  coerceMcpParams,
  coerceParamValue,
  validateMcpParams,
  validateMcpTool,
  validateType
};
