# risk - 风险信息

> 企业风险深度扫描，识别合规信用隐患，精准评估合作风险。

当前服务共收录 **35** 个工具，适合用于 司法风险、信用风险、税务风险、担保与资产受限排查。

## 调用方式

```bash
qcc risk <tool> --<paramKey> "<paramValue>"
```

通用参数：
- `--json`：输出原始 JSON。
- `qcc list-tools risk`：查看该服务最新工具定义。
- 可选过滤参数可按工具 schema 追加；CLI 会按工具 schema 自动转换数字、布尔值和数组。
- 数组类型参数可传单个值，例如 `--role "原告"`；多个值请重复传入同一选项，例如 `--role "原告" --role "被告"`。

## 工具清单

| 中文名 | 工具名称 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| 行政处罚 | `get_administrative_penalty` | 用于查询企业受到的行政处罚记录，包括处罚结果、处罚日期、处罚金额、处罚机关等监管处罚信息。适用于企业合规经营情况评估、违规成本分析、行政处罚历史查询等场景。数据更新频率：T+0。 | `qcc risk get_administrative_penalty --searchKey "企业名称" --date_from "2024-01-01"` |
| 破产重整 | `get_bankruptcy_reorganization` | 用于查询企业破产重整相关信息，包括案号、申请人、被申请人、公开日期等破产程序信息。适用于企业破产风险识别、重整程序跟踪、债权人申请情况了解等场景。数据更新频率：T+0（全国企业破产重整案件信息网）。 | `qcc risk get_bankruptcy_reorganization --searchKey "企业名称"` |
| 经营异常 | `get_business_exception` | 用于查询企业是否被列入经营异常名录，包括列入日期、移出原因和决定机关。适用于企业正常经营状态判断、轻微违规情况了解、企业信用修复跟踪等场景。数据更新频率：T+0。 | `qcc risk get_business_exception --searchKey "企业名称"` |
| 注销备案 | `get_cancellation_record_info` | 用于查询企业注销备案情况，包括注销原因、注销日期、公告状态等企业终止经营信息。适用于企业存续状态确认、注销程序了解、经营主体资格查询等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc risk get_cancellation_record_info --searchKey "企业名称"` |
| 立案信息 | `get_case_filing_info` | 用于查询企业涉及的法院立案信息，包括案号、案由、立案日期、原被告双方等案件基本信息。适用于企业诉讼情况初步了解、法律纠纷数量统计、案件类型分布分析等场景。数据更新频率：T+0。 | `qcc risk get_case_filing_info --searchKey "企业名称" --role "原告" --year 2024` |
| 动产抵押 | `get_chattel_mortgage_info` | 查询企业动产抵押信息，包括登记编号、抵押人、抵押权人、债务人履行债务的期限、被担保主债权数额、状态、登记日期。适用于动产融资评估场景。 | `qcc risk get_chattel_mortgage_info --searchKey "企业名称"` |
| 法院公告 | `get_court_notice` | 用于查询企业涉及的法院公告信息，包括公告类型、案由、原告被告信息、刊登日期等司法公告内容。适用于企业法律事务公告查询、诉讼当事人信息了解、司法程序进展跟踪等场景。数据更新频率：T+0。 | `qcc risk get_court_notice --searchKey "企业名称" --role "原告" --notice_type "开庭传票" --year 2024` |
| 违约事项 | `get_default_info` | 查询企业债券违约、票据违约、非标资产违约信息，包括债券简称、债券类型、违约状态、首次违约日期、累计违约本金、累计违约利息、到期日期。适用于债券投资风险分析场景。数据更新频率：T+0（交易所及债券市场公开披露）。 | `qcc risk get_default_info --searchKey "企业名称"` |
| 惩戒名单 | `get_disciplinary_list` | 查询企业惩戒名单信息，包括类型、惩戒名单领域、列入原因、列入机关、列入日期。适用于信用评估场景。数据更新频率：T+0（国家信用信息共享平台）。 | `qcc risk get_disciplinary_list --searchKey "企业名称"` |
| 失信信息 | `get_dishonest_info` | 用于查询企业是否存在失信信息，包括失信被执行人名称、涉案金额、执行法院、立案日期、发布日期。适用于企业信用评估、法律风险分析、欠款违约情况调查等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc risk get_dishonest_info --searchKey "企业名称"` |
| 环保处罚 | `get_environmental_penalty` | 用于查询企业受到的环保行政处罚，包括处罚结果、处罚日期、处罚单位、处罚金额等环境违法信息。适用于企业环保合规情况评估、环境风险控制、绿色经营能力判断等场景。数据更新频率：T+0。 | `qcc risk get_environmental_penalty --searchKey "企业名称"` |
| 股权冻结 | `get_equity_freeze` | 用于查询企业股权被司法冻结的情况，包括被冻结股权数额、冻结期限、执行法院等股权受限信息。适用于股东权益风险评估、股权变更限制了解、司法保全措施查询等场景。数据更新频率：T+1。 | `qcc risk get_equity_freeze --searchKey "企业名称"` |
| 股权出质 | `get_equity_pledge_info` | 用于查询企业股权出质情况，包括出质人、质权人、出质股权数额、登记日期、出质状态等股权融资信息。适用于企业融资状况分析、股权风险评估、股东资金需求判断等场景。数据更新频率：T+1。 | `qcc risk get_equity_pledge_info --searchKey "企业名称"` |
| 限制出境 | `get_exit_restriction` | 查询企业相关人员被法院限制出境的情况。适用于高管个人风险排查、重大案件执行跟踪及司法强制措施预警场景。数据更新频率：T+0。 | `qcc risk get_exit_restriction --searchKey "企业名称"` |
| 担保信息 | `get_guarantee_info` | 查询企业担保信息，包括担保方、被担保方、担保方式、担保金额、履行状态、公告日期。适用于评估企业担保风险场景。数据更新频率：T+0。 | `qcc risk get_guarantee_info --searchKey "企业名称"` |
| 开庭公告 | `get_hearing_notice` | 用于查询企业作为当事人的开庭公告信息，包括案号、案由、开庭时间、当事人身份等庭审排期信息。适用于企业诉讼动态跟踪、庭审时间安排查询、法律纠纷进展了解等场景。数据更新频率：T+0。 | `qcc risk get_hearing_notice --searchKey "企业名称" --role "原告" --year 2024` |
| 限制高消费 | `get_high_consumption_restriction` | 用于查询企业是否存在被法院限制高消费的情况，包括限制法定代表人、申请人、立案日期等执行信息。适用于信用风险评估、合作伙伴风险排查、法律风险预警等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc risk get_high_consumption_restriction --searchKey "企业名称"` |
| 被执行人 | `get_judgment_debtor_info` | 用于查询企业作为被执行人的案件信息，包括执行标的、立案时间、执行法院等执行程序信息。适用于企业债务执行情况了解、强制执行风险判断、执行金额规模评估等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc risk get_judgment_debtor_info --searchKey "企业名称"` |
| 司法拍卖 | `get_judicial_auction` | 用于查询企业资产被司法拍卖的信息，包括拍卖标题、起拍价、评估价、拍卖时间、处置单位等资产处置情况。适用于企业资产被执行处置了解、司法变现情况跟踪、债权人受偿可能性评估等场景。适用于资产处置分析场景。数据更新频率：T+0（各省法院司法拍卖平台）。 | `qcc risk get_judicial_auction --searchKey "企业名称"` |
| 裁判文书 | `get_judicial_documents` | 用于查询企业涉及的法院判决文书，包括案件案由、裁判结果、涉案金额、当事人信息等司法判决信息。适用于企业法律纠纷历史分析、诉讼风险评估、判决结果查询等场景。数据更新频率：T+1至T+7（裁判文书公开存在一定延迟）。 | `qcc risk get_judicial_documents --searchKey "企业名称" --role "原告" --year 2024` |
| 土地抵押 | `get_land_mortgage_info` | 查询企业土地抵押信息，包括土地坐落、抵押人、抵押权人、抵押起止日期、抵押面积、抵押金额、抵押土地用途。适用于土地资产抵押分析场景。数据更新频率：T+1（自然资源部土地抵押登记系统）。 | `qcc risk get_land_mortgage_info --searchKey "企业名称"` |
| 清算信息 | `get_liquidation_info` | 查询企业清算信息，包括清算组负责人、清算组成员。适用于企业破产或解散清算分析场景。数据更新频率：T+1。 | `qcc risk get_liquidation_info --searchKey "企业名称"` |
| 诉前调解 | `get_pre_litigation_mediation` | 查询企业诉前调解记录，包括案号、案由、当事人、法院、立案日期 。适用于纠纷解决跟踪场景。数据更新频率：T+0。 | `qcc risk get_pre_litigation_mediation --searchKey "企业名称"` |
| 财产悬赏公告 | `get_property_asset_announcement` | 查询企业相关的财产悬赏公告，返回案号、被执行人、执行标的金额、未履行金额、执行法院、更新日期。适用场景：资产追踪与追偿分析、风控核查中识别被执行主体尚有未履行债务、供应商/合作方信用背景评估。 | `qcc risk get_property_asset_announcement --searchKey "企业名称"` |
| 公示催告 | `get_public_exhortation` | 查询企业公示催告信息，包括票据号、申请人、持票人、票面金额、票据类型、发布机关、公告日期。适用于票据遗失等法律程序查询场景。数据更新频率：T+0。 | `qcc risk get_public_exhortation --searchKey "企业名称"` |
| 严重违法 | `get_serious_violation` | 查询企业是否被列入严重违法失信名单。适用于企业准入严选、重大合规性审查及最高等级信用风险评估场景。数据更新频率：T+1（市场监管总局企业信用信息公示系统）。 | `qcc risk get_serious_violation --searchKey "企业名称"` |
| 劳动仲裁 | `get_service_announcement` | 查询企业涉及的劳动仲裁开庭公告和送达公告，包括仲裁案号、申请人、被申请人及公告发布日期。适用于企业劳动纠纷监控、劳动仲裁程序跟踪及用工风险排查场景。数据更新频率：T+0。 | `qcc risk get_service_announcement --searchKey "企业名称"` |
| 送达公告 | `get_service_notice` | 查询企业相关送达公告，包括案号、案由、当事人、法院、发布日期。适用于法律文书送达情况场景。数据更新频率：T+0。 | `qcc risk get_service_notice --searchKey "企业名称" --role "原告" --year 2024` |
| 简易注销 | `get_simple_cancellation_info` | 用于查询企业简易注销相关信息，包括公告期、注销结果、登记机关等简化注销程序情况。适用于企业注销程序了解、简易注销适用情况确认、市场主体退出机制跟踪等场景。数据更新频率：T+1。 | `qcc risk get_simple_cancellation_info --searchKey "企业名称"` |
| 股权质押 | `get_stock_pledge_info` | 查询企业股权质押信息，包括质押人、质押人参股企业、质押权人、质押股份总数、质押股份市值、状态、公告日期。适用于股票质押风险分析场景。数据更新频率：T+0（交易所公告披露）。 | `qcc risk get_stock_pledge_info --searchKey "企业名称"` |
| 税务非正常户 | `get_tax_abnormal` | 查询企业税务非正常户记录。适用于企业税务合规性扫描、税务黑名单核查及合作伙伴财务风险预警场景。数据更新频率：T+0（国家税务总局）。 | `qcc risk get_tax_abnormal --searchKey "企业名称"` |
| 欠税公告 | `get_tax_arrears_notice` | 用于查询企业欠税情况，包括欠税税种、欠税余额、当前新发生的欠税金额、发布单位和发布日期等税务欠款信息。适用于企业纳税信用评估、税务风险判断、欠税情况跟踪等场景。数据更新频率：T+0（各省市税务局公告）。 | `qcc risk get_tax_arrears_notice --searchKey "企业名称"` |
| 税收违法 | `get_tax_violation` | 用于查询企业税收违法信息，包括案件性质、所属税务机关、发布日期等税务违法情况。适用于企业纳税信用评估、税务合规风险识别、税收违法行为类型分析等场景。数据更新频率：T+0（国家税务总局重大税收违法失信主体公告）。 | `qcc risk get_tax_violation --searchKey "企业名称"` |
| 终本案件 | `get_terminated_cases` | 用于查询企业涉及的终结本次执行程序案件信息，包括终本日期、执行标的、未履行金额等执行终结情况。适用于企业执行风险了解、债务清偿能力评估、终本案件统计分析等场景。数据更新频率：T+1（最高人民法院中国执行信息公开网）。 | `qcc risk get_terminated_cases --searchKey "企业名称"` |
| 询价评估 | `get_valuation_inquiry` | 查询企业资产询价评估信息，包括案号、标的物、所有人、当事人、询价结果、法院、发布日期。适用于资产评估场景。数据更新频率：T+0。 | `qcc risk get_valuation_inquiry --searchKey "企业名称"` |

