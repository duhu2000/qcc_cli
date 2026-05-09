# operation - 经营信息

> 企业经营动态监测，还原企业经营现状，为合作决策提供商业情报。

当前服务共收录 **35** 个工具，适合用于 经营动态、资质许可、融资、舆情、监管与市场活动分析。

## 调用方式

```bash
qcc operation <tool> --<paramKey> "<paramValue>"
```

通用参数：
- `--json`：输出原始 JSON。
- `qcc list-tools operation`：查看该服务最新工具定义。
- 可选过滤参数可按工具 schema 追加；未提及的可选参数可省略。

## 工具清单

| 中文名 | 工具名称 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| 行政许可 | `get_administrative_license` | 查询企业行政许可信息。适用于企业合法经营资质核查、业务准入资格审查及合规性分析场景。数据更新频率：T+0（各行政审批机关公示系统）。 | `qcc operation get_administrative_license --searchKey "企业名称"` |
| 广告审查 | `get_advertising_review` | 查询企业相关产品的广告审查批准信息，返回广告批准文号、产品名称、批准文号/注册号、所属类别、广告审查机关及广告审查日期。适用场景：医药、保健品等特殊行业广告合规核查、媒体投放前广告资质验证、监管合规背景评估。 | `qcc operation get_advertising_review --searchKey "企业名称"` |
| 资产拍卖 | `get_asset_auction` | 查询企业相关的资产拍卖信息，返回拍卖标题、起拍价、竞拍时间、结束时间及处置单位。适用场景：企业资产处置风险识别、法拍资产信息获取、资产交易投资机会分析。 | `qcc operation get_asset_auction --searchKey "企业名称"` |
| 招投标信息 | `get_bidding_info` | 用于查询企业参与的招投标项目信息，包括项目名称、中标情况、项目金额、招标单位等市场活动信息。适用于企业业务拓展情况分析、市场份额评估、竞争对手中标情况了解等场景。数据更新频率：T+0（聚合全国各级公共资源交易平台数据）。 | `qcc operation get_bidding_info --searchKey "企业名称" --role "中标方" --date_from "2024-01-01"` |
| 企业公告 | `get_company_announcement` | 查询企业发布的各类公告。适用于追踪上市企业重大动态、披露信息核查及企业信息透明度评估场景。数据更新频率：T+0（沪深港等交易所公告系统）。 | `qcc operation get_company_announcement --searchKey "企业名称"` |
| 假冒化妆品 | `get_counterfeit_cosmetics` | 查询企业涉及的假冒化妆品公告信息，返回产品名称、规格、生产商、授权商、运营单位及公告时间。适用场景：化妆品行业渠道合规评估、品牌方识别未授权假冒产品、化妆品经销商资质核查。 | `qcc operation get_counterfeit_cosmetics --searchKey "企业名称"` |
| 信用承诺 | `get_credit_commitments` | 查询企业向监管机构或社会做出的公开信用承诺记录，返回编码、类型、承诺事由、承诺作出日期、履行状态及受理单位。适用场景：企业合规诚信度评估、审查企业是否参与告知承诺制审批、识别存在违约失信风险的承诺主体。 | `qcc operation get_credit_commitments --searchKey "企业名称"` |
| 信用评价 | `get_credit_evaluation` | 查询企业由政府监管机构出具的官方信用评级，包括国家税务总局的纳税信用等级及海关总署的海关信用等级（高级认证/一般认证等），含评价年度和评价单位。适用于企业税务合规性核查、海关资质评估、供应商信用背调及政府采购资格审查场景。数据更新频率：T+0。 | `qcc operation get_credit_evaluation --searchKey "企业名称"` |
| 未准入境 | `get_entry_denied` | 查询企业相关产品未获准入境的通报记录，返回产品名称、产品类型、生产企业信息/品牌、数量/重量、原因、进境口岸、报送时间及发布日期。适用场景：进出口企业合规风险核查、供应链质量评估、外资企业入华合规筛查、采购前供应商品质背景调查。 | `qcc operation get_entry_denied --searchKey "企业名称"` |
| 租赁融资 | `get_financing_lease_info` | 查询企业融资租赁登记记录，支持承租方和出租方两个视角查询。返回字段包括承租人、出租人、登记证明编号、登记日期、租赁财产价值、登记期限、登记状态、登记到期日。适用于了解企业通过融资租赁方式进行融资的情况、了解企业开展融资租赁业务的客户与规模、核查企业资产负债中的租赁资产情况、尽职调查中评估企业融资结构与负债风险、判断企业是否存在大额租赁集中到期压力等场景。 | `qcc operation get_financing_lease_info --searchKey "企业名称"` |
| 融资信息 | `get_financing_records` | 查询企业融资信息，包括创投融资、上市融资、增发融资。适用于追踪企业成长轨迹、投融资历史分析及市场认可度评估场景。数据更新频率：实时监控公开披露与主流媒体报道。 | `qcc operation get_financing_records --searchKey "企业名称"` |
| 食品安全 | `get_food_safety` | 查询企业相关的食品安全抽检信息，返回食品名称、抽检次数、被抽检企业、标称生产企业、标称生产企业地址、规格型号、生产日期/批号及抽检结果。适用场景：食品行业供应商准入质量评估、食品企业合规背景核查、商超采购商对供货商资质评估。 | `qcc operation get_food_safety --searchKey "企业名称"` |
| 游戏审批 | `get_game_approval` | 查询企业相关游戏产品的审批版号信息，返回名称、申报类别、审批类型、运营单位、出版单位、文号、出版物号及批准时间。适用场景：游戏行业合规核查、投资游戏企业前的版号核实、游戏渠道商确认合作产品资质。 | `qcc operation get_game_approval --searchKey "企业名称"` |
| 政府公告 | `get_government_announcement` | 查询与企业相关的政府部门公告信息，返回公告标题、发布机构、发布日期、公告类型。适用场景：政策影响分析、企业涉及政府监管公告的快速检索、招标合规项目审批信息跟踪。 | `qcc operation get_government_announcement --searchKey "企业名称"` |
| 政府约谈 | `get_government_interview` | 查询企业被政府部门约谈的相关信息，返回新闻标题、约谈问题、约谈机关、约谈日期及发布日期。适用场景：企业合规监管风险跟踪、供应商准入前的监管风险评估、识别曾被监管部门重点关注的企业。 | `qcc operation get_government_interview --searchKey "企业名称"` |
| 荣誉信息 | `get_honor_info` | 查询企业获得的荣誉信息，包括名称、荣誉类型、级别、认证年份、发布日期、发布单位。适用于企业声誉评估场景。数据更新频率：定期更新。 | `qcc operation get_honor_info --searchKey "企业名称"` |
| 进出口信用 | `get_import_export_credit` | 查询企业进出口信用信息，包括统一社会信用代码、所在地海关、行政区划、地址、经济区划、经营类别、统计经济区划、行业种类、跨境贸易电子商务类型、信用等级、备案日期。适用于国际贸易合作评估场景。数据更新频率：T+1。 | `qcc operation get_import_export_credit --searchKey "企业名称"` |
| 投资机构 | `get_investment_institution` | 查询企业的投资机构基本信息，返回投资机构名称、机构类型、总部地区、成立年份、管理资金规模。适用场景：创业企业了解潜在投资人背景、投融资市场分析、投资机构画像评估。 | `qcc operation get_investment_institution --searchKey "企业名称"` |
| 国有土地受让 | `get_land_grant_info` | 查询企业参与国有土地使用权受让信息。返回信息包括土地位置、土地面积、成交价格、土地用途、发布/批准单位、发布/签订日期。适用于评估企业土地资产规模、核查固定资产投入、了解区域扩张布局等场景。 | `qcc operation get_land_grant_info --searchKey "企业名称"` |
| 土地转让 | `get_land_transfer_info` | 查询企业作的土地转让记录。返回信息包括土地位置、土地面积、转让价格、土地用途、原土地使用权人、现土地使用权人、成交日期。适用于追踪土地资产流转历史、识别关联主体间土地交易、评估企业土地处置行为等场景。 | `qcc operation get_land_transfer_info --searchKey "企业名称"` |
| 新闻舆情 | `get_news_sentiment` | 用于查询企业相关的新闻报道和舆情信息，包括新闻标题、发布时间和情感倾向时使用。适用于企业声誉监控、品牌形象分析、危机公关预警、媒体关注度评估、企业重大事项跟踪场景。数据更新频率：T+0。 | `qcc operation get_news_sentiment --searchKey "企业名称" --sentiment "消极" --date_from "2024-01-01"` |
| 私募基金管理人 | `get_private_fund_manager` | 查询企业的私募基金管理人登记信息，返回私募基金管理人名称、登记编号、登记日期、机构类型、管理规模区间及管理基金数。适用场景：私募基金管理人资质核查、金融机构合作前背景尽调、投资机构规模与类型识别。 | `qcc operation get_private_fund_manager --searchKey "企业名称"` |
| 产品召回 | `get_product_recall` | 查询企业涉及的产品召回信息，返回召回产品、召回企业及发布日期。适用场景：产品质量安全风险评估、消费品企业供应链准入核查、品牌声誉背调。 | `qcc operation get_product_recall --searchKey "企业名称"` |
| 产品抽查 | `get_product_spot_check` | 查询企业的产品抽查结果信息，返回产品名称、规格型号、生产日期/批号、生产单位、经营单位、抽查/公告时间及抽查结果。适用场景：产品质量合规风险核查、供应商准入质量评估、制造企业行业监管背景调查。 | `qcc operation get_product_spot_check --searchKey "企业名称"` |
| 产权交易 | `get_property_rights_transaction` | 查询企业参与的产权交易挂牌信息，返回标的名称、交易价格、标的企业、转让/处置方及起始日期。适用场景：并购尽调中了解目标企业资产处置历史、资产重组分析、国资企业产权转让合规核查。 | `qcc operation get_property_rights_transaction --searchKey "企业名称"` |
| 资质证书 | `get_qualifications` | 用于查询企业获得的各类资质证书信息，包括证书类型、等级、有效期、证书状态等资质情况时使用。适用于企业专业能力评估、行业准入资格确认、资质有效性检查等场景。数据更新频率：T+1。 | `qcc operation get_qualifications --searchKey "企业名称" --status "有效" --year 2024` |
| 双随机抽查 | `get_random_check` | 用于查询企业双随机抽查记录，包括计划编号、计划名称、任务编号、任务名称、抽查类型、抽查机关、完成日期，仅返回已完成的双随机抽查记录。适用于企业监管合规情况评估、市场监管记录核查、行业合规尽调等场景。 | `qcc operation get_random_check --searchKey "企业名称"` |
| 上榜榜单 | `get_ranking_list_info` | 查询企业上榜的各类榜单信息，包括榜单名称、榜内排名、来源、榜单类型、榜内名称、发布日期。适用于资本运作分析场景。数据更新频率：定期更新（随各榜单发布周期）。 | `qcc operation get_ranking_list_info --searchKey "企业名称"` |
| 招聘信息 | `get_recruitment_info` | 查询企业招聘信息，包括发布日期、招聘职位、月薪、学历、经验、办公地点。适用于企业人才需求分析场景。数据更新频率：T+0。 | `qcc operation get_recruitment_info --searchKey "企业名称"` |
| 相关公告 | `get_related_announcement` | 查询企业相关的证券类公告信息，返回公告标题、公告类型、证券类型、证券简称/代码及日期。适用场景：上市企业信息披露跟踪、证券类重大事项监控、投资决策前的公告信息核查。 | `qcc operation get_related_announcement --searchKey "企业名称"` |
| 软件违规 | `get_software_violation` | 查询企业相关软件APP等的违规通报信息，返回应用名称、版本号、所涉问题、数据来源及发布日期。适用场景：互联网企业软件合规评估、数据安全隐私合规核查、供应链中软件服务商资质评估。 | `qcc operation get_software_violation --searchKey "企业名称"` |
| 抽查检查 | `get_spot_check_info` | 查询企业抽查检查记录，包括检查实施机关、类型、日期、结果。适用于经营资质核查场景。数据更新频率：T+1（国家双随机抽查结果公示系统）。 | `qcc operation get_spot_check_info --searchKey "企业名称"` |
| 纳税人资质 | `get_taxpayer_qualification` | 查询企业的增值税纳税人资质信息，返回纳税人识别号、纳税人资格类型、主管税务机关、有效期起、有效期止及状态。适用场景：采购商确认供应商开具增值税专用发票资质、合同签订前税务资质核查、税务合规尽调。 | `qcc operation get_taxpayer_qualification --searchKey "企业名称"` |
| 科技成果 | `get_tech_achievement` | 查询企业的科技成果登记信息，返回成果名称、登记号、完成单位、登记单位、登记日期。适用场景：企业技术创新能力评估、科技型企业资质核查、高新技术企业认定背景分析、科研院校产学研合作评估。 | `qcc operation get_tech_achievement --searchKey "企业名称"` |
| 电信许可 | `get_telecom_license` | 查询企业电信业务经营许可信息，包括许可证号、业务分类、业务种类、覆盖范围、是否有效。适用于企业合规性评估场景。数据更新频率：T+1（工业和信息化部）。 | `qcc operation get_telecom_license --searchKey "企业名称"` |

