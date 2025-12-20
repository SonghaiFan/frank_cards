# CueCards 🎯

<div align="center">

![CueCards Logo](card-icon.svg)

**Thoughtfully curated conversation cards for deeper human connection**

[![Build Status](https://github.com/SonghaiFan/have_a_talk_by_cards/actions/workflows/build.yml/badge.svg)](https://github.com/SonghaiFan/have_a_talk_by_cards/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Windows%20|%20macOS-blue.svg)](https://github.com/SonghaiFan/have_a_talk_by_cards/releases)

[中文](../README.md) | **English**

</div>

---

## 📖 About

CueCards is a cross-platform conversation card application designed to foster deeper human connections through thoughtfully curated questions. Whether for couples, friends, families, or team building, CueCards helps you start meaningful conversations.

## ✨ Features

- 🎨 **Beautiful Interface** - Modern, minimalist card-based UI with emotional intimacy
- 🎯 **Multiple Conversation Topics** - Deep connections, relationship check, and more game modes
- 🌈 **Themed Categories** - Different color themes for different question types
- 🌐 **Bilingual Support** - Seamless switching between English and Chinese
- 📱 **Cross-Platform** - Supports Windows and macOS
- 🎭 **Smooth Animations** - Built with Motion library for fluid user experience
- 💫 **Card Interactions** - Natural card flipping and transition animations
- 🔄 **Progress Tracking** - Real-time conversation progress display

## 🚀 Quick Start

### Download & Install

Visit the [Releases page](https://github.com/SonghaiFan/have_a_talk_by_cards/releases) to download the version for your system:

- **Windows**: `CueCards_*.msi` or `CueCards_*.exe`
- **macOS (Intel)**: `CueCards_*_x64.dmg` or `CueCards_*_x64.app.tar.gz`
- **macOS (Apple Silicon)**: `CueCards_*_aarch64.dmg` or `CueCards_*_aarch64.app.tar.gz`

### Installation Instructions

**Windows Users:**

1. Download the `.msi` or `.exe` file
2. Double-click to install
3. If SmartScreen warning appears, click "More info" → "Run anyway"

**macOS Users:**

⚠️ **Important**: Due to ad-hoc signing, special steps are required for the first run.

1. Download the `.dmg` file
2. Double-click to open, and drag the app to the Applications folder
3. **First Run**: Do NOT double-click the app directly
4. **Right-click** the CueCards app → Select **"Open"**
5. Click **"Open"** in the security warning dialog
6. You can double-click to run normally afterwards

> **Why right-click to open?**  
> To keep costs low, we use ad-hoc signing instead of a paid Apple Developer account. This is completely safe; macOS just requires manual user confirmation to trust the app.

**macOS Users:**

1. Download the `.dmg` file
2. Double-click to open, drag the app to Applications folder
3. If security warning appears, allow it in System Preferences → Security & Privacy

## 🎮 How to Use

1. **Select Game Mode** - Choose your desired conversation theme from the main interface
2. **Choose Categories** - Select question categories and adjust difficulty percentage
3. **Start Conversation** - Click the start button to enter the game
4. **Read Questions** - Each card contains a thoughtfully designed question
5. **Share & Connect** - Share your thoughts and feelings with others
6. **Continue** - Use navigation buttons or keyboard (Space/Enter) to move to the next question

## 🛠️ Development

### Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Animation**: Motion (React)
- **Desktop App**: Tauri
- **Build Tool**: Vite
- **Languages**: Rust + TypeScript
- **Internationalization**: i18next

### Local Development

```bash
# Clone the repository
git clone https://github.com/SonghaiFan/have_a_talk_by_cards.git
cd have_a_talk_by_cards

# Install dependencies
npm install

# Development mode
npm run tauri dev

# Build application
npm run tauri build

# Generate game index
npm run generate-games
```

### Adding New Games

1. Create JSON file in `/public/games/` following the `ConversationGame` interface
2. Run `npm run generate-games` to update the game index
3. Add filename to `/public/games/index.json` in the games array

## 📝 Changelog

- **v0.1.0** - Initial release
  - Basic conversation card functionality
  - Multiple game modes
  - Cross-platform support (Windows, macOS)
  - Bilingual support (English/Chinese)
  - Minimalist, emotionally intimate UI design

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 💬 Contact

For questions or suggestions, please contact us through:

- 🐛 Bug Reports: [Issues](https://github.com/SonghaiFan/have_a_talk_by_cards/issues)
- 💡 Feature Requests: [Discussions](https://github.com/SonghaiFan/have_a_talk_by_cards/discussions)

---

<div align="center">

**Made with ❤️ for meaningful conversations**

</div>
