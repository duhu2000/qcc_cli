# ipr - 知识产权

> 知识产权布局分析，拆解品牌技术实力，为市场决策提供专业支持。

当前服务共收录 **18** 个工具，适合用于 商标、专利、软著、作品著作权、应用产品、社媒账号与网络服务备案分析。

## 调用方式

```bash
qcc ipr <tool> --<paramKey> "<paramValue>"
```

通用参数：
- `--json`：输出原始 JSON。
- `qcc list-tools ipr`：查看该服务最新工具定义。
- 可选过滤参数可按工具 schema 追加；CLI 会按工具 schema 自动转换数字、布尔值和数组。
- 数组类型参数可传单个值，例如 `--status "已注册"`；多个值请重复传入同一选项，例如 `--status "已注册" --status "商标无效"`。

## 工具清单

| 中文名 | 工具名称 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| APP | `get_app_info` | 查询企业相关APP的基本信息，返回APP名称、下载量级、iOS最新版本、安卓最新版本。适用场景：互联网企业产品矩阵分析、移动端业务规模评估、竞品分析及市场研究。 | `qcc ipr get_app_info --searchKey "企业名称"` |
| 商业特许经营 | `get_commercial_franchise` | 查询企业的商业特许经营备案信息，返回备案公告日期、特许人名称及备案号。适用场景：加盟连锁品牌资质核查、特许经营合规背景调查、连锁项目投资前的合规验证。 | `qcc ipr get_commercial_franchise --searchKey "企业名称"` |
| 作品著作权 | `get_copyright_work_info` | 查询企业作品著作权信息。适用于文创资产价值评估、版权保护现状分析及内容产业背调场景。数据更新频率：T+0（国家版权局）。 | `qcc ipr get_copyright_work_info --searchKey "企业名称" --year 2024` |
| 抖音 | `get_douyin_account` | 查询企业相关的抖音账号信息，返回头像、抖音昵称、账号号及简介。适用场景：企业抖音短视频平台运营能力评估、品牌数字化矩阵分析、竞品账号信息核查。 | `qcc ipr get_douyin_account --searchKey "企业名称"` |
| 集成电路布图 | `get_integrated_circuit_layout` | 查询企业的集成电路布图设计登记信息，返回布图设计名称、登记号、申请日期、公告日期、公告号及布图设计创作人。适用场景：半导体/芯片企业知识产权能力评估、投资前技术资产核查、集成电路行业竞争格局分析。 | `qcc ipr get_integrated_circuit_layout --searchKey "企业名称"` |
| 国际专利 | `get_international_patent` | 查询企业的国际专利信息，返回发明名称、法律状态、申请号、申请日期、公开（公告）号、公开（公告）日期及发明人。适用场景：企业全球知识产权布局分析、竞争对手技术护城河评估、跨境并购尽调中的技术资产核查、海外业务知识产权风险识别。 | `qcc ipr get_international_patent --searchKey "企业名称"` |
| 网络服务备案 | `get_internet_service_info` | 查询企业的网站ICP备案、APP备案、小程序备案、算法备案信息，包括名称、备案号、许可证号、审核日期。适用于软件资产分析、网络服务分析场景。数据更新频率：T+1（工信部ICP/IP地址/域名信息备案管理系统）。 | `qcc ipr get_internet_service_info --searchKey "企业名称"` |
| 知产出质 | `get_ipr_pledge` | 用于查询企业知识产权出质记录，包括出质知产类型、名称、商标/专利类型、出质公告日、出质期限，仅返回已注销或已解除的知产出质记录，不含当前仍有效的出质登记。适用于企业知产融资分析、无形资产负担核查、科创企业尽职调查等场景。 | `qcc ipr get_ipr_pledge --searchKey "企业名称"` |
| 快手 | `get_kuaishou_account` | 查询企业相关的快手账号信息，快手昵称、账号及简介。适用场景：企业快手短视频平台运营能力评估、品牌数字化矩阵分析、竞品账号信息核查。 | `qcc ipr get_kuaishou_account --searchKey "企业名称"` |
| 小程序 | `get_mini_program` | 查询企业相关的微信小程序信息，返回小程序名称及小程序类型。适用场景：企业数字化业务布局分析、微信生态运营能力评估、竞品小程序矩阵了解。 | `qcc ipr get_mini_program --searchKey "企业名称"` |
| 线上店铺 | `get_online_store` | 查询企业相关的线上电商店铺信息，返回店铺名称及平台渠道。适用场景：电商渠道分析、品牌在主流电商平台的开店情况核查、零售企业数字化运营评估。 | `qcc ipr get_online_store --searchKey "企业名称"` |
| 专利 | `get_patent_info` | 查询企业专利信息。适用于企业技术创新能力评估、核心技术储备分析及行业技术壁垒研究场景。数据更新频率：每周更新（国家知识产权局公开数据）。 | `qcc ipr get_patent_info --searchKey "企业名称" --patent_type "发明授权" --status "有效"` |
| 软件著作权 | `get_software_copyright_info` | 查询企业的软件著作权信息，包括软件名称、软件简称、登记号、版本号、登记日期、权利取得方式。适用于知识产权保护场景。数据更新频率：T+1（国家版权局软件著作权登记系统）。 | `qcc ipr get_software_copyright_info --searchKey "企业名称" --year 2024` |
| 标准信息 | `get_standard_info` | 查询企业参与制定的各类标准。适用于评估企业行业影响力、技术领先地位及标准化合规核查场景。数据更新频率：定期更新（国家标准全文公开系统）。 | `qcc ipr get_standard_info --searchKey "企业名称"` |
| 商标文书 | `get_trademark_document` | 查询企业相关的商标评审文书信息，返回商标文书号、申请人、申请人委托代理人、被申请人、被申请人委托代理人、文书类型及公布日期。适用场景：商标权属争议评估、品牌法律风险核查、知识产权诉讼背景调查、企业商标维权历史分析。 | `qcc ipr get_trademark_document --searchKey "企业名称"` |
| 商标 | `get_trademark_info` | 查询企业商标注册信息。适用于企业品牌资产评估、知识产权布局分析及商标侵权风险核查场景。数据更新频率：每周更新（国家知识产权局商标局）。 | `qcc ipr get_trademark_info --searchKey "企业名称" --status "已注册"` |
| 微信公众号 | `get_wechat_official_account` | 查询企业相关的微信公众号信息，返回公众号名称、微信号、账号类型及简介。适用场景：企业新媒体运营能力评估、品牌数字化矩阵分析、公众号认证主体核实。 | `qcc ipr get_wechat_official_account --searchKey "企业名称"` |
| 微博 | `get_weibo_account` | 查询企业相关的微博账号信息，返回微博昵称及简介。适用场景：企业社交媒体存在感分析、品牌微博运营情况评估、公关危机前企业社交媒体矩阵摸底。 | `qcc ipr get_weibo_account --searchKey "企业名称"` |

