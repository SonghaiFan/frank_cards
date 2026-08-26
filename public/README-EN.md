# FrankCards

<div align="center">

![FrankCards Logo](card-icon.svg)

**Make room for conversations that matter.**

[![Build](https://github.com/SonghaiFan/frank_cards/actions/workflows/build.yml/badge.svg)](https://github.com/SonghaiFan/frank_cards/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20macOS-blue.svg)](https://github.com/SonghaiFan/frank_cards/releases)

[中文](../README.md) · **English**

</div>

FrankCards is a card-based conversation app. Start with a curated topic, combine several topics into a custom session, or create a conversation pack directly on the cards themselves.

## What you can do

- **Quick start:** choose a built-in topic and begin immediately.
- **Build a custom session:** combine topics and categories for a particular relationship or moment.
- **Use tactile card interactions:** move between cards, flip them for additional prompts, and follow the conversation progress.
- **Create your own topics:** after signing in, edit the cover, question front, and supporting back content in a WYSIWYG card studio.
- **Choose the right card type:** open question, discussion, wildcard, and ending cards are supported.
- **Keep editing:** saved topics remain in My Topics, where they can be reopened, changed, and used at any time.
- **Shape the whole pack:** configure category names, descriptions, colors, language, player groups, opening screen, ending screen, and navigation copy.
- **Use it in your language and theme:** Chinese and English, light and dark themes, and responsive desktop/mobile layouts are included.
- **Understand every state:** startup, loading, empty, and error states have dedicated feedback.

## Using FrankCards

### Play a built-in topic

1. Pick a topic from the home screen for a quick start.
2. Or switch to custom mode and select several topics and categories.
3. Read each card, flip it for supporting prompts, then move to the next one.

### Create your own topic

1. Configure Supabase, then sign in to FrankCards with your email.
2. Open My Topics and choose Create Topic.
3. Type directly on the cover or question card.
4. Add another card and choose its type, category, and color.
5. Flip the card to add a description or supporting prompts.
6. Save it, then reopen it for editing or start using it immediately.

> Supabase is optional. Built-in topics and local conversations continue to work without it; accounts and user-created topics are simply unavailable.

## Local development

### Requirements

- Node.js 20+
- npm
- Rust and the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for desktop development
- Supabase CLI only when developing accounts and user-created topics locally

### Run the web app

```bash
git clone https://github.com/SonghaiFan/frank_cards.git
cd frank_cards
npm ci
npm run dev
```

The development server runs at `http://localhost:1420` by default.

### Run the desktop app

```bash
npm run tauri dev
```

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Generate the game index, compile TypeScript, and build the web app |
| `npm run preview` | Preview the production build locally |
| `npm run tauri dev` | Start the Tauri desktop development environment |
| `npm run tauri build` | Build desktop installers |
| `npm run generate-games` | Rebuild the topic index from the Chinese and English JSON files |
| `npx tsc --noEmit` | Run TypeScript type checking only |

## Supabase configuration

Copy the environment template:

```bash
cp .env.example .env.local
```

Then provide:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only use a publishable/anon key in the frontend. **Never** expose a service-role key through a `VITE_` variable.

See [`supabase/README.md`](../supabase/README.md) for migrations, RLS policies, local Supabase, and email-code authentication setup.

## Topic data

FrankCards has two topic sources:

- **Built-in topics** live in `public/games/en/` and `public/games/zh/` and ship with the app.
- **User topics** are stored in Supabase, owned by the signed-in user, and protected by database Row Level Security.

Both sources are normalized into the same `ConversationGame` structure:

```text
ConversationGame
├── app          title, subtitle, language, pack type, player groups
├── ui           opening screen, navigation, ending screen
├── theme        category names, descriptions, and colors
└── questions    cards grouped by category
    └── question type, front question, and optional back content
```

Question types are `open | discussion | wildcard | end`. The complete TypeScript schema is in [`src/types/ConversationGame.ts`](../src/types/ConversationGame.ts).

### Add a built-in topic

1. Add a JSON file to `public/games/en/` or `public/games/zh/`.
2. Keep the same base name for translated pairs; Chinese files use the `-CN.json` suffix.
3. Run `npm run generate-games` to update `public/games/index.json`.
4. Run `npm run build` to validate the types and production build.

Do not maintain the file list in `public/games/index.json` by hand. The generator scans both language directories and recreates it.

## Project structure

```text
src/
├── auth/                 authentication and session state
├── components/           cards, topic libraries, and game UI
│   └── account/          account UI and the WYSIWYG Topic Studio
├── data/
│   ├── supabase/         Supabase client and database types
│   └── topics/           built-in/user repositories and normalization
├── i18n/                 Chinese and English interface copy
└── types/                ConversationGame and Topic schemas
public/games/              built-in topic JSON
supabase/                  migrations, RLS, and email templates
src-tauri/                 Tauri v2 desktop shell
```

## Technology

- React 18 + TypeScript
- Vite 6 + Tailwind CSS 4
- Motion
- i18next
- Supabase Auth + Postgres
- Tauri 2

## Releases

Pushing a `v*` tag triggers GitHub Actions to build Windows, macOS Intel, and macOS Apple Silicon installers and create a GitHub Release.

```bash
git tag v1.0.3
git push origin v1.0.3
```

## Contributing and license

Issues and pull requests are welcome. Read [`CONTRIBUTING_GUIDE.md`](../CONTRIBUTING_GUIDE.md) before getting started.

FrankCards is available under the [MIT License](../LICENSE).

<div align="center">

**Made for conversations that matter.**

</div>
