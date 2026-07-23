const fs = require('fs');
const path = require('path');
const os = require('os');
const { QccError, ErrorType } = require('../utils/httpClient');
const mcpServers = require('../config/mcpServers.json');

const CONFIG_DIR = path.join(os.homedir(), '.qcc');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const CACHE_DIR = path.join(CONFIG_DIR, 'cache');
const TOOLS_CACHE_FILE = path.join(CACHE_DIR, 'tools.json');

/**
 * MCP 默认基础 URL
 */
const MCP_DEFAULT_BASE_URL = 'https://agent.qcc.com/mcp';
const MCP_SERVER_ENDPOINTS = Object.values(mcpServers).map(({ endpoint }) => (
  endpoint.replace(/\/+$/, '')
));

/**
 * 默认配置模板
 */
const DEFAULT_CONFIG = {
  version: '2.1',
  mcp: {
    enabled: true,
    baseUrl: MCP_DEFAULT_BASE_URL,
    authorization: '',
    timeout: 30000
  }
};

function getBaseUrlDisplayValue(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '(未设置)';
  }

  const rawValue = value.trim();
  try {
    const parsedUrl = new URL(rawValue);
    parsedUrl.username = '';
    parsedUrl.password = '';
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString().replace(/\/$/, '');
  } catch (error) {
    return rawValue;
  }
}

function createInvalidBaseUrlError(message, value) {
  return new QccError(ErrorType.CONFIG_INVALID_BASE_URL, message, {
    suggestion: [
      `当前 mcp.baseUrl：${getBaseUrlDisplayValue(value)}`,
      `正确默认地址：${MCP_DEFAULT_BASE_URL}`,
      `修复命令：qcc config set mcp.baseUrl "${MCP_DEFAULT_BASE_URL}"`
    ].join('\n')
  });
}

/**
 * 校验并规范化 MCP 基础地址。
 * @param {string} value - MCP 基础地址
 * @returns {string} 规范化后的基础地址
 */
function normalizeMcpBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw createInvalidBaseUrlError('MCP baseUrl 不能为空', value);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(value.trim());
  } catch (error) {
    throw createInvalidBaseUrlError(`MCP baseUrl 不是有效 URL: ${value}`, value);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw createInvalidBaseUrlError('MCP baseUrl 仅支持 http 或 https 协议', value);
  }
  if (parsedUrl.username || parsedUrl.password) {
    throw createInvalidBaseUrlError('MCP baseUrl 不能包含用户名或密码', value);
  }
  if (parsedUrl.search || parsedUrl.hash) {
    throw createInvalidBaseUrlError('MCP baseUrl 不能包含查询参数或锚点', value);
  }

  const pathname = parsedUrl.pathname.replace(/\/+$/, '');
  const endpoint = MCP_SERVER_ENDPOINTS.find((item) => (
    pathname === item || pathname.endsWith(item)
  ));
  if (endpoint) {
    throw createInvalidBaseUrlError(`MCP baseUrl 包含了具体服务路径 ${endpoint}`, value);
  }

  return `${parsedUrl.origin}${pathname}`;
}

/**
 * 确保目录存在
 * @param {string} dir - 目录路径
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 加载用户配置
 * @returns {object|null} 用户配置对象
 */
function load() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content);

    // 配置迁移：v1.x → v2.0
    if (!config.version) {
      return migrateConfig(config);
    }

    return config;
  } catch (error) {
    return null;
  }
}

/**
 * 保存用户配置
 * @param {object} config - 配置对象
 */
function save(config) {
  const baseUrl = config.mcp?.baseUrl || MCP_DEFAULT_BASE_URL;
  // 创建不可变副本，填充默认 baseUrl（避免修改原始对象）
  const configToSave = {
    ...config,
    mcp: {
      ...config.mcp,
      baseUrl: normalizeMcpBaseUrl(baseUrl)
    }
  };

  ensureDir(CONFIG_DIR);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
  // 设置文件权限为仅所有者可读写 (600)
  try {
    fs.chmodSync(CONFIG_FILE, 0o600);
  } catch (error) {
    // Windows 系统可能不支持 chmod，忽略错误
  }
}

