<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/icons/app.png" />
    <source media="(prefers-color-scheme: light)" srcset="assets/icons/app-dark.png" />
    <img src="assets/icons/app-dark.png" alt="FireChat" width="104" height="104" />
  </picture>

  <h1>FireChat</h1>

  <p><strong>Desktop AI chat client</strong></p>

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
  <a href="#features">Features</a>
  <span> · </span>
  <a href="#quick-start">Quick Start</a>
  <span> · </span>
  <a href="#provider-support">Provider Support</a>
  <span> · </span>
  <a href="#configuration">Configuration</a>
  <span> · </span>
  <a href="#project-structure">Project Structure</a>
</p>

---

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <strong>20+ AI providers</strong>
      <br />
      Built-in support for OpenAI, Anthropic, Google, Groq, Mistral, DeepInfra, and more.
    </td>
    <td width="50%">
      <strong>OpenAdapter tools</strong>
      <br />
      Extend chat with web search, page fetch, crawl, and custom MCP tools.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Document parsing</strong>
      <br />
      Parse PDF, Word, Excel, PowerPoint, and other document formats into chat context.
    </td>
    <td width="50%">
      <strong>Custom providers</strong>
      <br />
      Add any OpenAI-compatible provider with custom endpoints, headers, and models.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Local persistence</strong>
      <br />
      Conversations, settings, and request logs stored in local SQLite database.
    </td>
    <td width="50%">
      <strong>Local API proxy</strong>
      <br />
      Route provider requests through a configurable local HTTP/2 proxy.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Companion pet</strong>
      <br />
      An animated desktop pet with expressive idle, thinking, and talking animations.
    </td>
    <td width="50%">
      <strong>Request logging</strong>
      <br />
      Inspect request history with status, duration, error classification, and filtering.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Theme & accent system</strong>
      <br />
      Light/dark/system theme with 24 accent colors and reduced-motion support.
    </td>
    <td width="50%">
      <strong>Auto update</strong>
      <br />
      Checks GitHub releases and prompts with one-click download.
    </td>
  </tr>
</table>

## 🚀 Quick Start

### Requirements

| Item | Requirement |
| --- | --- |
| Node.js | 20+ |
| Package manager | npm |

### Start

```bash
npm install
npm run electron:dev
```

### Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run electron:dev` | Start full desktop development environment |
| `npm run proxy:dev` | Start local API proxy standalone |
| `npm run build` | Build the renderer for production |
| `npm run electron:build:win` | Build the Windows NSIS installer |
| `npm run check` | Run lint and typecheck |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |

### Windows Build

```bash
npm run build
npm run electron:build:win
# Installer output: release/FireChat Setup {version}.exe
```

## 🤖 Provider Support

Built-in providers (each configurable with API key, model, and base URL at runtime):

| Category | Providers |
| --- | --- |
| **General** | OpenAI, Anthropic, Google Generative AI, Google Vertex AI, Groq, Mistral, Cohere, Perplexity, xAI |
| **Open-source / inference** | DeepInfra, Together AI, Fireworks AI, Cerebras, Sambanova, HuggingFace |
| **Chinese** | Alibaba (Qwen), DeepSeek, GLM (Zhipu), MiniMax, Moonshot (Kimi), StepFun, VolcEngine, Xiaomi |
| **API aggregators** | OpenRouter, LongCat, Vercel |
| **Compatibility** | OpenAI-compatible, OpenAdapter, OpenCode |

Custom providers can be added via JSON config or the settings UI.

## ⚙️ Configuration

| File or entry | Description |
| --- | --- |
| `.env` / `.env.local` | Startup defaults for API keys, models, base URLs |
| `firechat.local.json` | Non-sensitive local config for providers, URLs, default models, and model lists |
| `firechat.auth.json` | Sensitive auth config for API keys and custom headers |
| Settings window | Main configuration entry, saved to local config files |

Notes:

- Custom providers support OpenAI format and OpenAI-compatible format.
- Development reads repo-root config files first.
- Packaged builds read user-data config files first.
- Clear app data does not delete `firechat.local.json` or `firechat.auth.json`.

## 🗂️ Project Structure

```text
apps/
  desktop/
    client/          App shell, feature UI, app controller, desktop-facing services
    main/            Electron startup, windowing, IPC, proxy, updater, document parsing
    renderer/        Vite renderer entry, provider runtime, persistence clients, shared UI, styles
  shared/            Cross-process shared constants, provider IDs, runtime env keys
packages/
  contracts/         Shared TypeScript contracts, types, and runtime config definitions
  core/              Chat streaming pipeline, provider execution, settings transaction engine
  data/              SQLite schema, database, and storage repositories
  desktop-bridge/    Desktop IPC channels and preload bridge for renderer-main communication
assets/
  icons/             App icon assets (PNG, ICO, SVG, light/dark variants)
build/
  installer.nsh      Windows NSIS installer script
```

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Electron Main                     │
│  main.cjs ── createMainAppRuntime ── IPC handlers   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Proxy │ Updater │ Tray │ Window │ Config    │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                   Electron Renderer                  │
│  ┌──────────────────────────────────────────────┐   │
│  │  React App (client/)                         │   │
│  │  ┌─────┐ ┌──────────┐ ┌────────────────┐    │   │
│  │  │Chat │ │ Sessions │ │ Settings       │    │   │
│  │  ├─────┤ ├──────────┤ ├────────────────┤    │   │
│  │  │ Pet │ │ Desktop  │ │ Request Logs   │    │   │
│  │  └─────┘ └──────────┘ └────────────────┘    │   │
│  ├──────────────────────────────────────────────┤   │
│  │  Provider Runtime (infrastructure/)          │   │
│  │  SDK adapters │ Model catalog │ Registry     │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                   Shared Packages                    │
│  contracts ── core ── data ── desktop-bridge         │
└─────────────────────────────────────────────────────┘
```

## 💾 Local Data

- Conversations, app settings, and request logs are stored in a local SQLite database (`firechat.sqlite` in user data directory).
- Auto update checks GitHub releases; disabled in development mode.
- Provider config is persisted as JSON files (`firechat.local.json`, `firechat.auth.json`).

## 📄 License

GNU General Public License v3.0
