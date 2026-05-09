# company - 企业信息

> 多维度企业画像洞察，核验企业资质，评估发展轨迹，为商业决策提供数据支撑。

当前服务共收录 **15** 个工具，适合用于 企业画像、工商核验、股权结构与财务概览。

## 调用方式

```bash
qcc company <tool> --<paramKey> "<paramValue>"
```

通用参数：
- `--json`：输出原始 JSON。
- `qcc list-tools company`：查看该服务最新工具定义。
- 多参数工具需按参数说明逐项传入。

## 工具清单

| 中文名 | 工具名称 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| 实际控制人 | `get_actual_controller` | 查询企业的实际控制人详情，适用于企业风险评估、关联交易识别及商业竞争分析场景。 | `qcc company get_actual_controller --searchKey "企业名称"` |
| 企业年报 | `get_annual_reports` | 查询企业年度报告信息，包括报告年度、统一社会信用代码、注册号、企业经营状态、从业人数、股东股权转让情况、投资信息等。数据更新频率：每年更新，通常在企业完成工商年报公示后同步（一般集中于每年6月前）。 | `qcc company get_annual_reports --searchKey "企业名称"` |
| 受益所有人 | `get_beneficial_owners` | 查询企业的受益所有人信息，适用于反洗钱合规（AML）、尽职调查及穿透式监管分析场景。 | `qcc company get_beneficial_owners --searchKey "企业名称"` |
| 分支机构 | `get_branches` | 查询企业的分支机构信息，包括分支机构名称、负责人、地区、成立日期、登记状态。适用于了解企业组织架构的场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc company get_branches --searchKey "企业名称"` |
| 变更记录 | `get_change_records` | 用于查询企业的历史变更记录，包括变更事项、变更前后内容、变更日期等企业发展变化信息。适用于企业股权变更跟踪、经营范围调整了解、重要事项变更历史查询等场景。数据更新频率：T+0。 | `qcc company get_change_records --searchKey "企业名称"` |
| 企业简介 | `get_company_profile` | 查询企业的简介信息，包括企业名称、简介、企查查行业。适用于企业画像构建、企业业务分析场景。数据更新频率：定期人工维护更新。 | `qcc company get_company_profile --searchKey "企业名称"` |
| 企业工商信息 | `get_company_registration_info` | 查询企业的核心登记信息，当用户需要验证企业身份、了解基本概况（如法定代表人、注册资本、成立时间等）时调用。可提供企业名称、统一社会信用代码、法定代表人、注册资本、成立日期、登记状态、注册地址等关键工商登记信息，支持通过企业名称或统一社会信用代码精确查询。适用于深入了解企业工商背景的场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc company get_company_registration_info --searchKey "企业名称"` |
| 联系方式 | `get_contact_info` | 查询企业的联系方式信息，包括电话号码、用途标签、邮箱、企业网站、是否是官网、ICP备案。适用于拓客、获取企业联系方式的场景。数据更新频率：基于公开信息定期更新，部分联系方式可能存在滞后。 | `qcc company get_contact_info --searchKey "企业名称"` |
| 对外投资 | `get_external_investments` | 查询企业对外投资信息，包括被投资企业名称、状态、成立日期、持股比例、认缴出资额/持股数。适用于分析企业投资布局的场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc company get_external_investments --searchKey "企业名称"` |
| 财务数据 | `get_financial_data` | 用于检索指定企业的核心财务数据，涵盖资产负债、利润表现、营运能力、偿还能力、成长能力及关键财务比率。适用于企业尽调、偿债能力分析、经营效率评估及成长性研判，企业财务快速扫描、信贷初筛、投资快筛、供应商财务健康度核查、多期财务趋势对比分析。 | `qcc company get_financial_data --searchKey "企业名称"` |
| 主要人员 | `get_key_personnel` | 用于查询企业主要管理人员信息，包括姓名、职务等高管构成情况。适用于企业管理团队了解、核心人员识别、公司治理结构分析等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc company get_key_personnel --searchKey "企业名称"` |
| 上市信息 | `get_listing_info` | 查询企业的上市信息，包括上市日期、股票简称、股票代码、上市交易所、总市值、总股本、发行日期、发行量。适用于投资分析场景。数据更新频率：T+0（交易所公开数据）。 | `qcc company get_listing_info --searchKey "企业名称"` |
| 股东信息 | `get_shareholder_info` | 用于查询企业股东构成信息，包括投资人姓名、持股比例、认缴出资额、出资时间等股权结构情况。适用于企业股权结构分析、实际控制人识别、股东背景调查等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc company get_shareholder_info --searchKey "企业名称"` |
| 税号开票信息 | `get_tax_invoice_info` | 查询企业的税号开票信息，包括纳税人识别号、企业名称、企业类型、地址、联系电话、开户行、开户行账号。适用于财务开票场景。数据更新频率：定期更新，以工商登记信息为准。 | `qcc company get_tax_invoice_info --searchKey "企业名称"` |
| 企业准确性验证 | `verify_company_accuracy` | 用于核实企业名称、法定代表人与统一社会信用代码的匹配性。适用于企业实名认证、准入资质初审及基础信息准确性校验场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc company verify_company_accuracy --searchKey "企业名称" --name "企业名称或法定代表人名称"` |

## 参数说明

### 实际控制人 - `get_actual_controller`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 企业年报 - `get_annual_reports`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 受益所有人 - `get_beneficial_owners`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 分支机构 - `get_branches`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 变更记录 - `get_change_records`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 企业简介 - `get_company_profile`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 企业工商信息 - `get_company_registration_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 联系方式 - `get_contact_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 对外投资 - `get_external_investments`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 财务数据 - `get_financial_data`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 主要人员 - `get_key_personnel`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 上市信息 - `get_listing_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 股东信息 - `get_shareholder_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 税号开票信息 - `get_tax_invoice_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 企业准确性验证 - `verify_company_accuracy`

- `searchKey`（必填，string）：统一社会信用代码
- `name`（必填，string）：企业名称或法定代表人名称
