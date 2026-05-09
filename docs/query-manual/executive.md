# executive - 董监高

> 企业董监高任职、历史变更、关联任职与治理结构洞察服务。

当前服务共收录 **42** 个工具，适合用于 董监高任职穿透、个人风险核查、关联企业识别。

## 调用方式

```bash
qcc executive <tool> --<paramKey> "<paramValue>"
```

通用参数：
- `--json`：输出原始 JSON。
- `qcc list-tools executive`：查看该服务最新工具定义。
- 多参数工具需按参数说明逐项传入。

## 工具清单

| 中文名 | 工具名称 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| 董监高-行政处罚 | `get_executive_admin_penalty` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史行政处罚记录已解除/过期，包括决定文书号、处罚结果、处罚金额、处罚单位、处罚日期，适用于法代/高管候选人入职背调中核查个人监管处罚记录、授信申请中评估关键人员的个人合规风险、识别曾受到监管处罚的高风险个人等场景。数据更新频率：T+0。 | `qcc executive get_executive_admin_penalty --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-作为最终受益人 | `get_executive_beneficial_owner` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员作为最终受益人的企业列表，基于央行3号令受益所有人识别标准，返回受益股份比例、受益类型、任职类型。适用于反洗钱/KYC核查：识别企业背后的最终自然人受益所有人、合规尽调：符合央行监管要求的UBO识别、实际控制人穿透：识别通过复杂股权结构隐性控制企业的自然人、关联方风险评估：识别目标人员通过UBO地位实际影响的企业范围等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_beneficial_owner --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-立案信息 | `get_executive_case_filing` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员涉及的法院立案信息，包括案号、立案日期、当事人、法院名称等。适用于个人诉讼情况初步了解，关键人物法律纠纷数量统计、合作前快速了解对方关键人物涉诉活跃程度、配合裁判文书联合分析人员完整诉讼画像等场景。数据更新频率：T+0。 | `qcc executive get_executive_case_filing --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-控制企业 | `get_executive_controlled_companies` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前实际控制的企业列表，包括控制企业名称、登记状态、成立日期、所属地区、所属行业及投资比例。适用于实际控制人核查：识别目标人员通过资本控制的企业范围、资本版图分析：了解目标人员直接控制的企业生态、关联方风险评估：控制企业出现风险时可关联到目标人员、并购尽调：核查目标人员控制的潜在关联企业等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_controlled_companies --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-法院公告 | `get_executive_court_notice` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员涉及的法院公告信息，包括公告类型、案号、案由、执行法院、公布日期、原被告信息等。适用于关键人物法律事务公告查询、司法程序进展跟踪、补全裁判文书链路的公告节点等场景。数据更新频率：T+0。 | `qcc executive get_executive_court_notice --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-失信被执行人 | `get_executive_dishonest` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前是否存在失信被执行人记录，包括案号、执行法院、涉案金额等。适用于个人信用背调：核查关键人物是否存在失信记录、授信申请中对企业主要负责人、法定代表人的失信核查、KYC风险评估：金融机构对高净值客户或企业主的尽调、合同签署前的关键合作方个人信用核验等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc executive get_executive_dishonest --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-股权冻结 | `get_executive_equity_freeze` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员名下股权当前是否被司法冻结，包括股权数额、执行法院、通知文书号、冻结状态及期限等。适用于关键人物资产受限状态核查、股东资产冻结风险评估、并购中目标企业股东股权受限情况核查等场景。数据更新频率：T+1。 | `qcc executive get_executive_equity_freeze --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-股权出质 | `get_executive_equity_pledge` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员名下股权出质情况，包括质权登记编号、出质人、质权人、出质股权数额、登记日期及状态等。适用于个人股权资产风险评估，了解是否存在质押融资、关键人物融资状况分析、股权交易前核查是否存在质押限制等场景。数据更新频率：T+1。 | `qcc executive get_executive_equity_pledge --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-限制出境 | `get_executive_exit_restriction` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员是否被法院限制出境，包括案号、限制出境对象、被执行人信息、执行标的金额等。适用于高价值合同签署前的关键人物出行限制核查、重大执行风险预警，识别是否存在出境限制、商务洽谈前确认对方关键人物行动自由度等场景。数据更新频率：T+0。 | `qcc executive get_executive_exit_restriction --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-开庭公告 | `get_executive_hearing_notice` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员涉及的开庭公告信息，包括案号、案由、开庭日期、当事人信息等。适用于个人诉讼动态跟踪，了解庭审时间安排、了解关键人物近期是否有重要庭审、配合立案信息评估人员整体涉诉频率等场景。数据更新频率：T+0。 | `qcc executive get_executive_hearing_notice --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-限制高消费 | `get_executive_high_consumption_ban` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前是否被法院限制高消费，包括案号、限制令对象、关联对象、立案日期、申请人等。适用于合作方关键人物风险排查，确认是否存在出行/消费限制、合同签约前的个人信用核验、高价值业务洽谈前的尽调等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc executive get_executive_high_consumption_ban --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史行政处罚 | `get_executive_historical_admin_penalty` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史行政处罚记录已解除/过期，包括处罚当事人、违法事实、处罚单位、处罚日期，适用于法代/高管候选人入职背调中核查个人监管处罚记录、授信申请中评估关键人员的个人合规风险、识别曾受到监管处罚的高风险个人等场景。数据更新频率：T+0。 | `qcc executive get_executive_historical_admin_penalty --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史立案信息 | `get_executive_historical_case_filing` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史立案信息，仅返回已结案或已撤案的立案记录，适用于追溯该人员历史涉诉参与全貌。数据更新频率：T+0。 | `qcc executive get_executive_historical_case_filing --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史法院公告 | `get_executive_historical_court_notice` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史法院公告记录，返回与该人员相关的已过期历史法院公告，适用于追溯该人员历史司法被通知情况。数据更新频率：T+0。 | `qcc executive get_executive_historical_court_notice --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史失信被执行人 | `get_executive_historical_dishonest` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史上曾被列入失信被执行人名单已移出的记录，包括案号、执行法院、涉案金额等，用于个人深度背调。适用于识别关键人物历史信用危机、个人深度背调：评估历史信用修复真实性、高管层个人历史风险画像构建等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc executive get_executive_historical_dishonest --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史股权冻结 | `get_executive_historical_equity_freeze` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史股权冻结记录，仅返回已解冻或已到期的冻结记录，适用于评估该人员历史资产风险与债务处置轨迹。数据更新频率：T+1。 | `qcc executive get_executive_historical_equity_freeze --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史股权出质 | `get_executive_historical_equity_pledge` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史股权出质记录，仅返回已注销或已到期的出质记录，适用于评估该人员历史融资担保行为与资产处置轨迹。数据更新频率：T+1。 | `qcc executive get_executive_historical_equity_pledge --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史开庭公告 | `get_executive_historical_hearing_notice` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史开庭公告记录，仅返回已开庭完毕的历史公告，适用于追溯该人员历史庭审参与情况。数据更新频率：T+0。 | `qcc executive get_executive_historical_hearing_notice --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史限制高消费 | `get_executive_historical_high_consumption_ban` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史上曾被限制高消费已解除的记录，包括案号、限制令对象、关联对象、立案日期等，用于关键人物历史信用修复识别。适用于关键人物历史信用修复识别、个人深度背调中的历史行动限制核查、配合历史失信、历史被执行构建完整历史执行风险画像等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc executive get_executive_historical_high_consumption_ban --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史对外投资 | `get_executive_historical_investments` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史上曾持有但已退出的对外投资记录，包括被投资企业名称、注册资本、持股起止时间等。适用于关键人物历史投资布局分析、关联企业穿透核查，识别已解除的隐性关联方、评估关键人物是否存在利益输送历史等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_historical_investments --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史被执行人 | `get_executive_historical_judgment_debtor` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史上曾作为被执行人的案件记录，包括案号、执行标的、执行法院、立案日期。适用于个人历史偿债能力评估、关键人物深度背调，了解历史执行记录频率和规模、配合历史失信记录构建完整个人历史信用画像等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc executive get_executive_historical_judgment_debtor --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史裁判文书 | `get_executive_historical_judicial_docs` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史裁判文书记录，包括文书标题、案号、当事人、案件金额、裁判日期、发布日期，适用于追溯个人历史涉诉判决记录，评估历史司法纠纷严重程度、配合历史立案、历史开庭公告构建完整历史司法链路等场景。数据更新频率：T+1至T+7（裁判文书公开存在一定延迟）。 | `qcc executive get_executive_historical_judicial_docs --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史担任法定代表人 | `get_executive_historical_legal_rep_roles` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史上曾担任法定代表人的企业列表，包括企业名称、注册资本、地区、企业状态、担任起止时间等。适用于关键人物历史履职经历核查，了解担任法人的企业数量与分布、多企业关联分析：识别同一自然人曾控制的多家企业、评估关键人物是否存在大量注销/吊销企业历史等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_historical_legal_rep_roles --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史合作伙伴 | `get_executive_historical_partners` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史合作伙伴记录，返回该人员历史上曾有业务往来但已终止的合作企业，适用于追溯该人员历史商业关系网络。 | `qcc executive get_executive_historical_partners --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史在外任职 | `get_executive_historical_positions` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史上曾在其他企业任职已离职的记录，包括曾任职企业名称、职位、任职起止时间、行业等。适用于关键人物完整职业履历核查，还原完整职业轨迹、跨企业关联关系分析、招聘背调中核查候选人历史任职真实性等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_historical_positions --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史诉前调解 | `get_executive_historical_pre_litigation_mediation` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史诉前调解记录已结案，包括案号、案由、当事人、法院、立案日期，适用于核查个人商业纠纷调解记录，评估个人信用与纠纷处理历史、配合其他司法工具评估个人纠纷解决偏好等场景。数据更新频率：T+0。 | `qcc executive get_executive_historical_pre_litigation_mediation --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史全部关联企业 | `get_executive_historical_related_companies` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史全部关联企业，汇聚该人员历史上曾担任法代、股东、高管或进行投资的所有企业已退出/卸任，适用于全面梳理个人历史商业版图，了解其过往控制/参与企业、识别通过历史关联企业传导的潜在风险、高管背调中核查其历史任职与投资轨迹等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_historical_related_companies --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史送达公告 | `get_executive_historical_service_notice` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史司法送达公告记录，返回已结案的历史法律文书送达公告，适用于追溯该人员历史司法被通知情况。数据更新频率：T+0。 | `qcc executive get_executive_historical_service_notice --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-历史终本案件 | `get_executive_historical_terminated_cases` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员历史终本案件记录，仅返回已移出终本名单的历史记录，适用于追溯个人历史偿债能力，识别曾出现终本但已处置的主体、配合历史失信、历史被执行构建完整历史个人风险画像等场景。数据更新频率：T+1（最高人民法院中国执行信息公开网）。 | `qcc executive get_executive_historical_terminated_cases --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-对外投资 | `get_executive_investments` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前对外投资情况，同时返回直接投资和间接投资两个维度的完整数据。直接投资含持股比例与持股起止时间；间接投资含间接持股比例。适用于资本版图穿透：全面了解目标人员直接+间接控制的企业网络、关联方识别：发现通过持股层级隐性关联的企业、利益冲突排查：核查目标人员是否与竞争企业存在股权关联、实际控制人分析：结合直接/间接持股评估实际控制力等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_investments --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-被执行人 | `get_executive_judgment_debtor` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前是否作为被执行人，包括案号、执行标的、执行法院、立案时间等。适用于个人债务执行情况了解，评估关键人物偿债能力、授信合作前的关键人物风险排查、合同违约风险预判：核查对方关键人物是否存在被执行等场景。数据更新频率：T+0（最高人民法院中国执行信息公开网）。 | `qcc executive get_executive_judgment_debtor --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-裁判文书 | `get_executive_judicial_docs` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员涉及的司法裁判文书，包括文书标题、案号、案件金额等。适用于个人历史司法纠纷梳理，了解关键人物法律纠纷全貌、深度尽调中的关键人物法律风险评估、评估个人历史诉讼败诉情况和主要案由类型等场景。数据更新频率：T+1至T+7（裁判文书公开存在一定延迟）。 | `qcc executive get_executive_judicial_docs --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-担任法定代表人 | `get_executive_legal_rep_roles` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前正在担任法定代表人的企业列表，包括企业名称、登记状态、持股比例、担任法定代表人起止时间、注册资本、地区及行业。适用于法人责任核查：确认目标人员当前在哪些企业承担法定代表人法律责任、多头任职识别：识别同时担任多家企业法定代表人的人员，评估管理风险、合同主体验证：核查签约对方法定代表人是否为目标人员、尽职调查：全面了解目标人员的法人角色分布等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_legal_rep_roles --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-在外任职 | `get_executive_positions` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前在外担任职务的企业列表，包括职位名称、任职起止时间、企业登记状态、注册资本、地区及行业。适用于兼职任职核查：识别目标人员在多家企业同时担任高管职务的情况、竞业违规排查：核查目标人员是否在竞争企业担任职务、关联方完整性：补充关联方分析中的任职维度、背景调查：了解目标人员在外部企业的任职履历等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_positions --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-诉前调解 | `get_executive_pre_litigation_mediation` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前涉及的诉前调解记录，包括案号、案由、当事人、法院、立案日期，适用于核查个人商业纠纷调解记录，评估个人信用与纠纷处理历史、配合其他司法工具评估个人纠纷解决偏好等场景。数据更新频率：T+0。 | `qcc executive get_executive_pre_litigation_mediation --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-财产悬赏公告 | `get_executive_property_reward_notice` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员相关财产悬赏公告记录，包括发布法院、案号、更新日期，适用于核查个人是否存在法院财产悬赏公告，识别严重失信被执行人、配合失信、被执行、终本案件工具识别极高风险个人、尽调中识别法院已采用悬赏手段寻查财产的关键人员等场景。 | `qcc executive get_executive_property_reward_notice --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-全部关联企业 | `get_executive_related_companies` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员当前全部关联企业，涵盖其以股东、法定代表人、高管等任意角色关联的所有企业，包括企业名称、登记状态、关联角色、持股比例、注册资本、成立日期、地区及行业。适用于关联企业全景图：一次调用获取目标人员在所有企业中的角色与持股全貌、人员背景尽调：评估目标人员的企业关联广度与资本布局、关联方识别：发现目标人员与特定企业的隐性关联关系、风控穿透：识别通过不同角色控制多家企业的高风险人员等场景。数据更新频率：T+0（国家企业信用信息公示系统）。 | `qcc executive get_executive_related_companies --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-送达公告 | `get_executive_service_notice` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员涉及的法律文书送达公告，包括案号、当事人、法院、发布日期等。适用于法律文书送达情况了解、关键人物诉讼程序跟踪、配合其他司法公告综合评估人员法律事务全貌等场景。数据更新频率：T+0。 | `qcc executive get_executive_service_notice --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-股权质押 | `get_executive_stock_pledge` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员上市公司股东股票质押情况，包括质押人、参股企业、质押股份总数、质押市值、状态等。适用于上市公司股东资金压力评估、关键人物股权融资风险分析、评估大股东是否存在爆仓风险等场景。数据更新频率：T+0（交易所公告披露）。 | `qcc executive get_executive_stock_pledge --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-税收违法 | `get_executive_tax_violation` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员税收违法记录，包括案件性质、处罚金额、所属税务机关、发布日期，适用于高管候选人背调中核查个人税务合规情况、授信/尽调中评估关键人员的个人税务风险、识别存在税收违法记录的高风险个人等场景。数据更新频率：T+0（国家税务总局重大税收违法失信主体公告）。 | `qcc executive get_executive_tax_violation --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-终本案件 | `get_executive_terminated_cases` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员涉及的终结本次执行程序案件，包括案号、执行法院、终本日期、执行标的及未履行金额等。适用于评估个人偿债能力，识别无力偿债风险信号、关键人物历史债务清偿状况分析、配合失信、被执行记录综合评估人员信用画像等场景。数据更新频率：T+1（最高人民法院中国执行信息公开网）。 | `qcc executive get_executive_terminated_cases --searchKey "企业名称" --personName "董监高姓名"` |
| 董监高-询价评估 | `get_executive_valuation_inquiry` | 以企业名称+人员姓名双参数实体强锚定，查询目标人员涉及的资产询价评估记录，包括案号、标的物、标的物所有人、询价结果、法院、发布日期等。适用于关键人物资产处置情况了解、债权人受偿可能性评估、司法拍卖前的资产状况预判等场景。数据更新频率：T+0。 | `qcc executive get_executive_valuation_inquiry --searchKey "企业名称" --personName "董监高姓名"` |