## 参数说明

### 行政处罚 - `get_administrative_penalty`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `date_from`（可选，string）：处罚日期起始过滤，格式 YYYY-MM-DD。用户说'近三年的处罚'时传当前日期减三年；说'2022年以后'时传 '2022-01-01'；说'最近的处罚''近期'时传当前日期减一年；未提及时间时不传。 格式 ^\d{4}-\d{2}-\d{2}$。

### 破产重整 - `get_bankruptcy_reorganization`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 经营异常 - `get_business_exception`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 注销备案 - `get_cancellation_record_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 立案信息 - `get_case_filing_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `role`（可选，array<string>）：当事人角色过滤，支持多选。未提及角色或传空数组时不传，返回全部。 可选值：原告、被告、上诉人、被上诉人、申请执行人、申请人、被执行人、被申请人、第三人、其他。
- `year`（可选，integer）：立案年份过滤，传四位数年份如 2024。未提及年份时不传，返回全部。跨年查询由 AI 侧逐年分别调用后合并结果。 最小值 1900，最大值 2999。

### 动产抵押 - `get_chattel_mortgage_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 法院公告 - `get_court_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `role`（可选，array<string>）：当事人角色过滤，支持多选。未提及角色或传空数组时不传，返回全部。 可选值：原告、被告、上诉人、被上诉人、申请执行人、申请人、被执行人、被申请人、第三人、其他。
- `notice_type`（可选，string）：公告类型过滤，单选。根据用户描述选择最匹配的类型传入，未提及类型时不传，返回全部。 可选值：起诉状、上诉状副本、开庭传票、裁判文书、公示催告、破产文书、宣告失踪、死亡、执行文书、无主财产认领公告、起诉状副本及开庭传票、更正、遗失声明、司法鉴定书、海事文书、仲裁文书、拍卖公告、清算公告、行政处罚通知书、版权公告、公益诉讼、送达公告、其他。
- `year`（可选，integer）：刊登年份过滤，传四位数年份如 2024。未提及年份时不传，返回全部。跨年查询由 AI 侧逐年分别调用后合并结果。 最小值 1900，最大值 2999。

