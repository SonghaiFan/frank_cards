# FrankCards

<div align="center">

![FrankCards Logo](public/card-icon.svg)

**让值得聊的话题，真正发生。**

[![Build](https://github.com/SonghaiFan/frank_cards/actions/workflows/build.yml/badge.svg)](https://github.com/SonghaiFan/frank_cards/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20macOS-blue.svg)](https://github.com/SonghaiFan/frank_cards/releases)

**中文** · [English](public/README-EN.md)

</div>

FrankCards 是一个卡片式对话应用。你可以直接开始一组精选话题，也可以组合多个 Topic，或在真实卡片界面中制作自己的对话包。

## 现在可以做什么

- **快速开始**：选择一个内置 Topic，立即进入对话。
- **组合对话**：混合多个 Topic 和分类，创建一场更符合当下关系与场景的对话。
- **真实卡片交互**：支持卡片切换、正反面翻转、进度提示和流畅动画。
- **创建自己的 Topic**：登录后，在所见即所得的卡片工作台中直接编辑封面、问题正面和补充内容背面。
- **完整卡片类型**：支持开放题、讨论题、Wildcard 和结束卡。
- **持续编辑**：已创建的 Topic 会保存在“我的 Topics”中，可以再次打开、修改并直接使用。
- **个性化设计**：为分类设置名称、描述与颜色，并配置语言、适用人群、开场页、结束页和导航文字。
- **中英文与主题模式**：支持中文/英文切换、明暗主题以及响应式桌面和移动布局。
- **可靠的界面状态**：初始化、数据加载、空内容和错误状态均有独立反馈。

## 使用方式

### 使用内置 Topic

1. 在首页选择一个 Topic 快速开始。
2. 或进入自定义模式，选择多个 Topic 与分类。
3. 开始后阅读卡片，翻到背面查看补充提示，再切换到下一张。

### 创建自己的 Topic

1. 配置 Supabase 后，使用邮箱登录 FrankCards。
2. 打开“我的 Topics”，选择“创建 Topic”。
3. 直接在封面或问题卡片上输入内容。
4. 新建下一张卡片，并设置类型、分类和颜色。
5. 翻到背面添加说明或对话提示。
6. 保存后，可从“我的 Topics”继续编辑或立即开始使用。

> Supabase 是可选能力。没有配置 Supabase 时，所有内置 Topic 与本地对话功能仍然可用；账号和用户 Topic 功能会停用。

## 本地开发

### 环境要求

- Node.js 20+
- npm
- Rust 与 [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)（仅桌面端开发需要）
- Supabase CLI（仅本地开发账号和用户 Topic 功能需要）

### 启动 Web 版本

```bash
git clone https://github.com/SonghaiFan/frank_cards.git
cd frank_cards
npm ci
npm run dev
```

开发服务器默认运行在 `http://localhost:1420`。

### 启动桌面版本

```bash
npm run tauri dev
```

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 生成游戏索引、执行 TypeScript 编译并构建 Web 产物 |
| `npm run preview` | 本地预览生产构建 |
| `npm run tauri dev` | 启动 Tauri 桌面开发环境 |
| `npm run tauri build` | 构建桌面安装包 |
| `npm run generate-games` | 根据中英文 JSON 重新生成 Topic 索引 |
| `npx tsc --noEmit` | 仅执行 TypeScript 类型检查 |

## Supabase 配置

复制环境变量示例：

```bash
cp .env.example .env.local
```

然后填写：

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

前端只能使用 publishable/anon key，**不要**把 service-role key 放进任何 `VITE_` 环境变量。

数据库迁移、RLS 策略、本地 Supabase 和邮箱验证码配置见 [supabase/README.md](supabase/README.md)。

## Topic 数据

FrankCards 有两类 Topic 来源：

- **内置 Topic**：存放于 `public/games/en/` 和 `public/games/zh/`，随应用发布。
- **用户 Topic**：通过 Supabase 保存，归属于登录用户，并由数据库的 Row Level Security 保护。

两种来源最终都会规范化为同一个 `ConversationGame` 数据结构：

```text
ConversationGame
├── app          标题、副标题、语言、类型、适用人群
├── ui           开场页、上一张/下一张、结束页
├── theme        分类名称、描述和颜色
└── questions    分类下的卡片
    └── question 类型、正面问题和可选背面内容
```

问题类型定义为 `open | discussion | wildcard | end`。完整 TypeScript schema 位于 [`src/types/ConversationGame.ts`](src/types/ConversationGame.ts)。

### 添加内置 Topic

1. 根据语言在 `public/games/en/` 或 `public/games/zh/` 新建 JSON 文件。
2. 保持中英文文件的基础名称一致；中文文件使用 `-CN.json` 后缀。
3. 运行 `npm run generate-games` 更新 `public/games/index.json`。
4. 运行 `npm run build` 验证 schema、类型和构建结果。

请勿手动维护 `public/games/index.json` 中的文件列表；生成脚本会扫描语言目录并重新创建它。

## 项目结构

```text
src/
├── auth/                 登录与会话状态
├── components/           卡片、Topic 列表和游戏界面
│   └── account/          账号界面与所见即所得 Topic Studio
├── data/
│   ├── supabase/         Supabase client 与数据库类型
│   └── topics/           内置/用户 Topic repositories 与规范化逻辑
├── i18n/                 中英文界面文案
└── types/                ConversationGame 与 Topic schema
public/games/              内置 Topic JSON
supabase/                  数据库迁移、RLS 与邮件模板
src-tauri/                 Tauri v2 桌面外壳
```

## 技术栈

- React 18 + TypeScript
- Vite 6 + Tailwind CSS 4
- Motion
- i18next
- Supabase Auth + Postgres
- Tauri 2

## 发布

推送 `v*` 标签会触发 GitHub Actions，为 Windows、macOS Intel 和 macOS Apple Silicon 构建桌面安装包并创建 GitHub Release。

```bash
git tag v1.0.3
git push origin v1.0.3
```

## 贡献与许可

欢迎提交 Issue 或 Pull Request。开始前请阅读 [CONTRIBUTING_GUIDE.md](CONTRIBUTING_GUIDE.md)。

FrankCards 使用 [MIT License](LICENSE) 发布。

<div align="center">

**Made for conversations that matter.**

</div>
