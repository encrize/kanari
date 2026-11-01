# kanari · Japanese kana, made simple.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)

A modern, fast, and open-access Japanese Hiragana & Katakana learning platform. Practice individual characters, stroke order, authentic audio pronunciation, real-world loanword vocabulary, and active recall with an adaptive Spaced Repetition mastery loop.

---

## 🌟 Key Features

### 1. 🃏 Tofugu-Style Grid Quiz
- Full-board active recall training inspired by [Tofugu Kana Quiz](https://kana-quiz.tofugu.com/).
- Instant verification and auto-focusing to next unsolved cards.
- Supports English romaji, phonetic typing, and keyboard layout correction.
- Comprehensive review screen highlighting missed characters for focused practice.

### 2. 🎯 9 Study Stages
1. **Multiple Choice** - Read the kana and select the matching romaji (`1`-`4` keyboard shortcuts).
2. **Reversed Choice** - Read romaji and identify the corresponding kana character.
3. **Find a Pair** - Memory match tiles between kana and their readings.
4. **Write the Answer** - Direct romaji typing with physical keyboard or on-screen touch keypad. Auto-advances smoothly.
5. **Write a Word** - Vocabulary reading mode featuring **1,500+ authentic Katakana loanwords** (*coffee, taxi, camera, television, internet, hotel, curry, bread*, etc.) with English and Russian translations.
6. **Streamed Typing** - 60 FPS arcade challenge targeting falling characters before they cross the critical threshold.
7. **Listen & Choose** - Authentic native speaker recordings to train listening comprehension.
8. **Stroke Order** - Vector SVG animations displaying exact stroke order, direction, and stroke counts.
9. **Draw Kana** - HTML5 Canvas drawing tool with pressure sensitivity, stroke guide overlays, and **Ctrl+Z (Undo)** support.

### 3. 🧠 Adaptive Mastery Loop (Progress retreats on mistakes)
- Net progress tracking: correct answers fill the session mastery bar, while mistakes retreat progress backward and re-queue failed items for review.
- Persisted character group selection across Katakana and Hiragana.
- Spaced Repetition weight adjustment based on accuracy and response time.

### 4. 🎨 Design & Accessibility
- **Minimalist Light & Dark Themes:** Built with Tailwind CSS v4 custom variants ensuring pristine contrast.
- **Japanese Typography:** Integrated Noto Sans JP, Shippori Mincho, and M PLUS Rounded.
- **Bilingual Interface:** Instant reactive toggle between English (`en`) and Russian (`ru`).
- **PWA & Offline Ready:** Pre-caches audio sprites and fonts for full offline study.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS v4
- **Audio:** Web Audio API with native sprite buffer playback and Web Speech API fallback
- **Testing:** Vitest (21/21 passing tests)
- **Deployment:** Cloudflare Pages / Static Hosting

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0 (or npm / yarn)

```bash
# Clone the repository
git clone https://github.com/your-username/kanari.git
cd kanari

# Install dependencies
pnpm install

# Start local development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Building

```bash
# Run unit tests
pnpm test

# Type check
pnpm tsc --noEmit

# Build production bundle
pnpm build

# Preview production build locally
pnpm preview
```

---

## ☁️ Deployment

`kanari` is pre-configured for instant zero-config deployment to **Cloudflare Pages**, Vercel, or Netlify.

See [DEPLOY.md](./DEPLOY.md) for step-by-step instructions.

---

## 📄 License

MIT License. Open educational software for Japanese language learners worldwide.