/**
 * 获取配置文件路径
 * @returns {string} 配置文件路径
 */
function getConfigPath() {
  return CONFIG_FILE;
}

/**
 * 迁移旧配置到新格式
 * 支持 v1.x → v2.1 和 v2.0 → v2.1
 * @param {object} oldConfig - 旧配置
 * @returns {object} 新配置
 */
function migrateConfig(oldConfig) {
  return {
    version: '2.1',
    mcp: {
      enabled: oldConfig.mcp?.enabled ?? true,
      baseUrl: oldConfig.mcp?.baseUrl || '',
      authorization: oldConfig.mcp?.authorization || '',
      timeout: oldConfig.mcp?.timeout || 30000
    }
  };
}

/**
 * 获取 MCP 配置
 * @returns {object} MCP 配置
 */
function getMcpConfig() {
  const config = load();

  if (!config) {
    throw new QccError(
      ErrorType.CONFIG_NOT_FOUND,
      '未找到配置文件',
      {
        suggestion: '请先初始化配置:\n' +
          '  qcc init --authorization "<token>"  配置授权信息\n' +
          '  qcc check                         检查配置状态'
      }
    );
  }

  const baseUrl = config.mcp?.baseUrl;
  const authorization = config.mcp?.authorization;

  if (!baseUrl || !authorization) {
    throw new QccError(
      ErrorType.CONFIG_MISSING_FIELD,
      'MCP 配置不完整',
      {
        suggestion: '请补充配置:\n' +
          '  qcc init --authorization "<token>"  配置授权信息\n' +
          '  qcc check                         检查配置状态'
      }
    );
  }

  const normalizedBaseUrl = normalizeMcpBaseUrl(baseUrl);

  return {
    baseUrl: normalizedBaseUrl,
    authorization,
    timeout: config.mcp?.timeout || 30000,
    enabled: config.mcp?.enabled ?? true
  };
}

/**
 * 验证 MCP 配置是否完整
 * @returns {boolean} 是否完整
 */
