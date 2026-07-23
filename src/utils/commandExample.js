function getSchemaType(propDef = {}) {
  const type = propDef.type;
  if (Array.isArray(type)) {
    return type.find((item) => item !== 'null');
  }
  return type;
}

function quoteValue(value) {
  const text = String(value).replace(/"/g, '\\"');
  return `"${text}"`;
}

function truncateText(value, maxLength = 20) {
  const chars = Array.from(String(value || '').trim());
  if (chars.length <= maxLength) {
    return chars.join('');
  }
  return `${chars.slice(0, maxLength).join('')}...`;
}

function getSchemaExample(propDef = {}) {
  if (propDef.default !== undefined) {
    return propDef.default;
  }
  if (propDef.example !== undefined) {
    return propDef.example;
  }
  if (Array.isArray(propDef.examples) && propDef.examples.length > 0) {
    return propDef.examples[0];
  }
  return undefined;
}

function getStringSample(propDef = {}) {
  if (propDef.enum?.length > 0) {
    return propDef.enum[0];
  }

  const schemaExample = getSchemaExample(propDef);
  if (schemaExample !== undefined) {
    return schemaExample;
  }

  if (propDef.description) {
    return truncateText(propDef.description);
  }

  return '参数值';
}

function getNumericSample(key, propDef = {}) {
  if (key.toLowerCase().includes('year')) {
    return 2026;
  }

  const type = getSchemaType(propDef);
  const schemaExample = getSchemaExample(propDef);
  if (schemaExample !== undefined && Number.isFinite(Number(schemaExample))) {
    return Number(schemaExample);
  }

  const minimum = typeof propDef.minimum === 'number' ? propDef.minimum : -Infinity;
  const maximum = typeof propDef.maximum === 'number' ? propDef.maximum : Infinity;

  if (minimum <= 1 && maximum >= 1) {
    return 1;
  }
  if (minimum > 1) {
    return type === 'integer' ? Math.ceil(minimum) : minimum;
  }
  if (maximum < 1) {
    return type === 'integer' ? Math.floor(maximum) : maximum;
  }
  return 1;
}

function getArrayExampleValues(propDef = {}) {
  const itemDef = propDef.items || {};

  if (Array.isArray(itemDef.enum) && itemDef.enum.length > 0) {
    return itemDef.enum.slice(0, 2);
  }

  const schemaExample = getSchemaExample(propDef);
  if (Array.isArray(schemaExample) && schemaExample.length > 0) {
    return schemaExample.slice(0, 2);
  }

  const itemExample = getSchemaExample(itemDef);
  if (itemExample !== undefined) {
    return [itemExample];
  }

  return null;
}

function getArraySampleValues(propDef = {}) {
  const exampleValues = getArrayExampleValues(propDef);
  if (exampleValues) {
    return exampleValues;
  }

  return ['值1', '值2'];
}

function getSampleValue(key, propDef = {}) {
  const type = getSchemaType(propDef);
  switch (type) {
    case 'integer':
    case 'number':
      return getNumericSample(key, propDef);
    case 'boolean':
      return true;
    case 'array':
      return getArraySampleValues(propDef);
    case 'object':
      return '{"key":"value"}';
    case 'string':
    default:
      return getStringSample(propDef);
  }
}

function formatParamValue(key, propDef = {}) {
  const sample = getSampleValue(key, propDef);
  return quoteValue(sample);
}

function formatParamArgs(key, propDef = {}) {
  const type = getSchemaType(propDef);
  if (type === 'array') {
    return getArraySampleValues(propDef).flatMap((value) => [`--${key}`, quoteValue(value)]);
  }

  return [`--${key}`, formatParamValue(key, propDef)];
}

function getExampleParamKeys(tool) {
  const props = tool.inputSchema?.properties || {};
  return Object.keys(props);
}

function buildToolCommandExample(serverName, toolName, tool) {
  const props = tool.inputSchema?.properties || {};
  const keys = getExampleParamKeys(tool);
  const args = keys.flatMap((key) => formatParamArgs(key, props[key]));

  return ['qcc', serverName, toolName, ...args].join(' ');
}

function getArrayParamHint(tool, userParams = {}) {
  const props = tool.inputSchema?.properties || {};
  const arrayKey = Object.keys(userParams).find((key) => getSchemaType(props[key]) === 'array')
    || Object.keys(props).find((key) => getSchemaType(props[key]) === 'array');

  if (!arrayKey) {
    return null;
  }

  return `数组参数多个值请重复传入同一选项，例如 ${formatParamArgs(arrayKey, props[arrayKey]).join(' ')}`;
}

module.exports = {
  buildToolCommandExample,
  getArrayParamHint
};
