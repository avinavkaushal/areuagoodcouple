# areuagoodcouple ✨

> **Turn your WhatsApp & Telegram chats into a private, cinematic visual story.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-areuagoodcouple.vercel.app-ff85bb?style=for-the-badge&logo=vercel&logoColor=white)](https://areuagoodcouple.vercel.app)

**areuagoodcouple** is a privacy-first chat analyzer and interactive visual story built for couples and close friends. Supporting both **WhatsApp** (`.txt`) and **Telegram** (`result.json`) exports, simply drop your chat export file, map participant names to **Her & Him**, and the app instantly transforms months or years of messages into a fluid, animated experience filled with milestones, heatmaps, response patterns, and cherished memories.

---

## 🌐 Live Application

Experience the app live in your browser:
👉 **[https://areuagoodcouple.vercel.app](https://areuagoodcouple.vercel.app)**

---

## 🔒 100% Private & In-Browser

Your messages never leave your device.
- **Zero Server Uploads**: No database, no backend server, and no cloud storage.
- **Client-Side Parsing**: All file parsing, regex tokenization, JSON parsing, and analytics occur purely inside your browser.
- **Web Worker Acceleration**: Searching and heavy computations run in background threads to keep the UI silky smooth at 60 FPS.

---

## ✨ Features & Highlights

- **💬 Dual-Platform Support**: Auto-detects and seamlessly parses both **WhatsApp** (`.txt`) and **Telegram Desktop** (`result.json`) exports, handling message replies, forwarded messages, stickers, media, and reaction emojis.
- **🏷️ Interactive Name Mapping**: Easily map chat handles to **Her & Him** on upload or anytime via the floating Settings modal.
- **🎬 Cinematic Dark Atmosphere**: Ambient looping glow background video, frosted glass cards, and fluid GSAP scroll-triggered animations.
- **📈 Milestones & Big Numbers**: Total messages exchanged, words typed, average daily pace, longest consecutive days talking, and your single busiest chat day.
- **📅 Calendar Heatmap**: GitHub-style year-long contribution grid mapping out text intensity for every single day.
- **⚡ The Waiting Game**: Calculates average reply latency for both participants and surfaces the longest recorded wait before replying.
- **🌅 Morning & Night Streaks**: Discovers who says "Good morning" and "Good night" first and tracks consecutive streak records.
- **💖 Terms of Endearment**: An affectionate leaderboard tracking pet names, sweet words, and love terms over time.
- **🕐 24/7 Activity Heatmap**: Hour-by-hour punchcard visualizing your loudest chat hours across Monday through Sunday.
- **🔍 Word Frequency & Timeline**: Type any word to see how many times it was spoken along with an occurrence timeline.
- **☺ Emoji Split**: Side-by-side comparison of your top go-to emojis.
- **☁️ Word Cloud**: Visual cloud of your most frequently typed words.
- **🎲 Random Memory Bookmark**: Click to roll the dice and freeze frame into an authentic historical chat exchange.
- **📜 Longest Monologue**: Pinpoints the longest single message typed in one breath.
- **🧭 Dynamic Navigation Bar**: Smooth floating quick-jump bar with scroll-spy tracking.

---

## 📱 How to Export Your Chat

### WhatsApp (.txt)
1. Open WhatsApp on your phone (iOS or Android).
2. Open the 1-on-1 chat you want to analyze.
3. Tap **More (⋮)** (or the contact's name at the top on iOS).
4. Tap **Export Chat**.
5. Select **Without Media** *(important — this creates a lightweight `.txt` export)*.
6. Open **[areuagoodcouple.vercel.app](https://areuagoodcouple.vercel.app)** and drop the `.txt` file onto the upload zone!

### Telegram (.json)
1. Open Telegram Desktop on your computer.
2. Open the 1-on-1 chat you want to analyze.
3. Click the top-right menu **(⋮)** &rarr; **Export chat history**.
4. Set the format to **Machine-readable JSON** (uncheck media for a fast export).
5. Export and drop the resulting `result.json` onto the upload zone!
6. Confirm the detected platform and map participant names to Her & Him.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [GSAP 3](https://greensock.com/gsap/) with [ScrollTrigger](https://greensock.com/scrolltrigger/)
- **Processing**: Native Web Workers (`searchWorker.js`)
- **Typography**: [Fraunces](https://fonts.google.com/specimen/Fraunces) (Serif) & [Manrope](https://fonts.google.com/specimen/Manrope) (Sans)
- **Deployment**: [Vercel](https://vercel.com)

---

## 🚀 Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/avinavkaushal/areuagoodcouple.git
cd aruavu
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linter:

```bash
npm run lint
```

---

## 📄 License

MIT © [Avinav Kaushal](https://github.com/avinavkaushal)
