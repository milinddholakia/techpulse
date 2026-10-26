# 🚀 Deployment & Android App Guide • TechPulse

This guide covers how to:
1. **Deploy the web app online for free** (with automatic 6:00 AM daily news updates).
2. **Turn it into an Android app** (both 1-click PWA install and native `.apk` / `.aab` for the Google Play Store).

---

## Part 1: Deploying the Web App Online (100% Free)

### Option A: GitHub Pages (Recommended — Zero Maintenance)
*Why this is the best option:* We already configured `.github/workflows/daily-fetch.yml`. When hosted on GitHub Pages, GitHub Actions will automatically execute `fetch_news.py` every morning at 6:00 AM UTC, update `data/news.json`, and rebuild your live website with zero servers to manage or pay for!

**Step-by-step:**
1. Open your terminal in the project directory:
   ```bash
   cd /Users/milinddholakia/.gemini/antigravity/scratch/tech-ai-pulse
   ```
2. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial TechPulse release with 6 AM automation and PWA"
   ```
3. Push to your GitHub account:
   - Create a new public repository on [github.com/new](https://github.com/new) named `techpulse`.
   - Run:
     ```bash
     git remote add origin https://github.com/<your-username>/techpulse.git
     git branch -M main
     git push -u origin main
     ```
4. Enable GitHub Pages:
   - In your repository, go to **Settings > Pages**.
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Branch: `main`, folder: `/ (root)`.
   - Click **Save**.
5. Within 60 seconds, your site is live at:
   `https://<your-username>.github.io/techpulse/`

---

### Option B: Vercel or Netlify (Fastest 1-Click Drag & Drop)
If you just want a live URL in 30 seconds without GitHub:
- **Vercel**: Run `npx vercel` inside the folder and follow the prompts.
- **Netlify**: Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the `tech-ai-pulse` folder onto the browser.

---

## Part 2: Creating an Android Application

You have two simple paths depending on your goal:

### Method 1: Instant PWA Install on Android (Takes 1 Minute)
TechPulse is pre-configured with a Web App Manifest (`manifest.json`), service worker (`sw.js`), and Android icons.

1. Deploy the site to any HTTPS URL (like GitHub Pages or Vercel).
2. Open the URL in **Google Chrome** on your Android phone.
3. A banner will appear at the bottom: **"Add TechPulse to Home screen"** (or tap the 3 dots menu `⋮` > **Install app**).
4. TechPulse installs directly to your Android app drawer:
   - Opens in **full-screen standalone mode** (no URL bar, no browser controls).
   - Works offline with cached stories.
   - Shows up alongside your native Android apps.

---

### Method 2: Generate a Native Android APK (`.apk` / `.aab` for Google Play)

To generate a true native Android package that you can install via `.apk` or publish to the Google Play Store, use **Capacitor** or **Bubblewrap**.

#### Using Capacitor (Standard Cross-Platform Native Wrapper)

1. Inside the project folder, initialize Capacitor:
   ```bash
   cd /Users/milinddholakia/.gemini/antigravity/scratch/tech-ai-pulse
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "TechPulse" "com.techpulse.app" --web-dir "."
   ```
2. Add the Android platform:
   ```bash
   npx cap add android
   ```
3. Copy the web assets:
   ```bash
   npx cap copy
   ```
4. Open the generated native Android project in **Android Studio**:
   ```bash
   npx cap open android
   ```
5. In Android Studio:
   - Click the green **Run** button (▶) to run it on your plugged-in Android phone or emulator.
   - Or click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate `app-debug.apk` directly.

---

#### Using Bubblewrap (Google's Official Trusted Web Activity CLI)
Google created Bubblewrap specifically to convert PWAs into Play Store-ready Android apps with zero native code:

```bash
# 1. Install Google Bubblewrap
npm install -g @bubblewrap/cli

# 2. Initialize from your live HTTPS URL
bubblewrap init --manifest="https://<your-username>.github.io/techpulse/manifest.json"

# 3. Build signed APK / AAB
bubblewrap build
```
This generates an `.aab` (Android App Bundle) ready to upload to the **Google Play Console**.