## 参数说明

### APP - `get_app_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 商业特许经营 - `get_commercial_franchise`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 作品著作权 - `get_copyright_work_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `year`（可选，integer）：作品著作登记年份过滤，传四位数年份如 2024。用户说'最近的作品著作'时传当前年份；说'今年的'时传当前年份；说'去年的'时传当前年份减一；未提及时间时不传，返回全部。跨年查询由 AI 侧逐年分别调用后合并结果。 最小值 1900，最大值 2999。

### 抖音 - `get_douyin_account`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 集成电路布图 - `get_integrated_circuit_layout`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 国际专利 - `get_international_patent`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 网络服务备案 - `get_internet_service_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 知产出质 - `get_ipr_pledge`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 快手 - `get_kuaishou_account`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 小程序 - `get_mini_program`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 线上店铺 - `get_online_store`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 专利 - `get_patent_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `patent_type`（可选，string）：专利类型过滤，单选。用户说'含金量高的专利''核心技术专利'时传 '发明公布'；说'授权专利'时传 '发明授权'；说'外观设计''产品外形'时传 '外观设计'；未提及类型时不传，返回全部。 可选值：发明公布、实用新型、外观设计、发明授权。
- `status`（可选，string）：专利法律状态过滤，单选。用户说'还在保护期的''现在还有效的'时传 '有效'；说'失效的''过期的''已放弃的'时传 '无效'；未提及时不传，返回全部。 可选值：有效、审中、无效。

### 软件著作权 - `get_software_copyright_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `year`（可选，integer）：软件著作登记年份过滤，传四位数年份如 2024。用户说'最近的软著''近期软著'时传当前年份；说'今年的'时传当前年份；说'去年的'时传当前年份减一；未提及时间时不传，返回全部。跨年查询由 AI 侧逐年分别调用后合并结果。 最小值 1900，最大值 2999。

### 标准信息 - `get_standard_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 商标文书 - `get_trademark_document`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 商标 - `get_trademark_info`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
- `status`（可选，array<string>）：商标状态过滤，支持多选。用户说'有效商标''已注册的''还在用的'时传 ['已注册']；说'申请中''正在注册的'时传 ['注册申请中']；说'无效的''被驳回的''撤回申请'时传 ['商标无效']；说'初审公告'时传 ['初审公告中']；未提及状态时不传，返回全部。 可选值：注册申请中、初审公告中、已注册、商标无效。

### 微信公众号 - `get_wechat_official_account`

- `searchKey`（必填，string）：企业名称或统一社会信用代码

### 微博 - `get_weibo_account`

- `searchKey`（必填，string）：企业名称或统一社会信用代码
