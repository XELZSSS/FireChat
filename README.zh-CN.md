<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/icons/app.png" />
    <source media="(prefers-color-scheme: light)" srcset="assets/icons/app-dark.png" />
    <img src="assets/icons/app-dark.png" alt="FireChat" width="104" height="104" />
  </picture>

  <h1>FireChat</h1>

  <p><strong>桌面 AI 聊天客户端</strong></p>

  <p>
    <a href="./README.zh-CN.md"><strong>中文</strong></a>
    <span> · </span>
    <a href="./README.md"><strong>English</strong></a>
  </p>

  <p>
    <img alt="Electron" src="https://img.shields.io/badge/Electron-42-47848F?style=flat-square" />
    <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?style=flat-square" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-8-8B5CF6?style=flat-square" />
    <img alt="SQLite" src="https://img.shields.io/badge/SQLite-3-003B57?style=flat-square" />
    <img alt="License" src="https://img.shields.io/badge/License-GPL%203.0-blue?style=flat-square" />
  </p>
</div>

<p align="center">
  <a href="#功能">功能</a>
  <span> · </span>
  <a href="#快速开始">快速开始</a>
  <span> · </span>
  <a href="#供应商支持">供应商支持</a>
  <span> · </span>
  <a href="#配置">配置</a>
  <span> · </span>
  <a href="#项目结构">项目结构</a>
</p>

---

## ✨ 功能

<table>
  <tr>
    <td width="50%">
      <strong>20+ AI 供应商</strong>
      <br />
      内置支持 OpenAI、Anthropic、Google、Groq、Mistral、DeepInfra 等。
    </td>
    <td width="50%">
      <strong>OpenAdapter 工具</strong>
      <br />
      通过 Web 搜索、网页抓取、站点爬取和自定义 MCP 工具扩展对话。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>文档解析</strong>
      <br />
      将 PDF、Word、Excel、PowerPoint 等文档解析为对话上下文。
    </td>
    <td width="50%">
      <strong>自定义供应商</strong>
      <br />
      通过自定义端点、请求头和模型列表添加任意 OpenAI 兼容供应商。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>本地持久化</strong>
      <br />
      会话、设置和请求日志存储在本地 SQLite 数据库中。
    </td>
    <td width="50%">
      <strong>本地代理</strong>
      <br />
      通过可配置的本地 HTTP/2 代理转发供应商请求。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>桌面宠物</strong>
      <br />
      带有呼吸、思考、说话等多种动画表情的桌面宠物。
    </td>
    <td width="50%">
      <strong>请求日志</strong>
      <br />
      查看请求历史，支持状态、耗时、错误分类和筛选。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>主题与强调色</strong>
      <br />
      亮色/暗色/系统主题，24 种强调色，支持减少动画。
    </td>
    <td width="50%">
      <strong>自动更新</strong>
      <br />
      检查 GitHub Release，一键跳转下载更新。
    </td>
  </tr>
</table>

## 🚀 快速开始

### 环境要求

| 项目 | 要求 |
| --- | --- |
| Node.js | 20+ |
| 包管理器 | npm |

### 启动

```bash
npm install
npm run electron:dev
```

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run electron:dev` | 启动完整桌面开发环境 |
| `npm run proxy:dev` | 单独启动本地 API 代理 |
| `npm run build` | 构建渲染层 |
| `npm run electron:build:win` | 构建 Windows NSIS 安装包 |
| `npm run check` | 运行 lint 和 typecheck |
| `npm run lint` | 运行 ESLint |
| `npm run typecheck` | 运行 TypeScript 类型检查 |
| `npm run format` | 使用 Prettier 格式化代码 |

### 构建安装包

```bash
npm run build
npm run electron:build:win
# 安装包输出：release/FireChat Setup {version}.exe
```

## 🤖 供应商支持

内置供应商（均支持通过环境变量配置 API key、模型和 base URL）：

| 类别 | 供应商 |
| --- | --- |
| **通用型** | OpenAI、Anthropic、Google Generative AI、Google Vertex AI、Groq、Mistral、Cohere、Perplexity、xAI |
| **开源/推理** | DeepInfra、Together AI、Fireworks AI、Cerebras、Sambanova、HuggingFace |
| **国内** | 阿里云通义千问、DeepSeek、智谱 GLM、MiniMax、月之暗面 Kimi、阶跃星辰 StepFun、火山引擎、小米 |
| **聚合接口** | OpenRouter、LongCat、Vercel |
| **兼容格式** | OpenAI 兼容、OpenAdapter、OpenCode |

可通过 JSON 配置或设置页添加自定义供应商。

## ⚙️ 配置

| 文件或入口 | 说明 |
| --- | --- |
| `.env` / `.env.local` | 启动默认值，配置 API key、模型、base URL |
| `firechat.local.json` | 非敏感本地配置，保存供应商、地址、默认模型和模型列表 |
| `firechat.auth.json` | 敏感认证配置，保存 API Key 和自定义请求头 |
| 设置页 | 日常配置入口，保存后写入本地配置文件 |

说明：

- 自定义供应商支持 OpenAI 格式和 OpenAI 兼容格式。
- 开发环境优先读取仓库根目录配置。
- 打包版优先读取用户数据目录配置。
- 清理应用数据不会删除 `firechat.local.json` 和 `firechat.auth.json`。

## 🗂️ 项目结构

```text
apps/
  desktop/
    client/          应用壳层、功能界面、应用控制器、桌面服务调用
    main/            Electron 启动、窗口、IPC、代理、更新、文档解析
    renderer/        Vite 渲染入口、Provider 运行时、持久化客户端、共享 UI、样式
  shared/            跨进程共享常量、供应商 ID、运行时环境变量 key
packages/
  contracts/         共享 TypeScript 契约、类型和运行时配置定义
  core/              聊天流式管线、Provider 执行引擎、设置事务引擎
  data/              SQLite 模式、数据库和存储仓储
  desktop-bridge/    桌面 IPC 通道和 preload 桥接
assets/
  icons/             应用图标资源（PNG、ICO、SVG，亮色/暗色）
build/
  installer.nsh      Windows NSIS 安装包脚本
```

## 🔧 架构概要

```
┌─────────────────────────────────────────────────────┐
│                    Electron 主进程                     │
│  main.cjs ── createMainAppRuntime ── IPC 处理器     │
│  ┌──────────────────────────────────────────────┐   │
│  │  代理 │ 更新 │ 托盘 │ 窗口 │ 配置             │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                   Electron 渲染进程                    │
│  ┌──────────────────────────────────────────────┐   │
│  │  React App (client/)                         │   │
│  │  ┌─────┐ ┌──────────┐ ┌────────────────┐    │   │
│  │  │聊天 │ │ 会话     │ │ 设置           │    │   │
│  │  ├─────┤ ├──────────┤ ├────────────────┤    │   │
│  │  │宠物 │ │ 桌面壳   │ │ 请求日志       │    │   │
│  │  └─────┘ └──────────┘ └────────────────┘    │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Provider 运行时 (infrastructure/)           │   │
│  │  SDK 适配器 │ 模型目录 │ Provider 注册中心   │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                   共享 Packages                       │
│  contracts ── core ── data ── desktop-bridge         │
└─────────────────────────────────────────────────────┘
```

## 💾 本地数据

- 会话、应用设置和请求日志存储在本地 SQLite 数据库（用户数据目录下的 `firechat.sqlite`）。
- 自动更新通过 GitHub Release 检查，开发模式下不启用。
- 供应商配置以 JSON 文件持久化（`firechat.local.json`、`firechat.auth.json`）。

## 📄 许可证

GNU General Public License v3.0