### 违约事项 - `get_default_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 惩戒名单 - `get_disciplinary_list`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 失信信息 - `get_dishonest_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 环保处罚 - `get_environmental_penalty`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 股权冻结 - `get_equity_freeze`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 股权出质 - `get_equity_pledge_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 限制出境 - `get_exit_restriction`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 担保信息 - `get_guarantee_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 开庭公告 - `get_hearing_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `role`（可选，array<string>）：当事人角色过滤，支持多选。未提及角色或传空数组时不传，返回全部。 可选值：原告、被告、上诉人、被上诉人、申请执行人、申请人、被执行人、被申请人、第三人、其他。
- `year`（可选，integer）：开庭年份过滤，传四位数年份如 2024。未提及年份时不传，返回全部。跨年查询由 AI 侧逐年分别调用后合并结果。 最小值 1900，最大值 2999。

### 限制高消费 - `get_high_consumption_restriction`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 被执行人 - `get_judgment_debtor_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 司法拍卖 - `get_judicial_auction`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 裁判文书 - `get_judicial_documents`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `role`（可选，array<string>）：当事人角色过滤，支持多选。未提及角色或传空数组时不传，返回全部。 可选值：原告、被告、上诉人、被上诉人、申请执行人、申请人、被执行人、被申请人、第三人、其他。
- `year`（可选，integer）：发布年份过滤，传四位数年份如 2024。未提及年份时不传，返回全部。跨年查询由 AI 侧逐年分别调用后合并结果。 最小值 1900，最大值 2999。

### 土地抵押 - `get_land_mortgage_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 清算信息 - `get_liquidation_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 诉前调解 - `get_pre_litigation_mediation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 财产悬赏公告 - `get_property_asset_announcement`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 公示催告 - `get_public_exhortation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 严重违法 - `get_serious_violation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 劳动仲裁 - `get_service_announcement`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 送达公告 - `get_service_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `role`（可选，array<string>）：当事人角色过滤，支持多选。未提及角色或传空数组时不传，返回全部。 可选值：原告、被告、上诉人、被上诉人、申请执行人、申请人、被执行人、被申请人、第三人、其他。
- `year`（可选，integer）：发布年份过滤，传四位数年份如 2024。未提及年份时不传，返回全部。跨年查询由 AI 侧逐年分别调用后合并结果。 最小值 1900，最大值 2999。

### 简易注销 - `get_simple_cancellation_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 股权质押 - `get_stock_pledge_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 税务非正常户 - `get_tax_abnormal`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 欠税公告 - `get_tax_arrears_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 税收违法 - `get_tax_violation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 终本案件 - `get_terminated_cases`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 询价评估 - `get_valuation_inquiry`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
