/* eslint-env jest */

const { validateMcpTool } = require('./validator');

const courtNoticeTool = {
  inputSchema: {
    properties: {
      searchKey: { type: 'string' },
      role: {
        type: 'array',
        items: { type: 'string' }
      },
      notice_type: {
        type: 'string',
        enum: ['起诉状、上诉状副本', '开庭传票']
      },
      year: { type: 'integer' }
    },
    required: ['searchKey']
  }
};

describe('validateMcpTool type coercion', () => {
  test('coerces scalar array parameter and integer parameter', () => {
    const result = validateMcpTool(
      courtNoticeTool,
      { searchKey: '企业名称', role: '原告', year: '2024' },
      { coerceTypes: true, checkType: true }
    );

    expect(result).toEqual({
      valid: true,
      errors: [],
      params: {
        searchKey: '企业名称',
        role: ['原告'],
        year: 2024
      }
    });
  });

  test('coerces repeated array parameter', () => {
    const result = validateMcpTool(
      courtNoticeTool,
      { searchKey: '企业名称', role: ['原告', '被告'] },
      { coerceTypes: true, checkType: true }
    );

    expect(result.params.role).toEqual(['原告', '被告']);
  });

  test('treats comma separated array parameter as one value', () => {
    const result = validateMcpTool(
      courtNoticeTool,
      { searchKey: '企业名称', role: '原告,被告' },
      { coerceTypes: true, checkType: true }
    );

    expect(result.params.role).toEqual(['原告,被告']);
  });

  test('omits optional string enum parameter when value is empty', () => {
    const result = validateMcpTool(
      courtNoticeTool,
      { searchKey: '企业名称', notice_type: '' },
      { coerceTypes: true, checkType: true }
    );

    expect(result).toEqual({
      valid: true,
      errors: [],
      params: {
        searchKey: '企业名称'
      }
    });
  });

  test('omits optional string enum parameter when option has no value', () => {
    const result = validateMcpTool(
      courtNoticeTool,
      { searchKey: '企业名称', notice_type: true },
      { coerceTypes: true, checkType: true }
    );

    expect(result).toEqual({
      valid: true,
      errors: [],
      params: {
        searchKey: '企业名称'
      }
    });
  });

  test('reports required string parameter without value as missing', () => {
    const result = validateMcpTool(
      courtNoticeTool,
      { searchKey: true },
      { coerceTypes: true, checkType: true }
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('缺少必填参数：--searchKey');
  });

  test('rejects comma separated enum array parameter', () => {
    const tool = {
      inputSchema: {
        properties: {
          role: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['原告', '被告']
            }
          }
        }
      }
    };

    const result = validateMcpTool(
      tool,
      { role: '原告,被告' },
      { coerceTypes: true, checkType: true }
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('参数 --role[0] 取值无效: "原告,被告"。可选值: 原告, 被告');
  });

  test('rejects invalid integer parameter before MCP call', () => {
    const result = validateMcpTool(
      courtNoticeTool,
      { searchKey: '企业名称', role: '原告', year: 'abc' },
      { coerceTypes: true, checkType: true }
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('参数 --year 期望整数，收到 "abc"');
  });

  test('rejects numeric values below schema minimum', () => {
    const result = validateMcpTool(
      {
        inputSchema: {
          properties: {
            year: { type: 'integer', minimum: 1900, maximum: 2999 }
          }
        }
      },
      { year: '1800' },
      { coerceTypes: true, checkType: true }
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('参数 --year 不能小于 1900，收到 1800');
  });

  test('rejects numeric values above schema maximum', () => {
    const result = validateMcpTool(
      {
        inputSchema: {
          properties: {
            year: { type: 'integer', minimum: 1900, maximum: 2999 }
          }
        }
      },
      { year: '3000' },
      { coerceTypes: true, checkType: true }
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('参数 --year 不能大于 2999，收到 3000');
  });
});
