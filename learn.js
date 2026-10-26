/**
 * TechPulse - Learn AI (50 Topics) Interactive Engine
 */

(function () {
  'use strict';

  // --- Sound Effects ---
  class LearnSoundFX {
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

    playMasteredChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  class LearnAIEngine {
    constructor() {
      this.sound = new LearnSoundFX();
      this.topics = [];
      this.masteredIds = this.loadMastered();
      this.selectedCategory = 'ALL';
      this.selectedDifficulty = 'ALL';
      this.searchQuery = '';
      this.expandedCardIds = new Set();

      // DOM Elements
      this.topicsContainer = document.getElementById('topicsContainer');
      this.topicSearchInput = document.getElementById('topicSearchInput');
      this.clearSearchBtn = document.getElementById('clearSearchBtn');
      this.categoryFilterContainer = document.getElementById('categoryFilterContainer');
      this.progressStatsText = document.getElementById('progressStatsText');
      this.progressBarFill = document.getElementById('progressBarFill');
      this.emptyTopicsState = document.getElementById('emptyTopicsState');
      this.resetFiltersBtn = document.getElementById('resetFiltersBtn');
      this.soundToggleBtn = document.getElementById('soundToggleBtn');
      this.soundIcon = document.getElementById('soundIcon');
      this.toastContainer = document.getElementById('toastContainer');

      this.init();
    }

    async init() {
      this.updateSoundIcon();
      this.setupEventListeners();
      await this.loadTopics();
      this.renderCategoryFilters();
      this.renderTopics();
      this.updateMasteryProgress();
    }

    loadMastered() {
      try {
        const stored = localStorage.getItem('techpulse_mastered_topics_v1');
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch (e) {
        return new Set();
      }
    }

    saveMastered() {
      try {
        localStorage.setItem('techpulse_mastered_topics_v1', JSON.stringify([...this.masteredIds]));
      } catch (e) {
        console.error('Failed to save mastered status', e);
      }
      this.updateMasteryProgress();
    }

    updateMasteryProgress() {
      const total = this.topics.length || 50;
      const count = this.masteredIds.size;
      const pct = Math.round((count / total) * 100);

      if (this.progressStatsText) {
        this.progressStatsText.textContent = `${count} / ${total} Topics Mastered (${pct}%)`;
      }
      if (this.progressBarFill) {
        this.progressBarFill.style.width = `${pct}%`;
      }
    }

    async loadTopics() {
      try {
        const resp = await fetch('data/learn_topics.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          this.topics = data;
          console.log(`[Learn AI] Loaded ${data.length} topics.`);
          return;
        }
      } catch (err) {
        console.warn('[Learn AI] Could not fetch data/learn_topics.json directly:', err);
      }
    }

    renderCategoryFilters() {
      const categories = ['ALL'];
      this.topics.forEach(t => {
        if (t.category && !categories.includes(t.category)) {
          categories.push(t.category);
        }
      });

      this.categoryFilterContainer.innerHTML = categories.map(cat => {
        const count = cat === 'ALL'
          ? this.topics.length
          : this.topics.filter(t => t.category === cat).length;
        const activeClass = this.selectedCategory === cat ? 'active' : '';
        return `<button class="cat-pill-btn ${activeClass}" data-category="${cat}">${cat} (${count})</button>`;
      }).join('');

      this.categoryFilterContainer.querySelectorAll('.cat-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedCategory = btn.dataset.category;
          this.renderCategoryFilters();
          this.renderTopics();
          this.sound.playClick();
        });
      });
    }

    filterTopics() {
      return this.topics.filter(t => {
        // Category filter
        if (this.selectedCategory !== 'ALL' && t.category !== this.selectedCategory) {
          return false;
        }

        // Difficulty filter
        if (this.selectedDifficulty !== 'ALL' && t.difficulty !== this.selectedDifficulty) {
          return false;
        }

        // Search query
        if (this.searchQuery.trim()) {
          const q = this.searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchSummary = (t.summary || '').toLowerCase().includes(q);
          const matchExplainer = (t.plainEnglishExplainer || '').toLowerCase().includes(q);
          const matchTech = (t.technicalBreakdown || '').toLowerCase().includes(q);
          const matchCode = (t.codeExample || '').toLowerCase().includes(q);
          const matchTakeaway = (t.keyTakeaway || '').toLowerCase().includes(q);

          if (!matchTitle && !matchSummary && !matchExplainer && !matchTech && !matchCode && !matchTakeaway) {
            return false;
          }
        }

        return true;
      });
    }

    renderTopics() {
      const filtered = this.filterTopics();

      if (filtered.length === 0) {
        this.topicsContainer.innerHTML = '';
        this.emptyTopicsState.classList.remove('hidden');
        return;
      }

      this.emptyTopicsState.classList.add('hidden');

      this.topicsContainer.innerHTML = filtered.map(t => {
        const isMastered = this.masteredIds.has(t.id);
        const isExpanded = this.expandedCardIds.has(t.id);
        const padNumber = String(t.number).padStart(2, '0');
        const catColor = t.categoryColor || '#3b82f6';

        return `
          <article class="topic-card ${isMastered ? 'mastered' : ''}" data-id="${t.id}">
            <div class="topic-header-row">
              <div class="topic-header-left">
                <span class="topic-num-badge">#${padNumber}</span>
                <span class="topic-cat-badge" style="color: ${catColor}; border: 1px solid ${catColor}40;">${t.category}</span>
                <span class="topic-diff-badge diff-${t.difficulty}">${t.difficulty}</span>
              </div>
              <button class="mastered-checkbox-btn ${isMastered ? 'checked' : ''}" data-action="toggle-mastery" data-id="${t.id}" title="Mark as Mastered">
                <span>${isMastered ? '✓ Mastered' : '○ Mark Mastered'}</span>
              </button>
            </div>

            <h2 class="topic-title">${t.title}</h2>
            <p class="topic-summary">${t.summary}</p>

            <div class="topic-accordion">
              <button class="accordion-toggle-btn ${isExpanded ? 'open' : ''}" data-action="toggle-accordion" data-id="${t.id}">
                <span>${isExpanded ? 'Hide Deep Dive & Code' : '📖 View Analogy, Math & Code Example'}</span>
                <span class="arrow-icon">▼</span>
              </button>

              ${isExpanded ? `
                <div class="topic-details-body">
                  <!-- Analogy -->
                  <div class="detail-section analogy-box">
                    <div class="detail-sec-title">💡 Plain-English Analogy</div>
                    <p class="detail-sec-text">${t.plainEnglishExplainer}</p>
                  </div>

                  <!-- Technical Breakdown -->
                  <div class="detail-section math-box">
                    <div class="detail-sec-title">⚙️ Architecture & Technical Formulation</div>
                    <p class="detail-sec-text">${t.technicalBreakdown}</p>
                  </div>

                  <!-- Code Example -->
                  ${t.codeExample ? `
                    <div class="code-snippet-box">
                      <div class="code-snippet-header">
                        <span class="code-lang-label">Python / Implementation</span>
                        <button class="copy-code-btn" data-action="copy-code" data-id="${t.id}">📋 Copy Code</button>
                      </div>
                      <pre class="code-pre"><code>${this.escapeHtml(t.codeExample)}</code></pre>
                    </div>
                  ` : ''}

                  <!-- Key Takeaway -->
                  <div class="takeaway-banner">
                    <span>🎯 Key Takeaway: </span>${t.keyTakeaway}
                  </div>
                </div>
              ` : ''}
            </div>
          </article>
        `;
      }).join('');

      this.attachTopicEventListeners();
    }

    escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    attachTopicEventListeners() {
      // Toggle Mastery
      this.topicsContainer.querySelectorAll('[data-action="toggle-mastery"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          if (this.masteredIds.has(id)) {
            this.masteredIds.delete(id);
            this.showToast('Unmarked topic');
          } else {
            this.masteredIds.add(id);
            this.sound.playMasteredChime();
            this.showToast('🎉 Topic Mastered! Keep it up!');
          }
          this.saveMastered();
          this.renderTopics();
        });
      });

      // Toggle Accordion Details
      this.topicsContainer.querySelectorAll('[data-action="toggle-accordion"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (this.expandedCardIds.has(id)) {
            this.expandedCardIds.delete(id);
          } else {
            this.expandedCardIds.add(id);
            this.sound.playClick();
          }
          this.renderTopics();
        });
      });

      // Copy Code Button
      this.topicsContainer.querySelectorAll('[data-action="copy-code"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const topic = this.topics.find(t => t.id === id);
          if (topic && topic.codeExample) {
            navigator.clipboard.writeText(topic.codeExample).then(() => {
              this.showToast('📋 Code copied to clipboard!');
            }).catch(() => {
              this.showToast('Failed to copy code');
            });
          }
        });
      });
    }

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

    updateSoundIcon() {
      if (this.soundIcon) {
        this.soundIcon.textContent = this.sound.enabled ? '🔊' : '🔇';
      }
    }

    setupEventListeners() {
      // Search
      this.topicSearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.clearSearchBtn.classList.toggle('hidden', !this.searchQuery);
        this.renderTopics();
      });

      this.clearSearchBtn.addEventListener('click', () => {
        this.topicSearchInput.value = '';
        this.searchQuery = '';
        this.clearSearchBtn.classList.add('hidden');
        this.renderTopics();
      });

      // Difficulty buttons
      document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedDifficulty = btn.dataset.diff;
          this.renderTopics();
          this.sound.playClick();
        });
      });

      // Reset filters button
      this.resetFiltersBtn.addEventListener('click', () => {
        this.topicSearchInput.value = '';
        this.searchQuery = '';
        this.clearSearchBtn.classList.add('hidden');
        this.selectedCategory = 'ALL';
        this.selectedDifficulty = 'ALL';
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === 'ALL'));
        this.renderCategoryFilters();
        this.renderTopics();
      });

      // Sound toggle
      this.soundToggleBtn.addEventListener('click', () => {
        const isNowOn = this.sound.toggle();
        this.updateSoundIcon();
        this.showToast(isNowOn ? 'Sound FX On 🔊' : 'Sound FX Muted 🔇');
        if (isNowOn) this.sound.playMasteredChime();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LearnAIEngine());
  } else {
    new LearnAIEngine();
  }
})();
