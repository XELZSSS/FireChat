<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/icons/app.png" />
    <source media="(prefers-color-scheme: light)" srcset="assets/icons/app-dark.png" />
    <img src="assets/icons/app-dark.png" alt="FireChat" width="104" height="104" />
  </picture>

  <h1>FireChat</h1>

  <p><strong>开放式 AI 客户端</strong></p>

  <p>
    <a href="./README.zh-CN.md"><strong>中文</strong></a>
    <span> · </span>
    <a href="./README.md"><strong>English</strong></a>
  </p>

  <p>
    <img alt="Electron" src="https://img.shields.io/badge/Electron-41-47848F?style=flat-square" />
    <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?style=flat-square" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-8-8B5CF6?style=flat-square" />
  </p>
</div>

<p align="center">
  <a href="#功能">功能</a>
  <span> · </span>
  <a href="#快速开始">快速开始</a>
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
      <strong>多供应商接入</strong>
      <br />
      在一个客户端中接入多家主流 AI 供应商。
    </td>
    <td width="50%">
      <strong>OpenAdapter 工具</strong>
      <br />
      通过 Web 搜索、网页抓取和站点爬取扩展对话。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>文档附件解析</strong>
      <br />
      将常见文档解析为对话上下文。
    </td>
    <td width="50%">
      <strong>自定义供应商</strong>
      <br />
      添加自定义 OpenAI 兼容供应商。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>会话与记录</strong>
      <br />
      管理本地对话并查看最近请求和失败详情。
    </td>
    <td width="50%">
      <strong>本地代理</strong>
      <br />
      通过本地代理转发供应商请求。
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
| `npm run electron:dev` | 启动桌面开发环境 |
| `npm run build` | 构建渲染层 |
| `npm run electron:build:win` | 构建 Windows 安装包 |
| `npm run check` | 运行 lint 和 typecheck |

## ⚙️ 配置

| 文件或入口 | 说明 |
| --- | --- |
| `.env` / `.env.local` | 启动默认值，参考 `.env.example` |
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
    client/         应用壳层、功能界面、应用控制器、桌面服务调用
    main/           Electron 启动、窗口、IPC、代理和更新
    renderer/       Vite 渲染入口、Provider 运行时、持久化客户端、共享 UI、样式
  shared/           跨进程共享常量与工具
packages/
  contracts/        共享契约与类型
  core/             聊天、Provider、设置核心模块
  data/             SQLite 持久化与存储仓储
  desktop-bridge/   桌面 IPC 通道与 preload 桥接
assets/
  icons/            应用图标资源
build/
  installer.nsh     Windows 安装包脚本
```

## 💾 本地数据

- 会话和部分应用状态保存在本地。
- 开发模式下不启用自动更新。