function isMcpConfigValid() {
  const config = load();
  if (!config?.mcp) return false;
  if (!config.mcp.baseUrl || !config.mcp.authorization) return false;

  try {
    normalizeMcpBaseUrl(config.mcp.baseUrl);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 保存工具缓存
 * @param {object} data - 缓存数据
 */
function saveToolsCache(data) {
  ensureDir(CACHE_DIR);
  const cacheData = {
    lastUpdated: Date.now(),
    ttl: 3600000, // 1 小时
    data
  };
  fs.writeFileSync(TOOLS_CACHE_FILE, JSON.stringify(cacheData, null, 2));
}

/**
 * 检查工具缓存是否过期
 * @returns {boolean} 是否过期
 */
function isToolsCacheExpired() {
  try {
    if (!fs.existsSync(TOOLS_CACHE_FILE)) {
      return true;
    }
    const content = fs.readFileSync(TOOLS_CACHE_FILE, 'utf-8');
    const cache = JSON.parse(content);
    return Date.now() - cache.lastUpdated > cache.ttl;
  } catch (error) {
    return true;
  }
}

/**
 * 加载工具缓存（严格检查过期）
 * @returns {object|null} 缓存数据，过期时返回 null
 */
function loadToolsCache() {
  try {
    if (!fs.existsSync(TOOLS_CACHE_FILE)) {
      return null;
    }
    const content = fs.readFileSync(TOOLS_CACHE_FILE, 'utf-8');
    const cache = JSON.parse(content);

    // 检查缓存是否过期
    if (Date.now() - cache.lastUpdated > cache.ttl) {
      return null;
    }

    return cache.data;
  } catch (error) {
    return null;
  }
}

/**
 * 加载工具缓存（忽略过期，用于降级备用）
 * @returns {object|null} 缓存数据，即使过期也返回
 */
function loadToolsCacheWithFallback() {
  try {
    if (!fs.existsSync(TOOLS_CACHE_FILE)) {
      return null;
    }
    const content = fs.readFileSync(TOOLS_CACHE_FILE, 'utf-8');
    const cache = JSON.parse(content);

    // 不检查过期，直接返回数据（用于刷新失败时的降级）
    return cache.data;
  } catch (error) {
    return null;
  }
}

/**
 * 清除工具缓存
 */
function clearToolsCache() {
  if (fs.existsSync(TOOLS_CACHE_FILE)) {
    fs.unlinkSync(TOOLS_CACHE_FILE);
  }
}

/**
 * 设置配置项值
 * @param {string} keyPath - 配置路径，如 "mcp.baseUrl"
 * @param {any} value - 新值
 */
function setConfigValue(keyPath, value) {
  const parts = keyPath.split('.');
  const [module, ...keyParts] = parts;
  const validModules = ['mcp'];

  if (!validModules.includes(module)) {
    throw new Error(`未知模块: ${module}。可用模块: ${validModules.join(', ')}`);
  }

  let config = load() || {
    ...DEFAULT_CONFIG,
    mcp: { ...DEFAULT_CONFIG.mcp }
  };
  const previousValue = getConfigValue(keyPath);

  if (keyPath === 'mcp.baseUrl') {
    value = normalizeMcpBaseUrl(value);
  }

  // 设置值（支持嵌套路径）
  if (keyParts.length === 1) {
    config[module][keyParts[0]] = value;
  } else {
    // 支持更深层嵌套
    let current = config[module];
    for (let i = 0; i < keyParts.length - 1; i++) {
      if (!current[keyParts[i]]) {
        current[keyParts[i]] = {};
      }
      current = current[keyParts[i]];
    }
    current[keyParts[keyParts.length - 1]] = value;
  }

  config.version = '2.1';
  save(config);

  if (
    ['mcp.baseUrl', 'mcp.authorization'].includes(keyPath)
    && previousValue !== value
  ) {
    clearToolsCache();
  }
}

/**
 * 获取配置项值
 * @param {string} keyPath - 配置路径，如 "mcp.baseUrl"
 * @returns {any} 配置值
 */
function getConfigValue(keyPath) {
  const config = load();
  if (!config) return null;

  const parts = keyPath.split('.');
  if (parts.length === 1) {
    return config[parts[0]] ?? null;
  }

  const [module, ...keyParts] = parts;
  let current = config[module];
  for (const key of keyParts) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[key];
  }
  return current ?? null;
}

/**
 * 检查配置文件完整性
 * @returns {object} 检查结果 { valid: boolean, error: string|null, exists: boolean }
 */
function checkConfigIntegrity() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { valid: false, error: '配置文件不存在', exists: false };
    }
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content);

    // 检查基本结构
    if (!config || typeof config !== 'object') {
      return { valid: false, error: '配置文件格式错误', exists: true };
    }

    if (config.mcp?.baseUrl) {
      try {
        normalizeMcpBaseUrl(config.mcp.baseUrl);
      } catch (error) {
        return {
          valid: false,
          error: error.message,
          errorType: error.type,
          suggestion: error.suggestion,
          exists: true
        };
      }
    }

    return { valid: true, error: null, exists: true };
  } catch (error) {
    return {
      valid: false,
      error: `配置文件损坏: ${error.message}`,
      exists: true
    };
  }
}

/**
 * 获取工具缓存文件路径
 * @returns {string} 缓存文件路径
 */
function getToolsCachePath() {
  return TOOLS_CACHE_FILE;
}

module.exports = {
  // 配置读写
  load,
  save,
  getConfigPath,
  migrateConfig,
  DEFAULT_CONFIG,
  MCP_DEFAULT_BASE_URL,
  normalizeMcpBaseUrl,
  CONFIG_DIR,
  CACHE_DIR,

  // MCP 配置
  getMcpConfig,
  isMcpConfigValid,

  // 配置项操作
  setConfigValue,
  getConfigValue,
  checkConfigIntegrity,

  // 工具缓存
  saveToolsCache,
  loadToolsCache,
  loadToolsCacheWithFallback,
  isToolsCacheExpired,
  clearToolsCache,
  getToolsCachePath
};