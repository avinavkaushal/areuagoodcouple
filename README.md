# areuagoodcouple ✨

> **Turn your WhatsApp, Telegram & Instagram chats into a private, cinematic visual story.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-areuagoodcouple.vercel.app-ff85bb?style=for-the-badge&logo=vercel&logoColor=white)](https://areuagoodcouple.vercel.app)

**areuagoodcouple** is a privacy-first chat analyzer and interactive visual story built for couples and close friends. Supporting **WhatsApp** (`.txt`), **Telegram** (`result.json`), and **Instagram DM** (`message_*.json`) exports, simply drop your chat export files, map participant handles to **Her & Him**, and the app instantly transforms months or years of messages into a fluid, animated experience filled with milestones, heatmaps, response patterns, and cherished memories.

You can even upload multiple platforms together or link platforms seamlessly into a **Cross-Platform Unified Story**!

---

## 🌐 Live Application

Experience the app live in your browser:
👉 **[https://areuagoodcouple.vercel.app](https://areuagoodcouple.vercel.app)**

---

## 🔒 100% Private & In-Browser

Your messages never leave your device.
- **Zero Server Uploads**: No database, no backend server, and no cloud storage.
- **Client-Side Parsing**: All file parsing, UTF-8 mojibake repair, regex tokenization, JSON parsing, and analytics occur purely inside your browser.
- **Web Worker Acceleration**: Searching and heavy computations run in background threads to keep the UI silky smooth at 60 FPS.

---

## ✨ Features & Highlights

- **💬 Triple-Platform Support**: Auto-detects and seamlessly parses **WhatsApp** (`.txt`), **Telegram Desktop** (`result.json`), and **Instagram DM** (`message_*.json`) exports.
- **🌐 Cross-Platform Unification**: Combine WhatsApp, Telegram, and Instagram conversations into one cohesive relationship history. Features platform presence distributions, platform migration timelines, and liquid glass switchers.
- **🎞️ Instagram Reels Exchange**: Track reel volume, identify who sends the most reels, calculate reel ping-pong alternation streaks, and discover your peak reel-sharing months.
- **📸 Rich Media Breakdown**: Granular visual breakdown of photos, videos, reel shares, and story replies sent by each person.
- **❤️ Reaction Analytics**: Count total reactions sent, measure message reaction rates (how often your messages get reacted to), uncover top reaction emojis, and analyze reaction response speed.
- **🏷️ Interactive Name Mapping**: Easily map chat handles to **Her & Him** per platform on upload or anytime via the floating Settings modal.
- **🎬 Cinematic Dark Atmosphere**: Ambient looping glow background video, frosted glass cards, and fluid GSAP scroll-triggered animations.
- **📈 Milestones & Big Numbers**: Total messages exchanged, words typed, average daily pace, longest consecutive days talking, and your single busiest chat day.
- **📅 Liquid Glass Calendar Heatmap**: GitHub-style year-long contribution grid with active liquid glass platform filtering (All, WhatsApp, Instagram, Telegram).
- **⚡ The Waiting Game**: Calculates average reply latency for both participants and surfaces the longest recorded wait before replying.
- **🌅 Morning & Night Streaks**: Discovers who says "Good morning" and "Good night" first and tracks consecutive streak records.
- **💖 Terms of Endearment**: An affectionate leaderboard tracking pet names, sweet words, and love terms over time.
- **🕐 24/7 Activity Heatmap**: Hour-by-hour punchcard visualizing your loudest chat hours across Monday through Sunday.
- **🔍 Word Frequency & Timeline**: Type any word to see how many times it was spoken along with an occurrence timeline.
- **☺ Emoji Split**: Side-by-side comparison of your top go-to emojis.
- **☁️ Word Cloud**: Visual cloud of your most frequently typed words.
- **🎲 Random Memory Bookmark**: Click to roll the dice and freeze frame into an authentic historical chat exchange.
- **📜 Longest Monologue**: Pinpoints the longest single message typed in one breath.
- **🧭 Dynamic Navigation Bar**: Floating quick-jump bar with scroll-spy tracking that automatically adapts to the active platforms and available data.

---

## 📱 How to Export Your Chat

### WhatsApp (.txt)
1. Open WhatsApp on your phone (iOS or Android).
2. Open the 1-on-1 chat you want to analyze.
3. Tap **More (⋮)** (or the contact's name at the top on iOS).
4. Tap **Export Chat**.
5. Select **Without Media** *(creates a lightweight `.txt` export)*.
6. Drop the `.txt` file onto **[areuagoodcouple.vercel.app](https://areuagoodcouple.vercel.app)**!

### Telegram (.json)
1. Open Telegram Desktop on your computer.
2. Open the 1-on-1 chat you want to analyze.
3. Click the top-right menu **(⋮)** → **Export chat history**.
4. Set the format to **Machine-readable JSON** (uncheck media for a fast export).
5. Export and drop the resulting `result.json` onto the upload zone!

### Instagram (.json)
1. Go to **Instagram Settings** (on mobile or web) → **Accounts Center**.
2. Select **Your information and permissions** → **Download your information**.
3. Choose **Download or transfer information** → **Some of your information**.
4. Scroll down and select **Messages**.
5. Select **Download to device**:
   - **Format**: **JSON** *(required)*
   - **Media quality**: Low (or omit media for fastest export)
   - **Date range**: All time (or your desired range)
6. Once ready, download and unzip the archive.
7. Navigate to `your_instagram_activity/messages/inbox/<partner_name>/`.
8. Drop `message_1.json` (or select all `message_*.json` files together if paginated) onto the upload zone!
   - *Tip: You can also drop your WhatsApp `.txt` and Instagram `message_*.json` files together to analyze both platforms at once.*

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
cd areuagoodcouple
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Run unit tests:

```bash
npm test
```

Run linter:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

---

## 📄 License

MIT © [Avinav Kaushal](https://github.com/avinavkaushal)
