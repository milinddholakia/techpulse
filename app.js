/**
 * TechPulse - Daily In-Depth AI & Tech Tinder-style News Swipe Engine
 */

(function () {
  'use strict';

  // --- Audio Synthesis via Web Audio API ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('techpulse_sound_v1') !== 'false';
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('techpulse_sound_v1', this.enabled);
      return this.enabled;
    }

    playWhoosh(direction = 1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      const startFreq = direction > 0 ? 260 : 380;
      const endFreq = direction > 0 ? 540 : 180;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    }

    playChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.22);
      });
    }

    playRewind() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    }
  }

  // --- Main App Controller ---
  class TechPulseApp {
    constructor() {
      this.sound = new SoundFX();
      this.newsList = [];
      this.currentIndex = 0;
      this.history = []; // [{ article, action: 'like' | 'pass' }]
      this.favorites = this.loadFavorites();
      this.isSwiping = false;

      // Pointer drag state
      this.dragActive = false;
      this.isIntentionalHorizontal = false;
      this.startX = 0;
      this.startY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.dragStartTime = 0;
      this.activeCardEl = null;

      // DOM Elements
      this.cardStack = document.getElementById('cardStack');
      this.counterText = document.getElementById('counterText');
      this.favBadgeCount = document.getElementById('favBadgeCount');
      this.drawerPillCount = document.getElementById('drawerPillCount');
      this.passBtn = document.getElementById('passBtn');
      this.likeBtn = document.getElementById('likeBtn');
      this.undoBtn = document.getElementById('undoBtn');
      this.deepDiveBtn = document.getElementById('deepDiveBtn');
      this.openLinkBtn = document.getElementById('openLinkBtn');
      this.favoritesBtn = document.getElementById('favoritesBtn');
      this.favoritesDrawer = document.getElementById('favoritesDrawer');
      this.drawerOverlay = document.getElementById('drawerOverlay');
      this.closeDrawerBtn = document.getElementById('closeDrawerBtn');
      this.favoritesListContainer = document.getElementById('favoritesListContainer');
      this.drawerCategoryFilters = document.getElementById('drawerCategoryFilters');
      this.exportFavoritesBtn = document.getElementById('exportFavoritesBtn');
      this.clearAllFavoritesBtn = document.getElementById('clearAllFavoritesBtn');
      this.shortcutsDialog = document.getElementById('shortcutsDialog');
      this.deepDiveDialog = document.getElementById('deepDiveDialog');
      this.deepDiveContent = document.getElementById('deepDiveContent');
      this.helpBtn = document.getElementById('helpBtn');
      this.closeDialogBtn = document.getElementById('closeDialogBtn');
      this.dialogGotItBtn = document.getElementById('dialogGotItBtn');
      this.soundToggleBtn = document.getElementById('soundToggleBtn');
      this.soundIcon = document.getElementById('soundIcon');
      this.endDeckScreen = document.getElementById('endDeckScreen');
      this.restartDeckBtn = document.getElementById('restartDeckBtn');
      this.viewFavsFromEndBtn = document.getElementById('viewFavsFromEndBtn');
      this.toastContainer = document.getElementById('toastContainer');
      this.activeFavFilter = 'ALL';

      this.init();
    }

    async init() {
      this.updateSoundIcon();
      this.setupEventListeners();
      this.updateFavoritesBadges();
      await this.loadNewsData();
      this.renderDeck();
    }

    // --- Data Loading ---
    async loadNewsData() {
      try {
        const response = await fetch('data/news.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.newsList = data;
          console.log(`[TechPulse] Loaded ${data.length} in-depth articles.`);
          return;
        }
      } catch (err) {
        console.warn('[TechPulse] Could not fetch data/news.json directly. Checking local fallback.', err);
      }
    }

    // --- Favorites LocalStorage Management ---
    loadFavorites() {
      try {
        const stored = localStorage.getItem('techpulse_favorites_v2');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }

    saveFavorites() {
      try {
        localStorage.setItem('techpulse_favorites_v2', JSON.stringify(this.favorites));
      } catch (e) {
        console.error('Failed to save favorites to localStorage', e);
      }
      this.updateFavoritesBadges();
      if (this.favoritesDrawer.classList.contains('open')) {
        this.renderFavoritesDrawer();
      }
    }

    updateFavoritesBadges() {
      const count = this.favorites.length;
      if (this.favBadgeCount) this.favBadgeCount.textContent = count;
      if (this.drawerPillCount) this.drawerPillCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
      const endCount = document.getElementById('endFavBtnCount');
      if (endCount) endCount.textContent = count;
    }

    // --- Rendering the Card Stack ---
    renderDeck() {
      this.cardStack.innerHTML = '';

      if (this.currentIndex >= this.newsList.length) {
        this.showEndOfDeck();
        return;
      }

      this.hideEndOfDeck();
      this.updateCounter();

      // Render the top 3 cards in the stack for smooth 3D depth
      const renderCount = Math.min(3, this.newsList.length - this.currentIndex);
      
      for (let i = renderCount - 1; i >= 0; i--) {
        const articleIndex = this.currentIndex + i;
        const article = this.newsList[articleIndex];
        const cardEl = this.createCardElement(article, i);
        this.cardStack.appendChild(cardEl);
      }

      // Attach pointer gesture listeners to top card (depth 0)
      const topCard = this.cardStack.querySelector('.card-depth-0');
      if (topCard) {
        this.attachCardGestures(topCard);
      }

      // Update button states
      this.undoBtn.disabled = this.history.length === 0;
    }

    createCardElement(article, depthIndex) {
      const card = document.createElement('div');
      card.className = `news-card card-depth-${depthIndex}`;
      card.dataset.id = article.id;

      const categoryColor = article.categoryColor || '#6366f1';

      // Key metrics HTML
      const metricsHtml = (article.keyMetrics && article.keyMetrics.length > 0)
        ? `<div class="metrics-grid">
             ${article.keyMetrics.map(m => `
               <div class="metric-item">
                 <span class="metric-label">${m.label}</span>
                 <span class="metric-val">${m.value}</span>
               </div>
             `).join('')}
           </div>`
        : '';

      // Resources HTML
      const resourcesHtml = (article.resources && article.resources.length > 0)
        ? `<div class="resource-links-row">
             ${article.resources.map(res => `
               <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="resource-pill" title="${res.label}">
                 <span>🔗</span>
                 <span>${res.label}</span>
                 <span>↗</span>
               </a>
             `).join('')}
           </div>`
        : '';

      card.innerHTML = `
        <div class="stamp-indicator stamp-like">FAVORITE ❤️</div>
        <div class="stamp-indicator stamp-pass">BORING ✖️</div>

        <!-- Scrollable Card Content -->
        <div class="card-scroll-area">
          <div class="card-top-bar">
            <span class="category-pill">
              <span class="category-dot" style="background-color: ${categoryColor}"></span>
              ${article.category || 'Tech & AI'}
            </span>
            <div class="card-meta-right">
              <span class="read-time-pill">${article.readTime || '4 min'}</span>
              <span class="badge-pill">${article.badge || '🔥 Top Story'}</span>
            </div>
          </div>

          <div class="card-source-row">
            <span class="source-badge">📡 ${article.source || 'Frontier Tech'}</span>
            <span class="date-divider">•</span>
            <span class="edition-time">${article.date || "Today • 6:00 AM"}</span>
          </div>

          <h2 class="card-headline">${article.title}</h2>

          ${metricsHtml}

          <!-- Executive Summary -->
          <div class="intel-section">
            <div class="intel-section-title">📌 Executive Overview</div>
            <p class="intel-section-text">${article.summary}</p>
          </div>

          <!-- Technical Breakdown -->
          ${article.technicalDeepDive ? `
            <div class="intel-section tech-breakdown-box">
              <div class="intel-section-title">⚙️ Under The Hood (Architecture & Mechanics)</div>
              <p class="intel-section-text">${article.technicalDeepDive}</p>
            </div>
          ` : ''}

          <!-- Industry Impact -->
          ${article.industryImpact ? `
            <div class="intel-section impact-box">
              <div class="intel-section-title">🌐 Industry Impact & Developer Utility</div>
              <p class="intel-section-text">${article.industryImpact}</p>
            </div>
          ` : ''}

          <!-- Direct Links -->
          ${resourcesHtml}
        </div>

        <!-- Bottom Action Bar on Card -->
        <div class="card-bottom-action-bar">
          <button class="card-deep-dive-btn" data-action="deep-dive" title="Open complete deep dive reader">
            <span>📖 Full Deep Dive</span>
          </button>
          <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="card-source-link" title="Open original report">
            <span>Read on ${article.source.split('/')[0].trim()}</span>
            <span>↗</span>
          </a>
        </div>
      `;

      return card;
    }

    updateCounter() {
      const total = this.newsList.length;
      const current = Math.min(this.currentIndex + 1, total);
      if (this.counterText) {
        this.counterText.textContent = `Story ${current} of ${total}`;
      }
    }

    // --- Tinder Swipe Gesture Engine with Smart Vertical Scroll Protection ---
    attachCardGestures(cardEl) {
      this.activeCardEl = cardEl;

      const onPointerDown = (e) => {
        // Allow clicking buttons, links, or inputs without starting drag
        if (e.target.closest('a') || e.target.closest('button')) {
          if (e.target.closest('[data-action="deep-dive"]')) {
            e.stopPropagation();
            this.openDeepDiveModal();
          }
          return;
        }

        if (this.isSwiping) return;

        this.dragActive = true;
        this.isIntentionalHorizontal = false;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        this.dragStartTime = Date.now();

        cardEl.style.transition = 'none';
      };

      const onPointerMove = (e) => {
        if (!this.dragActive) return;

        this.currentX = e.clientX;
        this.currentY = e.clientY;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;

        // Smart axis locking:
        // If the user is scrolling vertically inside the card body, don't hijack as swipe!
        if (!this.isIntentionalHorizontal) {
          if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
            // User is scrolling text vertically
            this.dragActive = false;
            return;
          }
          if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
            // User intentionally wants to swipe horizontally!
            this.isIntentionalHorizontal = true;
            try {
              cardEl.setPointerCapture(e.pointerId);
            } catch (err) {}
          }
        }

        if (!this.isIntentionalHorizontal) return;

        const rotation = deltaX * 0.07; // tilt angle
        cardEl.style.transform = `translate(${deltaX}px, ${deltaY * 0.3}px) rotate(${rotation}deg)`;

        // Control stamp opacities
        const stampLike = cardEl.querySelector('.stamp-like');
        const stampPass = cardEl.querySelector('.stamp-pass');

        if (stampLike && stampPass) {
          if (deltaX > 0) {
            stampLike.style.opacity = Math.min(deltaX / 80, 1);
            stampLike.style.transform = `rotate(12deg) scale(${0.8 + Math.min(deltaX / 300, 0.4)})`;
            stampPass.style.opacity = 0;
          } else if (deltaX < 0) {
            stampPass.style.opacity = Math.min(Math.abs(deltaX) / 80, 1);
            stampPass.style.transform = `rotate(-12deg) scale(${0.8 + Math.min(Math.abs(deltaX) / 300, 0.4)})`;
            stampLike.style.opacity = 0;
          } else {
            stampLike.style.opacity = 0;
            stampPass.style.opacity = 0;
          }
        }

        // Scale up card behind slightly as active card is dragged
        const card1 = this.cardStack.querySelector('.card-depth-1');
        if (card1) {
          const progress = Math.min(Math.abs(deltaX) / 200, 1);
          const scale = 0.96 + progress * 0.04;
          const translateY = 14 - progress * 14;
          card1.style.transform = `translateY(${translateY}px) scale(${scale})`;
          card1.style.opacity = 0.85 + progress * 0.15;
        }
      };

      const onPointerUp = (e) => {
        if (!this.dragActive && !this.isIntentionalHorizontal) return;
        this.dragActive = false;

        try {
          cardEl.releasePointerCapture(e.pointerId);
        } catch (err) {}

        const deltaX = this.currentX - this.startX;
        const duration = Date.now() - this.dragStartTime;
        const velocity = Math.abs(deltaX) / (duration || 1);

        const thresholdPassed = this.isIntentionalHorizontal && (
          Math.abs(deltaX) > 95 || (velocity > 0.45 && Math.abs(deltaX) > 40)
        );

        if (thresholdPassed) {
          const action = deltaX > 0 ? 'like' : 'pass';
          this.executeSwipe(action, cardEl, deltaX);
        } else {
          // Snap back
          this.resetCardPosition(cardEl);
        }

        this.isIntentionalHorizontal = false;
      };

      cardEl.addEventListener('pointerdown', onPointerDown);
      cardEl.addEventListener('pointermove', onPointerMove);
      cardEl.addEventListener('pointerup', onPointerUp);
      cardEl.addEventListener('pointercancel', onPointerUp);
    }

    resetCardPosition(cardEl) {
      cardEl.style.transition = 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      cardEl.style.transform = 'translate(0px, 0px) rotate(0deg)';

      const stampLike = cardEl.querySelector('.stamp-like');
      const stampPass = cardEl.querySelector('.stamp-pass');
      if (stampLike) stampLike.style.opacity = '0';
      if (stampPass) stampPass.style.opacity = '0';

      const card1 = this.cardStack.querySelector('.card-depth-1');
      if (card1) {
        card1.style.transition = 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease';
        card1.style.transform = 'translateY(14px) scale(0.96)';
        card1.style.opacity = '0.85';
      }
    }

    executeSwipe(action, cardEl, initialDeltaX = 0) {
      if (this.isSwiping) return;
      this.isSwiping = true;

      const isLike = action === 'like';
      const flyDistance = isLike ? window.innerWidth + 200 : -(window.innerWidth + 200);
      const flyRotation = isLike ? 25 : -25;

      // Stamp highlight
      const stamp = cardEl.querySelector(isLike ? '.stamp-like' : '.stamp-pass');
      if (stamp) stamp.style.opacity = '1';

      cardEl.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease';
      cardEl.style.transform = `translate(${flyDistance}px, -40px) rotate(${flyRotation}deg)`;
      cardEl.style.opacity = '0';

      // Sound
      if (isLike) {
        this.sound.playChime();
      } else {
        this.sound.playWhoosh(-1);
      }

      // Record current article
      const article = this.newsList[this.currentIndex];
      this.history.push({ article, action });

      if (isLike) {
        this.addToFavorites(article);
      }

      setTimeout(() => {
        this.currentIndex++;
        this.isSwiping = false;
        this.renderDeck();
      }, 260);
    }

    // --- Action Methods ---
    swipeLeft() {
      const topCard = this.cardStack.querySelector('.card-depth-0');
      if (topCard && !this.isSwiping) {
        this.executeSwipe('pass', topCard, -120);
      }
    }

    swipeRight() {
      const topCard = this.cardStack.querySelector('.card-depth-0');
      if (topCard && !this.isSwiping) {
        this.executeSwipe('like', topCard, 120);
      }
    }

    undoLastSwipe() {
      if (this.history.length === 0 || this.isSwiping) return;

      const last = this.history.pop();
      if (!last) return;

      this.sound.playRewind();

      if (last.action === 'like') {
        this.favorites = this.favorites.filter(f => f.id !== last.article.id);
        this.saveFavorites();
      }

      this.currentIndex = Math.max(0, this.currentIndex - 1);
      this.renderDeck();
      this.showToast('↩️ Swipe undone');
    }

    openCurrentArticle() {
      if (this.currentIndex < this.newsList.length) {
        const article = this.newsList[this.currentIndex];
        if (article && article.url) {
          window.open(article.url, '_blank', 'noopener,noreferrer');
          this.showToast(`Opening source: ${article.source}`);
        }
      }
    }

    // --- Deep Dive Reader Modal ---
    openDeepDiveModal() {
      if (this.currentIndex >= this.newsList.length) return;
      const article = this.newsList[this.currentIndex];
      if (!article) return;

      const categoryColor = article.categoryColor || '#6366f1';

      const metricsHtml = (article.keyMetrics && article.keyMetrics.length > 0)
        ? `<div class="metrics-grid">
             ${article.keyMetrics.map(m => `
               <div class="metric-item">
                 <span class="metric-label">${m.label}</span>
                 <span class="metric-val">${m.value}</span>
               </div>
             `).join('')}
           </div>`
        : '';

      const resourcesHtml = (article.resources && article.resources.length > 0)
        ? `<div class="resource-links-row">
             ${article.resources.map(res => `
               <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="resource-pill">
                 <span>🔗</span>
                 <span>${res.label}</span>
                 <span>↗</span>
               </a>
             `).join('')}
           </div>`
        : '';

      this.deepDiveContent.innerHTML = `
        <div class="reader-header">
          <div class="reader-header-left">
            <span class="category-pill">
              <span class="category-dot" style="background-color: ${categoryColor}"></span>
              ${article.category}
            </span>
            <span class="read-time-pill">${article.readTime}</span>
          </div>
          <button class="dialog-close-btn" id="closeDeepDiveBtn">✕</button>
        </div>

        <div class="reader-scroll-content">
          <h1>${article.title}</h1>

          <div class="card-source-row">
            <span>📡 Published by <strong>${article.source}</strong></span>
            <span>•</span>
            <span>${article.date}</span>
          </div>

          ${metricsHtml}

          <div class="reader-section-title">📌 Executive Overview</div>
          <p class="reader-paragraph">${article.summary}</p>

          ${article.technicalDeepDive ? `
            <div class="reader-section-title">⚙️ Architecture & Technical Deep Dive</div>
            <p class="reader-paragraph">${article.technicalDeepDive}</p>
          ` : ''}

          ${article.industryImpact ? `
            <div class="reader-section-title">🌐 Industry Implications & Strategic Takeaways</div>
            <p class="reader-paragraph">${article.industryImpact}</p>
          ` : ''}

          <div class="reader-section-title">🔗 Official Papers, Code & Documentation</div>
          ${resourcesHtml}
        </div>

        <div class="reader-footer">
          <button class="btn btn-primary" id="saveFavFromReaderBtn">
            <span>⭐️ Save to Favorites</span>
          </button>
          <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">
            <span>Open Primary Source ↗</span>
          </a>
        </div>
      `;

      this.deepDiveDialog.showModal();

      document.getElementById('closeDeepDiveBtn').addEventListener('click', () => {
        this.deepDiveDialog.close();
      });

      document.getElementById('saveFavFromReaderBtn').addEventListener('click', () => {
        this.addToFavorites(article);
        this.deepDiveDialog.close();
      });
    }

    addToFavorites(article) {
      if (!this.favorites.some(f => f.id === article.id)) {
        this.favorites.unshift(article);
        this.saveFavorites();
        this.showToast('⭐️ Added to Favorites!');
      }
    }

    removeFromFavorites(id) {
      this.favorites = this.favorites.filter(f => f.id !== id);
      this.saveFavorites();
      this.showToast('Removed from Favorites');
    }

    clearAllFavorites() {
      if (this.favorites.length === 0) return;
      if (confirm('Are you sure you want to clear all your saved favorites?')) {
        this.favorites = [];
        this.saveFavorites();
        this.showToast('Cleared all favorites');
      }
    }

    exportFavoritesMarkdown() {
      if (this.favorites.length === 0) {
        this.showToast('No favorites to export yet!');
        return;
      }

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      let md = `# ⚡️ TechPulse Daily Intelligence Digest (${today})\n\n`;
      md += `Curated in-depth briefing from the 6:00 AM edition.\n\n`;

      this.favorites.forEach((fav, i) => {
        md += `## ${i + 1}. [${fav.title}](${fav.url})\n`;
        md += `**Category:** ${fav.category} | **Source:** ${fav.source} | **Read Time:** ${fav.readTime}\n\n`;
        
        if (fav.keyMetrics && fav.keyMetrics.length > 0) {
          md += `**Key Metrics:**\n`;
          fav.keyMetrics.forEach(m => {
            md += `- **${m.label}:** ${m.value}\n`;
          });
          md += `\n`;
        }

        md += `### Executive Overview\n${fav.summary}\n\n`;

        if (fav.technicalDeepDive) {
          md += `### Under The Hood (Architecture & Mechanics)\n${fav.technicalDeepDive}\n\n`;
        }

        if (fav.industryImpact) {
          md += `### Industry Impact & Developer Utility\n${fav.industryImpact}\n\n`;
        }

        if (fav.resources && fav.resources.length > 0) {
          md += `### References & Code\n`;
          fav.resources.forEach(res => {
            md += `- [${res.label}](${res.url})\n`;
          });
          md += `\n`;
        }

        md += `---\n\n`;
      });

      navigator.clipboard.writeText(md).then(() => {
        this.showToast('📋 Copied Complete Markdown Digest to clipboard!');
      }).catch(() => {
        this.showToast('Failed to copy to clipboard');
      });
    }

    // --- End of Deck Screen ---
    showEndOfDeck() {
      if (this.endDeckScreen) {
        this.endDeckScreen.classList.remove('hidden');

        const likedCount = this.history.filter(h => h.action === 'like').length;
        const passedCount = this.history.filter(h => h.action === 'pass').length;
        const total = this.newsList.length;

        document.getElementById('statLikedCount').textContent = likedCount;
        document.getElementById('statPassedCount').textContent = passedCount;
        document.getElementById('statTotalCount').textContent = total;
        document.getElementById('endFavBtnCount').textContent = this.favorites.length;
      }

      this.passBtn.disabled = true;
      this.likeBtn.disabled = true;
      this.deepDiveBtn.disabled = true;
      this.openLinkBtn.disabled = true;
    }

    hideEndOfDeck() {
      if (this.endDeckScreen) {
        this.endDeckScreen.classList.add('hidden');
      }
      this.passBtn.disabled = false;
      this.likeBtn.disabled = false;
      this.deepDiveBtn.disabled = false;
      this.openLinkBtn.disabled = false;
    }

    restartDeck() {
      this.currentIndex = 0;
      this.history = [];
      this.renderDeck();
      this.showToast('Deck restarted for today!');
    }

    // --- Favorites Drawer Display ---
    openFavoritesDrawer() {
      this.renderFavoritesDrawer();
      this.favoritesDrawer.classList.add('open');
      this.drawerOverlay.classList.add('active');
    }

    closeFavoritesDrawer() {
      this.favoritesDrawer.classList.remove('open');
      this.drawerOverlay.classList.remove('active');
    }

    renderFavoritesDrawer() {
      const categories = ['ALL'];
      this.favorites.forEach(f => {
        if (f.category && !categories.includes(f.category)) {
          categories.push(f.category);
        }
      });

      this.drawerCategoryFilters.innerHTML = categories.map(cat => {
        const count = cat === 'ALL' 
          ? this.favorites.length 
          : this.favorites.filter(f => f.category === cat).length;
        const activeClass = this.activeFavFilter === cat ? 'active' : '';
        return `<button class="filter-chip ${activeClass}" data-category="${cat}">${cat} (${count})</button>`;
      }).join('');

      this.drawerCategoryFilters.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          this.activeFavFilter = chip.dataset.category;
          this.renderFavoritesDrawer();
        });
      });

      const filtered = this.activeFavFilter === 'ALL'
        ? this.favorites
        : this.favorites.filter(f => f.category === this.activeFavFilter);

      if (filtered.length === 0) {
        this.favoritesListContainer.innerHTML = `
          <div class="fav-empty-state">
            <div class="fav-empty-icon">⭐️</div>
            <h3>No favorites in this list</h3>
            <p>Swipe right on any interesting news story to save it here for later reading.</p>
          </div>
        `;
        return;
      }

      this.favoritesListContainer.innerHTML = filtered.map(item => {
        const metricsTags = (item.keyMetrics && item.keyMetrics.length > 0)
          ? `<div class="fav-metrics-mini">
               ${item.keyMetrics.slice(0, 2).map(m => `<span class="fav-metric-tag">${m.label}: ${m.value}</span>`).join('')}
             </div>`
          : '';

        return `
          <div class="favorite-item-card" data-id="${item.id}">
            <div class="fav-item-top">
              <span class="fav-item-cat" style="color: ${item.categoryColor || '#06b6d4'}">${item.category || 'Tech & AI'}</span>
              <span class="fav-item-source">${item.source || ''}</span>
            </div>
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="fav-item-title">${item.title}</a>
            <p class="fav-item-summary">${item.summary}</p>
            ${metricsTags}
            <div class="fav-item-actions">
              <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="fav-read-link">
                <span>Read source</span>
                <span>↗</span>
              </a>
              <button class="fav-remove-btn" data-remove-id="${item.id}" title="Remove from favorites">Remove ✕</button>
            </div>
          </div>
        `;
      }).join('');

      this.favoritesListContainer.querySelectorAll('.fav-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.removeId;
          this.removeFromFavorites(id);
        });
      });
    }

    // --- Toast Notifications ---
    showToast(message) {
      if (!this.toastContainer) return;
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      this.toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 2500);
    }

    // --- Sound Icon State ---
    updateSoundIcon() {
      if (this.soundIcon) {
        this.soundIcon.textContent = this.sound.enabled ? '🔊' : '🔇';
      }
    }

    // --- Event Listeners Setup ---
    setupEventListeners() {
      // Swipe action buttons
      this.passBtn.addEventListener('click', () => this.swipeLeft());
      this.likeBtn.addEventListener('click', () => this.swipeRight());
      this.undoBtn.addEventListener('click', () => this.undoLastSwipe());
      this.deepDiveBtn.addEventListener('click', () => this.openDeepDiveModal());
      this.openLinkBtn.addEventListener('click', () => this.openCurrentArticle());

      // Drawer controls
      this.favoritesBtn.addEventListener('click', () => this.openFavoritesDrawer());
      this.closeDrawerBtn.addEventListener('click', () => this.closeFavoritesDrawer());
      this.drawerOverlay.addEventListener('click', () => this.closeFavoritesDrawer());
      this.exportFavoritesBtn.addEventListener('click', () => this.exportFavoritesMarkdown());
      this.clearAllFavoritesBtn.addEventListener('click', () => this.clearAllFavorites());

      // Dialog controls
      this.helpBtn.addEventListener('click', () => this.shortcutsDialog.showModal());
      this.closeDialogBtn.addEventListener('click', () => this.shortcutsDialog.close());
      this.dialogGotItBtn.addEventListener('click', () => this.shortcutsDialog.close());

      // Sound toggle
      this.soundToggleBtn.addEventListener('click', () => {
        const isNowOn = this.sound.toggle();
        this.updateSoundIcon();
        this.showToast(isNowOn ? 'Sound FX On 🔊' : 'Sound FX Muted 🔇');
        if (isNowOn) this.sound.playChime();
      });

      // End of deck buttons
      this.restartDeckBtn.addEventListener('click', () => this.restartDeck());
      this.viewFavsFromEndBtn.addEventListener('click', () => this.openFavoritesDrawer());

      // Keyboard navigation
      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        if (e.key === 'Escape') {
          if (this.deepDiveDialog.open) {
            this.deepDiveDialog.close();
            return;
          }
          if (this.favoritesDrawer.classList.contains('open')) {
            this.closeFavoritesDrawer();
            return;
          }
          if (this.shortcutsDialog.open) {
            this.shortcutsDialog.close();
            return;
          }
        }

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.swipeLeft();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.swipeRight();
            break;
          case ' ':
          case 'd':
          case 'D':
            e.preventDefault();
            this.openDeepDiveModal();
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.openCurrentArticle();
            break;
          case 'z':
          case 'Z':
            e.preventDefault();
            this.undoLastSwipe();
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            if (this.favoritesDrawer.classList.contains('open')) {
              this.closeFavoritesDrawer();
            } else {
              this.openFavoritesDrawer();
            }
            break;
        }
      });
    }
  }

  // Register Service Worker for PWA & Offline Support
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('[TechPulse PWA] Service Worker active:', reg.scope);
      }).catch((err) => {
        console.warn('[TechPulse PWA] Service Worker registration failed:', err);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TechPulseApp());
  } else {
    new TechPulseApp();
  }
})();
