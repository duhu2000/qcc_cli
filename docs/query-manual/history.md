# history - 历史信息

> 企业历史沿革、历史司法风险、历史投资与历史股权结构等维度的深度追溯服务。

当前服务共收录 **34** 个工具，适合用于 历史沿革追溯、历史风险回溯、历史股权与司法记录核查。

## 调用方式

```bash
qcc history <tool> --<paramKey> "<paramValue>"
```

通用参数：
- `--json`：输出原始 JSON。
- `qcc list-tools history`：查看该服务最新工具定义。
- 多参数工具需按参数说明逐项传入。

## 工具清单

| 中文名 | 工具名称 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| 历史行政许可 | `get_historical_admin_license` | 查询企业历史行政许可记录，包括许可证名称、编号、许可机关及有效期，适用于追溯企业历史资质情况，识别曾持有特定资质的主体。适用于追溯企业历史持有资质，了解业务范围历史变化、识别曾持有某类特定许可证的主体如食品经营危化品等、核查企业历史资质吊销记录，评估合规历史风险、供应链准入中核查供应商历史资质完整性等场景。数据更新频率：T+0（各行政审批机关公示系统）。 | `qcc history get_historical_admin_license --searchKey "企业名称"` |
| 历史行政处罚 | `get_historical_admin_penalty` | 查询企业历史行政处罚记录，包括处罚结果、处罚单位、处罚日期和处罚金额，用于企业合规历史深度排查。适用于企业合规历史深度排查，识别已被清除的历史处罚记录、行业合规风险评估食品环保金融等监管严格行业、配合当前行政处罚联合评估处罚频率与严重程度等场景。数据更新频率：T+0。 | `qcc history get_historical_admin_penalty --searchKey "企业名称"` |
| 历史破产重整 | `get_historical_bankruptcy` | 查询企业历史破产重整程序记录，包括案号、当事人、公开日期等，用于识别企业曾经历的极端历史风险事件。适用于企业历史破产风险识别，评估是否曾濒临破产边缘、了解历史重整程序经历，评估重整后企业治理改善情况、并购重组前的历史重大风险事件核查等场景。数据更新频率：T+0（全国企业破产重整案件信息网）。 | `qcc history get_historical_bankruptcy --searchKey "企业名称"` |
| 历史经营异常 | `get_historical_business_exception` | 查询企业历史上曾被列入经营异常名录的记录，包括列入原因、列入日期、移出原因、移出日期及决定机关，用于识别经营异常修复型主体。适用于识别经营异常修复型主体曾异常但已恢复需评估整改真实性、供应商准入背调评估合作方历史合规记录、配合历史严重违法记录评估监管风险链等场景。数据更新频率：T+0。 | `qcc history get_historical_business_exception --searchKey "企业名称"` |
| 历史立案信息 | `get_historical_case_filing` | 查询企业历史立案信息，包括案号、案由、当事人、立案日期等，用于掌握企业历史进入司法程序的起点记录。适用于掌握企业历史司法程序启动情况，了解历史涉诉广度、配合历史裁判文书开庭公告终本记录构建完整诉讼生命周期链、风控模型中历史立案频率特征提取等场景。数据更新频率：T+0。 | `qcc history get_historical_case_filing --searchKey "企业名称"` |
| 历史动产抵押 | `get_historical_chattel_mortgage` | 查询企业历史动产抵押记录，包括登记编号、抵押权人、抵押人、债务人履行债务的期限、被担保主债权数额、状态、登记日期，适用于追溯企业历史融资担保行为与资产处置轨迹。适用于追溯企业历史融资行为，了解曾以哪些动产资产作为担保物、评估企业历史偿债能力与资产处置记录、供应链金融场景下的历史担保行为核查、识别反复以同一资产抵押的风险行为模式等场景。 | `qcc history get_historical_chattel_mortgage --searchKey "企业名称"` |
| 历史法院公告 | `get_historical_court_notice` | 查询企业历史涉及的法院公告记录，包括公告类型、案号、案由、公告人、刊登日期、原被告信息（仅返回对手方），用于历史司法公告全面梳理与法律事务历史回溯。适用于企业历史司法公告全面梳理，了解历史法律事务、识别历史公告类型送达执行破产等、配合历史裁判文书和历史立案信息构建完整司法历史链等场景。数据更新频率：T+0。 | `qcc history get_historical_court_notice --searchKey "企业名称"` |
| 历史失信被执行人 | `get_historical_dishonest` | 查询企业历史上曾被列入失信被执行人名单但现已移出的记录，包含案号、执行法院、涉案金额、立案日期等，适用于识别信用修复型主体曾失信但已移出名单需评估修复真实性、授信场景中对合作方历史失信的深度排查、评估企业历史信用危机的严重程度与频率、风控模型中历史行为维度特征提取等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc history get_historical_dishonest --searchKey "企业名称"` |
| 历史环保处罚 | `get_historical_environmental_penalty` | 查询企业历史环保行政处罚记录，包括处罚结果、处罚金额及处罚机关，适用于ESG合规审查和企业环境风险历史评估。适用于ESG绿色金融场景下评估企业历史环境合规情况、供应链合规审查中核查供应商历史环保违规记录、并购尽调中评估目标企业的历史环境法律风险、政府采购或资质申请中的环保合规历史核查等场景。数据更新频率：T+0。 | `qcc history get_historical_environmental_penalty --searchKey "企业名称"` |
| 历史股权冻结 | `get_historical_equity_freeze` | 查询企业历史股权被司法冻结的记录，包括被执行人、股权数额、执行法院、冻结起止日期等，用于分析股权历史受限情况。适用于股权历史受限情况分析，识别企业是否曾遭受股权保全措施、了解历史司法保全措施，评估历史债务纠纷严重程度、并购尽调中核查历史股权司法干预情况等场景。数据更新频率：T+1。 | `qcc history get_historical_equity_freeze --searchKey "企业名称"` |
| 历史股权出质 | `get_historical_equity_pledge` | 查询企业历史股权出质记录，包括质权登记编号、出质人、质权人、出质股权数额、登记日期及状态，用于企业历史融资行为与质押风险分析。适用于企业历史融资行为分析，识别质押融资历史规模、股权历史质押风险评估，了解是否存在大比例质押、配合历史股权冻结记录综合评估股权历史受限情况等场景。数据更新频率：T+1。 | `qcc history get_historical_equity_pledge --searchKey "企业名称"` |
| 历史主要人员 | `get_historical_executives` | 查询企业历史高管任职信息，包括历任高管姓名、职务、任职日期及卸任日期，适用于追溯企业历史管理团队构成与公司治理结构历史分析。适用于追溯企业历史管理团队构成，了解治理层演变、尽调中核查前任高管背景与离职原因、公司治理结构历史分析，识别管理层频繁更换信号、配合历史法定代表人记录构建完整历史管理层画像等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc history get_historical_executives --searchKey "企业名称"` |
| 历史开庭公告 | `get_historical_hearing_notice` | 查询企业历史作为当事人的开庭公告记录，包括案号、案由、开庭时间、当事人信息等，用于历史诉讼频率统计和法律纠纷历史全貌了解。适用于企业历史诉讼频率统计，评估涉诉活跃程度、了解历史开庭案由分布，识别高频纠纷类型、配合历史裁判文书联合构建完整历史诉讼链路等场景。数据更新频率：T+0。 | `qcc history get_historical_hearing_notice --searchKey "企业名称"` |
| 历史限制高消费 | `get_historical_high_consumption_ban` | 查询企业历史上曾被法院限制高消费但现已解除的记录，包括案号、申请人、立案日期等，用于评估历史执行风险频率。适用于授信场景中识别企业历史执行风险、评估限高措施的历史频率和严重程度、配合历史被执行记录联合评估历史债务风险画像等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc history get_historical_high_consumption_ban --searchKey "企业名称"` |
| 历史荣誉信息 | `get_historical_honor` | 查询企业历史荣誉记录，包括曾获得但已过期或不再有效的资质、奖项、称号等，适用于企业历史社会信用与品牌声誉回溯。适用于企业历史社会信用与品牌声誉回溯，识别曾获政府或行业认可的主体、评估荣誉持续性，判断是否为“一次性荣誉”、招投标场景中历史资质荣誉辅助验证等场景。数据更新频率：定期更新。 | `qcc history get_historical_honor --searchKey "企业名称"` |
| 历史备案网站 | `get_historical_internet_service` | 查询企业历史备案网站记录，包括网站域名、备案号、主办单位及审核时间，适用于追溯企业互联网资产历史轨迹。适用于追溯企业互联网资产历史轨迹，识别曾运营的线上平台、网络安全审查中核查历史网站合规情况、品牌保护中监测历史域名使用记录、防止冒用历史备案信息等场景。数据更新频率：T+1（工信部ICP/IP地址/域名信息备案管理系统）。 | `qcc history get_historical_internet_service --searchKey "企业名称"` |
| 历史对外投资 | `get_historical_investments` | 查询企业历史上曾持有但已退出的对外投资记录，包括被投资企业名称、曾持有股权比例、退出日期等，还原企业历史投资版图。适用于分析企业历史投资布局与战略转型轨迹、识别已处置的历史投资关系、关联企业历史穿透核查、上下游关系历史分析等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc history get_historical_investments --searchKey "企业名称"` |
| 历史知产出质 | `get_historical_ipr_pledge` | 查询企业历史知识产权出质记录，包括质权登记编号、出质人、质权人、出质知识产权名称、登记日期及状态，适用于企业历史无形资产融资行为分析。适用于企业历史无形资产融资行为分析，了解专利商标等是否曾用于质押融资、科技型中小企业历史融资渠道回溯、并购尽调中核查知识产权是否存在历史权利负担、评估无形资产流动性等场景。 | `qcc history get_historical_ipr_pledge --searchKey "企业名称"` |
| 历史被执行人 | `get_historical_judgment_debtor` | 查询企业历史上曾作为被执行人的案件记录。适用于评估企业历史偿债能力与债务清偿习惯、深度了解企业过往执行情况，识别历史重大债务风险、授信合作前的历史被执行深度排查、风控模型历史执行特征维度等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc history get_historical_judgment_debtor --searchKey "企业名称"` |
| 历史裁判文书 | `get_historical_judicial_docs` | 查询企业历史裁判文书记录，包括文书标题、案由、案号、案件金额、裁判结果及当事人信息，适用于历史司法纠纷全面梳理。适用于企业历史司法纠纷全面梳理，法律风险历史分析、评估历史诉讼败诉比率和高频案由、并购尽调中核查历史重大诉讼判决等场景。数据更新频率：T+1至T+7（裁判文书公开存在一定延迟）。 | `qcc history get_historical_judicial_docs --searchKey "企业名称"` |
| 历史土地抵押 | `get_historical_land_mortgage` | 查询企业历史土地抵押记录，包括土地坐落、面积、抵押人、抵押权人，适用于追溯企业历史不动产抵押融资行为。适用于追溯企业历史土地使用权抵押情况，了解不动产历史担保行为、房地产建筑类企业的历史融资风险回溯、并购尽调中核查目标企业历史土地资产处置与抵押记录、评估企业历史债务偿还与土地资产释放情况等场景。数据更新频率：T+1（自然资源部土地抵押登记系统）。 | `qcc history get_historical_land_mortgage --searchKey "企业名称"` |
| 历史法定代表人 | `get_historical_legal_rep` | 查询企业历任法定代表人信息，还原企业法人更迭全链路，包含各任法定代表人姓名、任职起止日期。适用于追溯企业法人更迭历史，识别历史法人责任主体、尽职调查中核查前任法定代表人背景与风险、关联分析同一自然人跨多家企业担任法人的穿透核查、识别法人频繁更替企业的治理异常信号等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc history get_historical_legal_rep --searchKey "企业名称"` |
| 历史上市信息 | `get_historical_listing` | 查询企业历史上市挂牌信息，包括上市/挂牌日期、退市/摘牌日期、股票简称、股票代码，适用于追溯企业资本运作历史。适用于追溯企业资本运作历史，了解是否曾尝试对接资本市场、评估摘牌原因与后续发展、投融资尽调中核查历史公开披露信息、识别“伪高新”或“伪挂牌”企业等场景。数据更新频率：T+0（交易所公开数据）。 | `qcc history get_historical_listing --searchKey "企业名称"` |
| 历史专利信息 | `get_historical_patent` | 查询企业历史专利信息，包括专利名称、专利号、类型、申请日及权利人，适用于追溯企业技术资产历史积累。适用于追溯企业历史技术资产积累，评估研发持续性、识别核心技术专利是否流失、科技型企业并购尽调中的历史专利完整性核查、高新技术企业资质复核中的历史专利支撑验证等场景。数据更新频率：每周更新（国家知识产权局公开数据）。 | `qcc history get_historical_patent --searchKey "企业名称"` |
| 历史诉前调解 | `get_historical_pre_litigation_mediation` | 查询企业历史诉前调解记录，包括案由、当事人、立案日期，适用于了解企业历史商业纠纷的非诉讼处理情况。适用于追溯企业历史商业纠纷调解情况，评估非诉解决偏好、了解历史调解案由分布，识别高频调解领域、配合历史诉讼记录构建完整纠纷处理历史画像等场景。数据更新频率：T+0。 | `qcc history get_historical_pre_litigation_mediation --searchKey "企业名称"` |
| 历史双随机抽查 | `get_historical_random_check` | 查询企业历史双随机抽查记录，包括抽查事项、检查机关、抽查结果、抽查日期等，适用于企业历史日常监管表现回溯。适用于企业历史日常监管表现回溯，识别高频抽查领域如市场监管消防卫健等、评估历史抽查合格率，配合行政处罚经营异常记录构建完整监管合规画像、供应商准入中的常态化监管表现核查等场景。数据更新频率：T+1（国家双随机抽查结果公示系统）。 | `qcc history get_historical_random_check --searchKey "企业名称"` |
| 历史工商信息 | `get_historical_registration` | 查询企业历史上曾使用过但已变更的工商登记信息，包括历史曾用名、历史注册资本、历史注册地址、历史经营范围等变更轨迹。适用于企业历史沿革追溯与曾用名关联风险识别、注册资本历史变化分析、历史地址核查、供应商合作方全面背景调查等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc history get_historical_registration --searchKey "企业名称"` |
| 历史严重违法 | `get_historical_serious_violation` | 查询企业历史上曾被列入严重违法失信企业名单的记录，包括列入原因、列入日期、移出原因、移出日期，是最高等级历史信用风险回溯工具。适用于企业准入严选核查是否存在最高等级历史信用违规、合规背调评估企业历史监管处罚等级、配合经营异常历史记录联合分析监管风险链等场景。数据更新频率：T+1（市场监管总局企业信用信息公示系统）。 | `qcc history get_historical_serious_violation --searchKey "企业名称"` |
| 历史送达公告 | `get_historical_service_notice` | 查询企业历史司法送达公告记录，包括案号、发布法院，适用于追溯企业历史司法被通知情况与诉讼参与记录。适用于追溯企业历史司法纠纷中的被通知记录，了解历史诉讼参与情况、配合历史裁判文书历史开庭公告工具构建完整历史司法画像、识别曾存在大量司法通知的主体，评估历史法律风险等场景。数据更新频率：T+0。 | `qcc history get_historical_service_notice --searchKey "企业名称"` |
| 历史股东信息 | `get_historical_shareholders` | 查询企业历史股东信息，包括已完全退出的股东名称、曾持有股份比例、认缴出资额、参股日期及退出日期，还原企业历史股权结构全貌。适用于股权结构历史穿透分析，识别曾经的实际控制人、追溯股权转让路径，核查历史股权交易合规性、识别政府背景历史股东是否退出、并购尽调中的历史股权完整还原等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc history get_historical_shareholders --searchKey "企业名称"` |
| 历史抽查检查 | `get_historical_spot_check` | 查询企业历史抽查检查记录，包括检查实施机关、检查类型、检查结果、检查日期等，用于企业历史监管合规表现回溯。适用于企业历史监管合规表现回溯，识别高频被检行业如食品环保特种设备等、评估历史检查不合格记录，配合行政处罚经营异常记录构建完整监管风险画像、供应商准入中的历史监管表现核查等场景。数据更新频率：T+1（国家双随机抽查结果公示系统）。 | `qcc history get_historical_spot_check --searchKey "企业名称"` |
| 历史欠税公告 | `get_historical_tax_arrears` | 查询企业历史欠税公告记录，包括欠税税种、欠税余额、税务机关及公告日期，适用于识别企业历史税务合规情况，发现曾存在欠税问题的主体。适用于识别企业历史税务合规风险，发现曾被公告欠税的主体、授信准入审查中核查供应商或合作方的历史纳税记录、配合历史行政处罚工具构建企业完整历史合规画像等场景。数据更新频率：T+0（各省市税务局公告）。 | `qcc history get_historical_tax_arrears --searchKey "企业名称"` |
| 历史终本案件 | `get_historical_terminated_cases` | 查询企业历史终结本次执行程序案件记录，包括案号、执行法院、终本日期、立案日期、执行标的及未履行金额等，用于评估企业历史债务清偿能力。适用于评估企业历史债务清偿能力，识别历史赖账行为、了解历史执行终结情况，分析无力偿债历史、配合历史被执行记录评估企业历史综合偿债画像等场景。数据更新频率：T+1（最高人民法院中国执行信息公开网）。 | `qcc history get_historical_terminated_cases --searchKey "企业名称"` |
| 历史商标信息 | `get_historical_trademark` | 查询企业历史商标信息，包括商标名称、注册号、类别、状态，适用于追溯企业品牌资产历史布局。适用于追溯企业历史品牌资产布局，了解商标战略演变、识别核心商标是否曾被转让或失效、知识产权尽调中核查历史商标完整性、评估品牌历史稳定性等场景。数据更新频率：每周更新（国家知识产权局商标局）。 | `qcc history get_historical_trademark --searchKey "企业名称"` |