## 参数说明

### 董监高-行政处罚 - `get_executive_admin_penalty`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-作为最终受益人 - `get_executive_beneficial_owner`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-立案信息 - `get_executive_case_filing`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-控制企业 - `get_executive_controlled_companies`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-法院公告 - `get_executive_court_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-失信被执行人 - `get_executive_dishonest`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-股权冻结 - `get_executive_equity_freeze`

- `searchKey`（必填，string）：企业名称或统一社会信用代码（用于确定人员所属企业，与personName共同锁定唯一自然人）
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-股权出质 - `get_executive_equity_pledge`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-限制出境 - `get_executive_exit_restriction`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-开庭公告 - `get_executive_hearing_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-限制高消费 - `get_executive_high_consumption_ban`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史行政处罚 - `get_executive_historical_admin_penalty`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史立案信息 - `get_executive_historical_case_filing`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史法院公告 - `get_executive_historical_court_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史失信被执行人 - `get_executive_historical_dishonest`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史股权冻结 - `get_executive_historical_equity_freeze`

- `searchKey`（必填，string）：企业名称或统一社会信用代码（用于确定人员所属企业，与personName共同锁定唯一自然人）
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史股权出质 - `get_executive_historical_equity_pledge`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史开庭公告 - `get_executive_historical_hearing_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史限制高消费 - `get_executive_historical_high_consumption_ban`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史对外投资 - `get_executive_historical_investments`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史被执行人 - `get_executive_historical_judgment_debtor`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史裁判文书 - `get_executive_historical_judicial_docs`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史担任法定代表人 - `get_executive_historical_legal_rep_roles`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史合作伙伴 - `get_executive_historical_partners`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史在外任职 - `get_executive_historical_positions`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史诉前调解 - `get_executive_historical_pre_litigation_mediation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史全部关联企业 - `get_executive_historical_related_companies`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史送达公告 - `get_executive_historical_service_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-历史终本案件 - `get_executive_historical_terminated_cases`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-对外投资 - `get_executive_investments`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-被执行人 - `get_executive_judgment_debtor`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-裁判文书 - `get_executive_judicial_docs`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-担任法定代表人 - `get_executive_legal_rep_roles`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-在外任职 - `get_executive_positions`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-诉前调解 - `get_executive_pre_litigation_mediation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-财产悬赏公告 - `get_executive_property_reward_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-全部关联企业 - `get_executive_related_companies`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-送达公告 - `get_executive_service_notice`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-股权质押 - `get_executive_stock_pledge`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-税收违法 - `get_executive_tax_violation`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-终本案件 - `get_executive_terminated_cases`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）

### 董监高-询价评估 - `get_executive_valuation_inquiry`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `personName`（必填，string）：董监高姓名（须与searchKey配合使用以精准定位自然人，避免同名误查）
