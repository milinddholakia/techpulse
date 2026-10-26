# ⚡️ TechPulse • Daily AI & Tech Swipe

An interactive, Tinder-style web application providing daily morning briefings (20–25 curated stories) across the frontier of Artificial Intelligence, Robotics, Quantum Computing, Semiconductors, and Developer Tools.

- **Swipe Left (or press `←`)**: Mark as boring / pass
- **Swipe Right (or press `→`)**: Save to Favorites / Like
- **Press `Space` or `↑`**: Open original source article directly
- **Press `Z`**: Undo last swipe
- **Press `F`**: Open your saved favorites drawer

---

## 🚀 Quick Start (Run Locally)

You can run TechPulse locally in seconds using any of the following:

### Option 1: Instant Browser Launch (Zero Dependencies)
Simply open `index.html` directly in your browser:
```bash
open /Users/milinddholakia/.gemini/antigravity/scratch/tech-ai-pulse/index.html
```

### Option 2: Local HTTP Server (Recommended)
From the project folder:
```bash
cd /Users/milinddholakia/.gemini/antigravity/scratch/tech-ai-pulse
python3 -m http.server 8000
```
Then visit **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## ⏰ Daily 6:00 AM News Automation

The application is architected around a daily 6:00 AM edition containing 20–25 high-signal stories.

### 1. The Fetcher Script (`fetch_news.py`)
`fetch_news.py` aggregates top Tech & AI stories from:
- **Hacker News** frontpage (top upvoted tech & AI discussions)
- **TechCrunch AI** RSS feed
- **The Verge** Tech & AI news
- **Frontier Lab updates** (DeepSeek, OpenAI, Anthropic, Google DeepMind, arXiv)

To run the fetcher manually at any time:
```bash
python3 fetch_news.py
```
This updates `data/news.json`.

### 2. Schedule Daily at 6:00 AM Locally (Cron)
To run automatically on your Mac every day at 6:00 AM:
1. Open terminal and run: `crontab -e`
2. Add the following line:
```cron
0 6 * * * cd /Users/milinddholakia/.gemini/antigravity/scratch/tech-ai-pulse && /usr/bin/python3 fetch_news.py >> fetch.log 2>&1
```

### 3. Deploy Free with Automated 6:00 AM Sync (GitHub Actions)
A production-ready GitHub Actions workflow is included at `.github/workflows/daily-fetch.yml`.

When pushed to a GitHub repository:
1. Go to **Settings > Pages** and set source to `GitHub Actions` or `main branch root`.
2. Every morning at 6:00 AM, GitHub Actions automatically executes `fetch_news.py`, commits the fresh 25 stories to `data/news.json`, and rebuilds your live site for free.

---

## 🎨 Features & Highlights

- **Physics-Based Card Deck**: Smooth Pointer Events (`pointerdown`, `pointermove`, `pointerup`) supporting mobile touchscreens, trackpads, and desktop mice.
- **Visual Swipe Feedback**: Glowing green **FAVORITE ❤️** stamp on rightward drag, glowing red **BORING ✖️** stamp on leftward drag.
- **Local Persistence**: Liked articles are saved to browser `localStorage` and never lost on page refresh.
- **Favorites Drawer**:
  - Filter liked articles by topic category.
  - Direct links to original articles.
  - **Export as Markdown**: 1-click copy formatted summary for Obsidian, Notion, or Slack.
- **Synthesized Audio Effects**: Custom Web Audio API chimes and whooshes without loading external audio assets.
- **100% Client-Side**: No costly backend servers needed to deploy.

---

## 📁 Project Structure

```
tech-ai-pulse/
├── index.html                  # Main application structure & semantic layout
├── styles.css                  # Responsive dark cyberpunk styling & card animations
├── app.js                      # Tinder swipe engine, audio, favorites & keyboard handlers
├── fetch_news.py               # Standalone 6:00 AM news aggregator
├── data/
│   └── news.json               # 20-25 daily curated stories
├── .github/
│   └── workflows/
│       └── daily-fetch.yml     # Automated daily GitHub Action
└── README.md                   # Documentation
```
