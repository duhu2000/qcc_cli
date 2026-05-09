# qcc-agent-cli

> 企查查智能体数据平台命令行工具 —— 为人类和 AI Agent 而生的企业数据查询利器

[![npm version](https://img.shields.io/npm/v/qcc-agent-cli.svg)](https://www.npmjs.com/package/qcc-agent-cli)
[![npm download](https://img.shields.io/npm/dm/qcc-agent-cli.svg)](https://www.npmjs.com/package/qcc-agent-cli)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

-----

## 📖 项目简介

`qcc-agent-cli` 是企查查官方推出的命令行工具，旨在帮助开发者和 AI Agent 快速访问企业工商信息、知识产权、经营风险等全维度商业数据。

**核心能力**：
- 🎯 **6 大服务域**：企业信息、风险信息、经营信息、知识产权、历史信息、董监高
- 🔧 **179 个查询工具**：覆盖工商、董监高、历史沿革、专利商标、经营动态、司法风险等场景
- 🤖 **AI Agent 友好**：Markdown 格式化输出、Schema 自省、参数自动验证
- 🔒 **安全可控**：配置隔离、敏感信息脱敏

-----

## 🌟 为什么选择 qcc-agent-cli？

### 🤖 为 AI Agent 原生设计

- **Markdown 格式化输出**：默认输出易读的 Markdown 格式，支持 `--json` 输出原始 JSON
- **参数自描述**：每个工具的 inputSchema 完整描述参数类型和用途
- **Schema 自省**：支持 `qcc list-tools` 动态获取工具定义，Agent 可自主发现能力
- **确定性输出**：无歧义的错误码和状态码，便于 Agent 决策

### 👤 为人类开发者设计

- **简洁命令**：`qcc company get_company_registration_info "企业名称"`
- **友好输出**：默认 Markdown 格式化展示，支持 `--json` 输出原始数据
- **智能提示**：内置 `--help` 和参数验证，快速上手
- **配置检查**：`qcc check` 一键诊断配置状态

### 🏢 为企业级应用设计

- **配置驱动**：统一配置文件 `~/.qcc/config.json`，支持多环境切换
- **工具缓存**：本地缓存工具定义，减少网络请求，提升响应速度
- **错误处理**：统一的错误类型和友好的错误提示

### 🚀 零门槛上手

- **3 分钟安装**：`npm install -g qcc-agent-cli`
- **一行命令查询**：无需编写代码，命令行直达数据
- **MIT 开源协议**：可自由定制和扩展

### 🛡️ 安全可控

- **凭证隔离**：配置文件权限自动设置为 600，仅所有者可读写
- **敏感信息脱敏**：日志和输出中自动隐藏密钥和 Token

-----

## ⚡ 功能特性

### 核心服务矩阵

| 服务标识 | 服务名称 | 工具数 | 典型场景 | 文档 |
| :---: | :---: | :---: | :--- | :--- |
| `company` | 企业信息 | 15 | 企业画像、工商核验、股权结构与财务概览 | [查看文档](./docs/query-manual/company.md) |
| `risk` | 风险信息 | 35 | 司法风险、信用风险、税务风险、担保与资产受限排查 | [查看文档](./docs/query-manual/risk.md) |
| `operation` | 经营信息 | 35 | 经营动态、资质许可、融资、舆情、监管与市场活动分析 | [查看文档](./docs/query-manual/operation.md) |
| `ipr` | 知识产权 | 18 | 商标、专利、软著、应用产品、社媒账号与网络服务备案分析 | [查看文档](./docs/query-manual/ipr.md) |
| `history` | 历史信息 | 34 | 历史沿革追溯、历史风险回溯、历史股权与司法记录核查 | [查看文档](./docs/query-manual/history.md) |
| `executive` | 董监高 | 42 | 董监高任职穿透、个人风险核查、关联企业识别 | [查看文档](./docs/query-manual/executive.md) |

-----

## 🚀 快速开始

### 1\. 环境准备

| 依赖 | 要求 |
| :--- | :--- |
| **Node.js** | >= 18.0 |
| **npm** | >= 9.0 |

### 2\. 安装工具

使用 npm 全局安装：

```bash
npm install -g qcc-agent-cli
```

如已安装，可通过以下命令更新到最新版本：

```bash
npm update -g qcc-agent-cli
```

安装完成后，验证版本：

```bash
qcc --version
```

### 3\. 初始化配置

在使用之前，需要配置您的 MCP 服务地址和鉴权信息：

```bash
qcc init --authorization "Bearer YOUR_API_KEY"
```

### 4\. 开启查询

查询企业工商注册信息：

```bash
qcc company get_company_registration_info "企查查科技股份有限公司"
```

-----

## 📖 命令手册

### 基础管理命令

| 命令 | 描述 | 示例                                                     |
| :--- | :--- |:-------------------------------------------------------|
| `init` | 初始化全局配置 | `qcc init --authorization "Bearer YOUR_API_KEY"`       |
| `check` | 检查当前配置有效性及环境状态 | `qcc check`                                            |
| `update` | 强制同步远程工具定义到本地缓存 | `qcc update`                                           |
| `list-tools` | 列出当前支持的所有查询工具 | `qcc list-tools <server>`                              |

### 数据查询调用

```bash
qcc <server> <tool> --<paramKey> "<paramValue>" [--<filterKey> "<filterValue>"]
```

-----

## 📚 查询指令手册

### 调用格式

```bash
qcc <server> <tool> --<paramKey> "<paramValue>" [--<filterKey> "<filterValue>"]
```

**参数说明：**
- `server`：服务标识（`company` / `risk` / `operation` / `ipr` / `history` / `executive`）
- `tool`：工具名称，可通过 `qcc list-tools <server>` 获取
- `--paramKey`：参数键，如 `--searchKey`、`--personName`、`--year`、`--role`
- `paramValue`：参数值，如企业名称、统一社会信用代码、人员姓名、年份、日期或状态过滤值

**通用参数：**
- `--json`：输出原始 JSON 格式（默认输出 Markdown 格式化结果）
- 可选过滤参数按工具 schema 追加；CLI 会按工具 schema 自动转换数字、布尔值和数组。
- 数组类型参数可传单个值，例如 `--role "原告"`；多个值请重复传入同一选项，例如 `--role "原告" --role "被告"`。

### 服务文档

| 服务标识 | 服务名称 | 工具数 | 典型场景 | 文档 |
| :---: | :---: | :---: | :--- | :--- |
| `company` | 企业信息 | 15 | 企业画像、工商核验、股权结构与财务概览 | [查看文档](./docs/query-manual/company.md) |
| `risk` | 风险信息 | 35 | 司法风险、信用风险、税务风险、担保与资产受限排查 | [查看文档](./docs/query-manual/risk.md) |
| `operation` | 经营信息 | 35 | 经营动态、资质许可、融资、舆情、监管与市场活动分析 | [查看文档](./docs/query-manual/operation.md) |
| `ipr` | 知识产权 | 18 | 商标、专利、软著、应用产品、社媒账号与网络服务备案分析 | [查看文档](./docs/query-manual/ipr.md) |
| `history` | 历史信息 | 34 | 历史沿革追溯、历史风险回溯、历史股权与司法记录核查 | [查看文档](./docs/query-manual/history.md) |
| `executive` | 董监高 | 42 | 董监高任职穿透、个人风险核查、关联企业识别 | [查看文档](./docs/query-manual/executive.md) |

各服务的工具说明已拆分到独立文档，便于按需查阅和后续维护。

-----

## ⚙️ 配置说明

配置文件默认存储在 `~/.qcc/config.json`。

### 字段解析

* `mcp.baseUrl`: MCP API 服务的基础路径。
* `mcp.authorization`: 访问凭证，输出时会自动脱敏。
* `mcp.timeout`: 请求超时时间（毫秒）。
* `mcp.enabled`: 是否启用 MCP 模式（默认 `true`）。

### 配置命令

```bash
# 设置配置
qcc config set mcp.baseUrl https://agent.qcc.com/mcp
qcc config set mcp.authorization "Bearer YOUR_API_KEY"

# 获取配置
qcc config get mcp.baseUrl

# 列出所有配置
qcc config list
```

### 安全性提示

* **敏感信息遮蔽**：在执行 `config list` 或 `check` 时，`authorization` 将显示为 `[已配置]`。
* **权限保护**：配置文件目录由系统权限自动保护（权限 600），建议不要手动将其暴露在公共仓库中。

-----

## 🏗️ 目录结构

```text
qcc-cli/
├── bin/
│   └── index.js              # CLI 入口
├── src/
│   ├── cliSetup.js           # CLI 命令注册
│   ├── commands/             # 指令实现 (init, check, update, config...)
│   ├── services/             # 核心逻辑 (MCP 协议解析、配置持久化)
│   ├── utils/                # 工具类 (HTTP 客户端、验证器、格式化器)
│   └── config/               # 静态服务与工具定义
└── package.json
```

-----

## 📄 开源协议

本项目遵循 [MIT License](https://opensource.org/licenses/MIT) 开源协议。

-----

<div align="center">
<sub>Built with by QCC Team.</sub>
</div>
