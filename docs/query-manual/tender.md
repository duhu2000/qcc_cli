# 标讯数据（tender）查询手册

`tender` 是通用 MCP 服务，使用统一的 `mcp.baseUrl`、Authorization、工具缓存、参数校验与输出格式，不需要单独配置或专用命令。

## 使用前准备

首次使用或服务端工具定义发生变化时，先更新并查看实时工具 schema：

```bash
qcc update
qcc list-tools tender
```

服务端 schema 是参数名称、枚举值与必填规则的最终依据。

## 工具概览

| 工具 | 用途 |
| :--- | :--- |
| `search_tenders` | 按关键词、地区、时间及业务条件跨企业检索招投标标讯 |
| `get_tender_detail` | 使用标讯 ID 查询招投标详情 |
| `search_proposed_projects` | 按关键词、地区、阶段及投资金额检索拟建项目 |
| `get_proposed_project_detail` | 使用拟建项目 ID 查询项目详情 |
| `search_companies` | 按关键词、地区、角色、行业及登记状态检索企业 |
| `search_company_tenders` | 使用企业 ID 查询该企业相关招投标标讯 |

## 调用示例

仅传一个业务参数时，包含 `keywords` 参数的搜索工具可将单个关键词作为位置参数传入。多个关键词或增加其他筛选条件时，必须显式指定所有参数名；数组参数可重复传入：

```bash
qcc tender search_tenders "智慧工地"

qcc tender search_tenders --keywords "数据治理" --keywords "数字政府" --regions "江苏省苏州市" --beginDate "2026-01-01"

qcc tender search_proposed_projects --keywords "产业园" --regions "江苏省苏州市"

qcc tender search_companies --keywords "企查查" --regions "江苏省"
```

带必填 `id` 的工具可把 `id` 作为位置参数传入：

```bash
qcc tender get_tender_detail "<标讯ID>"

qcc tender get_proposed_project_detail "<拟建项目ID>"

qcc tender search_company_tenders --id "<企业ID>" --role "3" --beginDate "2026-01-01"
```

需要原始 JSON 时，在命令中追加 `--json`。需要继续分页时，按工具返回值和 `qcc list-tools tender` 显示的 schema 传入 `--cursor`。