## 参数说明

### 历史行政许可 - `get_historical_admin_license`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史行政处罚 - `get_historical_admin_penalty`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史破产重整 - `get_historical_bankruptcy`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史经营异常 - `get_historical_business_exception`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史立案信息 - `get_historical_case_filing`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史动产抵押 - `get_historical_chattel_mortgage`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史法院公告 - `get_historical_court_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史失信被执行人 - `get_historical_dishonest`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史环保处罚 - `get_historical_environmental_penalty`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史股权冻结 - `get_historical_equity_freeze`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史股权出质 - `get_historical_equity_pledge`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史主要人员 - `get_historical_executives`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史开庭公告 - `get_historical_hearing_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史限制高消费 - `get_historical_high_consumption_ban`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史荣誉信息 - `get_historical_honor`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史备案网站 - `get_historical_internet_service`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史对外投资 - `get_historical_investments`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史知产出质 - `get_historical_ipr_pledge`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史被执行人 - `get_historical_judgment_debtor`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史裁判文书 - `get_historical_judicial_docs`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史土地抵押 - `get_historical_land_mortgage`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史法定代表人 - `get_historical_legal_rep`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史上市信息 - `get_historical_listing`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史专利信息 - `get_historical_patent`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史诉前调解 - `get_historical_pre_litigation_mediation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史双随机抽查 - `get_historical_random_check`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史工商信息 - `get_historical_registration`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史严重违法 - `get_historical_serious_violation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史送达公告 - `get_historical_service_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史股东信息 - `get_historical_shareholders`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史抽查检查 - `get_historical_spot_check`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史欠税公告 - `get_historical_tax_arrears`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史终本案件 - `get_historical_terminated_cases`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 历史商标信息 - `get_historical_trademark`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
