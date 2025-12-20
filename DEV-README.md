# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CueCards is a Tauri-based desktop application that provides thoughtfully curated conversation cards for meaningful human connections. The app displays conversation games in a minimalist, card-focused interface with smooth animations mimicking physical card interactions.

## Core Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Tauri v2 (Rust backend)
- **Styling**: Tailwind CSS v4 with custom theme
- **Animations**: Motion (formerly Framer Motion)
- **Build**: Vite with TypeScript compilation

### Key Components

- `GameLibrary.tsx`: Main landing page displaying available conversation games as animated card packs
- `GameInterface.tsx`: Game player with card dealing animations and category-based backgrounds
- `ConversationGame.ts`: TypeScript interfaces defining the JSON schema for games

### Data Architecture

- **Game Storage**: JSON files in `/public/games/` directory
- **Game Discovery**: Dynamic loading via `/public/games/index.json` manifest
- **Scalability**: Add new games by placing JSON files in games directory and updating index.json

## Development Commands

### Frontend Development

```bash
npm run dev          # Start Vite dev server (http://localhost:1420)
npm run build        # Build frontend (TypeScript + Vite)
npm run preview      # Preview production build
```

### Tauri Desktop

```bash
npm run tauri dev    # Start Tauri development with hot reload
npm run tauri build  # Build desktop application for distribution
```

### TypeScript

```bash
npx tsc --noEmit     # Type checking without building
```

## Game Content Structure

### Adding New Games

1. Create JSON file in `/public/games/` following the `ConversationGame` interface
2. Add filename to `/public/games/index.json` in the games array
3. App will automatically discover and load the new game

### JSON Schema Requirements

- `testID`: Unique identifier
- `app`: Title, subtitle, type, version
- `ui`: Screen text configuration
- `theme`: Category colors and card styling
- `questions`: Array of question categories with individual questions

### Question Format

- Questions should be in UPPERCASE for visual impact
- Categories have associated colors that become background colors during gameplay
- Supports both multiple choice and open-ended question types

## Design System

### Visual Design

- **Minimalist**: Clean typography-first approach, no visual clutter
- **Card-focused**: Landscape card format (500×320px) mimicking poker cards
- **Color system**: Category-based backgrounds with white text overlays
- **Typography**: Bold uppercase questions with Inter font family

### Animation Principles

- **Card dealing**: 3D perspective animations when navigating between questions
- **Pack opening**: Hover reveals stacked cards behind main pack
- **Motion library**: Uses Motion for smooth, performant animations
- **Timing**: Staggered entrances with easeOut curves for professional feel

### Responsive Behavior

- Cards maintain aspect ratio across screen sizes using `clamp()` and `min()` functions
- Mobile-first approach with progressive enhancement for larger screens
- Touch-friendly interactions with appropriate button sizing

## Important Configuration

### Tauri Configuration

- App identifier: `com.cuecards.app`
- Window size: 1000×700 (min: 800×600)
- Development port: 1420
- Production builds include all desktop platforms

### Tailwind Setup

- Uses Tailwind CSS v4 with `@import "tailwindcss"`
- Custom theme variables defined in `@theme` block
- PostCSS configuration includes `@tailwindcss/postcss` plugin
- Custom utilities for card perspective and intimate typography

### Build Process

- TypeScript compilation required before Vite build
- Tauri handles frontend bundling and desktop app creation
- Static assets served from `/public/` directory
- Games loaded dynamically from JSON files (not bundled)

## Key Considerations

### Performance

- Motion animations use GPU-accelerated transforms
- Large question sets are flattened for smooth navigation
- Images and assets should be optimized for desktop distribution

### Accessibility

- High contrast color combinations (category colors with white text)
- Keyboard navigation support through standard button interactions
- Semantic HTML structure with proper heading hierarchy

### Content Guidelines

- Questions should be thoughtful and promote meaningful conversation
- Category colors should provide sufficient contrast with white text
- Game descriptions should be concise and emotionally engaging