## 参数说明

### 行政许可 - `get_administrative_license`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 广告审查 - `get_advertising_review`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 资产拍卖 - `get_asset_auction`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 招投标信息 - `get_bidding_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `role`（可选，string）：参与角色过滤，单选。用户说'中标记录''拿到的项目''作为供应商'时传 '中标方'；说'招标记录''发布的采购''作为甲方'时传 '招采方'；说'参与投标''投了哪些标'时传 '投标方'；说'代理''招标代理'时传 '代理方'；说'被提及''关联出现'时传 '被提及'；未提及角色时不传，返回全部。 可选值：招采方、投标方、中标方、代理方、被提及。
- `date_from`（可选，string）：项目发布日期起始过滤，格式 YYYY-MM-DD。用户说'最近一年'时传当前日期减一年；说'2024年以来'时传 '2024-01-01'；说'最近的''近期'时传当前日期减一年；未提及时间时不传。 格式 ^\d{4}-\d{2}-\d{2}$。

### 企业公告 - `get_company_announcement`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 假冒化妆品 - `get_counterfeit_cosmetics`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 信用承诺 - `get_credit_commitments`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 信用评价 - `get_credit_evaluation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 未准入境 - `get_entry_denied`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 租赁融资 - `get_financing_lease_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 融资信息 - `get_financing_records`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 食品安全 - `get_food_safety`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 游戏审批 - `get_game_approval`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 政府公告 - `get_government_announcement`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 政府约谈 - `get_government_interview`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 荣誉信息 - `get_honor_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 进出口信用 - `get_import_export_credit`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 投资机构 - `get_investment_institution`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 国有土地受让 - `get_land_grant_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 土地转让 - `get_land_transfer_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 新闻舆情 - `get_news_sentiment`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `sentiment`（可选，string）：情感倾向过滤，单选。用户说'负面新闻''风险舆情''被曝光''黑料'时传 '消极'；说'正面新闻''好消息''获奖报道'时传 '积极'；未提及倾向时不传，返回全部。 可选值：消极、中立、积极。
- `date_from`（可选，string）：新闻发布日期起始过滤，格式 YYYY-MM-DD。用户说'最近的新闻''近期舆情'时传当前日期减一个月；说'今年的'时传当年 01-01；说'近半年'时传当前日期减半年；未提及时间时不传，返回全部。 格式 ^\d{4}-\d{2}-\d{2}$。

