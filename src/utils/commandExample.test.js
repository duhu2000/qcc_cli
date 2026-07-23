/* eslint-env jest */

const { buildToolCommandExample, getArrayParamHint } = require('./commandExample');

const courtNoticeTool = {
  inputSchema: {
    properties: {
      searchKey: {
        type: 'string',
        description: '企业名称或统一社会信用代码'
      },
      role: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['原告', '被告', '上诉人']
        }
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

describe('command examples', () => {
  test('builds full example with schema supplied params', () => {
    const example = buildToolCommandExample(
      'risk',
      'get_court_notice',
      courtNoticeTool,
      { role: '原告 被告', year: '2025' }
    );

    expect(example).toBe('qcc risk get_court_notice --searchKey "企业名称或统一社会信用代码" --role "原告" --role "被告" --notice_type "起诉状、上诉状副本" --year "2026"');
  });

  test('builds array parameter hint using repeated options', () => {
    const hint = getArrayParamHint(courtNoticeTool, { role: '原告 被告' });

    expect(hint).toBe('数组参数多个值请重复传入同一选项，例如 --role "原告" --role "被告"');
  });

  test('uses generic fallback for arrays without schema examples', () => {
    const tool = {
      inputSchema: {
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    };

    const example = buildToolCommandExample('demo', 'array_tool', tool);

    expect(example).toBe('qcc demo array_tool --tags "值1" --tags "值2"');
  });

  test('truncates long string descriptions for string samples', () => {
    const tool = {
      inputSchema: {
        properties: {
          searchKey: {
            type: 'string',
            description: '这是一个很长很长的参数描述用于测试截断逻辑'
          }
        }
      }
    };

    const example = buildToolCommandExample('company', 'get_company_profile', tool);

    expect(example).toBe('qcc company get_company_profile --searchKey "这是一个很长很长的参数描述用于测试截断逻..."');
  });
});