### 私募基金管理人 - `get_private_fund_manager`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 产品召回 - `get_product_recall`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 产品抽查 - `get_product_spot_check`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 产权交易 - `get_property_rights_transaction`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 资质证书 - `get_qualifications`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `status`（可选，string）：证书状态过滤，单选。说'有哪些资质''现在还有的证书''有效资质'时传 '有效'；说'暂停的'时传 '暂停'；说'过期的''到期失效的'时传 '过期失效'；说'被撤销的'时传 '撤销'；说'被吊销的'时传 '吊销'；说'被收回的'时传 '收回'；说'注销的'时传 '注销'；说'取消的'时传 '取消'；说'退出的'时传 '退出'；说'无效的'时传 '无效'；说'不予许可的'时传 '不予许可'；说'未披露的'时传 '未披露'；说'数据作废'时传 '数据作废'；未提及状态时不传，返回全部。 可选值：未披露、有效、无效、暂停、撤销、注销、过期失效、收回、取消、吊销、退出、不予许可、数据作废。
- `year`（可选，integer）：证书发证年份过滤，传四位数年份如 2024。用户说'今年的证书'时传当前年份；说'去年的'时传当前年份减一；未提及时间时不传，返回全部。跨年查询由 AI 侧逐年分别调用后合并结果。 最小值 1900，最大值 2999。

### 双随机抽查 - `get_random_check`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 上榜榜单 - `get_ranking_list_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 招聘信息 - `get_recruitment_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 相关公告 - `get_related_announcement`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 软件违规 - `get_software_violation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 抽查检查 - `get_spot_check_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 纳税人资质 - `get_taxpayer_qualification`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 科技成果 - `get_tech_achievement`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 电信许可 - `get_telecom_license`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
