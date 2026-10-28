/**
 * TechPulse - Learn AI Curriculum Engine
 * Powers 50 topics, Interactive Simulators, Career Roadmaps, Daily Micro-Quiz, and User Sessions.
 */

(function () {
  'use strict';

  class LearnAIEngine {
    constructor() {
      this.topics = [];
      this.selectedCategory = 'ALL';
      this.selectedDifficulty = 'ALL';
      this.selectedPath = 'ALL';
      this.searchQuery = '';
      this.expandedCardIds = new Set();
      this.audioEnabled = localStorage.getItem('techpulse_sound_v1') !== 'false';

      // Quiz State
      this.quizQuestions = [];
      this.currentQuizIndex = 0;
      this.quizScore = 0;

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
      this.openQuizBtn = document.getElementById('openQuizBtn');
      this.streakCountText = document.getElementById('streakCountText');
      this.userProfileBtn = document.getElementById('userProfileBtn');
      this.headerUsernameText = document.getElementById('headerUsernameText');
      this.pathBanner = document.getElementById('pathBanner');
      this.pathBannerTitle = document.getElementById('pathBannerTitle');
      this.pathBannerDesc = document.getElementById('pathBannerDesc');
      this.pathProgressPill = document.getElementById('pathProgressPill');

      // Modals & Drawers
      this.quizDialog = document.getElementById('quizDialog');
      this.closeQuizBtn = document.getElementById('closeQuizBtn');
      this.profileDialog = document.getElementById('profileDialog');
      this.closeProfileBtn = document.getElementById('closeProfileBtn');
      this.hamburgerBtn = document.getElementById('hamburgerBtn');
      this.hamburgerDrawer = document.getElementById('hamburgerDrawer');
      this.menuOverlay = document.getElementById('menuOverlay');
      this.closeMenuBtn = document.getElementById('closeMenuBtn');
      this.menuQuizBtn = document.getElementById('menuQuizBtn');
      this.menuSyncBtn = document.getElementById('menuSyncBtn');

      this.init();
    }

    async init() {
      this.updateHeaderProfile();
      this.setupEventListeners();
      this.setupVisualizerLab();
      await this.loadTopics();
      this.checkUrlForTopicAnchor();
      this.renderCategoryFilters();
      this.renderTopics();
      this.updateMasteryProgress();
    }

    // --- Audio Synthesis ---
    playChime() {
      if (!this.audioEnabled) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.22);
      });
    }

    // --- Header & Profile State ---
    updateHeaderProfile() {
      if (!window.TechPulseSession) return;
      const username = window.TechPulseSession.getUsername();
      const streak = window.TechPulseSession.getStreak();

      if (this.headerUsernameText) {
        this.headerUsernameText.textContent = username;
      }
      if (this.streakCountText) {
        this.streakCountText.textContent = `${streak}-Day Streak`;
      }
      if (this.soundIcon) {
        this.soundIcon.textContent = this.audioEnabled ? '🔊' : '🔇';
      }
    }

    // --- Data Loading ---
    async loadTopics() {
      try {
        const resp = await fetch('data/learn_topics.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          this.topics = data;
          console.log(`[Learn AI] Loaded ${data.length} rich topics.`);
          return;
        }
      } catch (err) {
        console.warn('[Learn AI] Could not fetch data/learn_topics.json directly:', err);
      }
    }

    checkUrlForTopicAnchor() {
      const urlParams = new URLSearchParams(window.location.search);
      const targetTopic = urlParams.get('topic');
      if (targetTopic) {
        this.expandedCardIds.add(targetTopic);
        setTimeout(() => {
          const el = document.querySelector(`[data-id="${targetTopic}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.boxShadow = '0 0 25px rgba(6, 182, 212, 0.6)';
          }
        }, 300);
      }
    }

    updateMasteryProgress() {
      if (!window.TechPulseSession) return;
      const mastered = window.TechPulseSession.getMasteredTopics();
      const total = this.topics.length || 50;
      const count = mastered.size;
      const pct = Math.round((count / total) * 100);

      if (this.progressStatsText) {
        this.progressStatsText.textContent = `${count} / ${total} Topics Mastered (${pct}%)`;
      }
      if (this.progressBarFill) {
        this.progressBarFill.style.width = `${pct}%`;
      }
      this.updatePathBanner();
    }

    updatePathBanner() {
      if (this.selectedPath === 'ALL') {
        this.pathBanner.classList.add('hidden');
        return;
      }

      this.pathBanner.classList.remove('hidden');
      const mastered = window.TechPulseSession ? window.TechPulseSession.getMasteredTopics() : new Set();
      const pathTopics = this.topics.filter(t => t.paths && t.paths.includes(this.selectedPath));
      const masteredInPath = pathTopics.filter(t => mastered.has(t.id)).length;

      const pathMeta = {
        'llm-systems': {
          title: '🛣 LLM Systems Engineer Track',
          desc: 'High-throughput serving, KV caching, quantization (INT4/AWQ), FlashAttention, and distributed GPU parallelism.'
        },
        'agents-rag': {
          title: '🛣 AI Agent & RAG Architect Track',
          desc: 'Retrieval pipelines, dense/sparse hybrid search, ReAct loops, function calling, and sandbox execution.'
        },
        'alignment-reasoning': {
          title: '🛣 Alignment & Reasoning Researcher Track',
          desc: 'Post-training reinforcement learning (RLHF, DPO, GRPO), test-time compute, MCTS, and process reward models.'
        },
        'multimodal-robotics': {
          title: '🛣 Multimodal & Robotics Specialist Track',
          desc: 'Vision Transformers (ViT), Diffusion Transformers (DiT), CLIP embeddings, VLA policies, and neural audio codecs.'
        }
      };

      const meta = pathMeta[this.selectedPath] || { title: 'Career Track', desc: '' };
      this.pathBannerTitle.textContent = meta.title;
      this.pathBannerDesc.textContent = meta.desc;
      this.pathProgressPill.textContent = `${masteredInPath} / ${pathTopics.length} Mastered`;
    }

    // --- Filtering & Rendering ---
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
        });
      });
    }

    filterTopics() {
      return this.topics.filter(t => {
        // Path filter
        if (this.selectedPath !== 'ALL' && (!t.paths || !t.paths.includes(this.selectedPath))) {
          return false;
        }

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
      const mastered = window.TechPulseSession ? window.TechPulseSession.getMasteredTopics() : new Set();

      this.topicsContainer.innerHTML = filtered.map((t, idx) => {
        const isMastered = mastered.has(t.id);
        const isExpanded = this.expandedCardIds.has(t.id);
        const padNumber = String(t.number).padStart(2, '0');
        const catColor = t.categoryColor || '#3b82f6';
        const userNote = window.TechPulseSession ? window.TechPulseSession.getNote(t.id) : '';

        // Roadmap step tag if on a specific path
        const stepBadge = this.selectedPath !== 'ALL'
          ? `<span class="path-badge" style="background: rgba(6, 182, 212, 0.2); color: #38bdf8;">Step ${idx + 1}</span>`
          : '';

        // Generate Visual Architecture Flowchart for this topic
        const topicDiagram = (window.TechPulseDiagrams)
          ? window.TechPulseDiagrams.getTopicDiagram(t.id, t)
          : null;
        const flowchartHtml = (topicDiagram && window.TechPulseDiagrams)
          ? window.TechPulseDiagrams.renderFlowchartHTML(topicDiagram, { compact: false })
          : '';

        return `
          <article class="topic-card ${isMastered ? 'mastered' : ''}" data-id="${t.id}">
            <div class="topic-header-row">
              <div class="topic-header-left">
                <span class="topic-num-badge">#${padNumber}</span>
                ${stepBadge}
                <span class="topic-cat-badge" style="color: ${catColor}; border: 1px solid ${catColor}40;">${t.category}</span>
                <span class="topic-diff-badge diff-${t.difficulty}">${t.difficulty}</span>
              </div>
              <button class="mastered-checkbox-btn ${isMastered ? 'checked' : ''}" data-action="toggle-mastery" data-id="${t.id}" title="Mark as Mastered">
                <span>${isMastered ? '✓ Mastered' : '○ Mark Mastered'}</span>
              </button>
            </div>

            <h2 class="topic-title">${t.title}</h2>
            <p class="topic-summary">${t.summary}</p>

            <!-- News Cross-link Badge -->
            <div class="related-news-box">
              <a href="index.html" class="related-news-link" title="See real-world tech breakthrough applying this concept">
                <span>📰 In Today's News Deck: See real-world application</span>
                <span>↗</span>
              </a>
            </div>

            <div class="topic-accordion">
              <button class="accordion-toggle-btn ${isExpanded ? 'open' : ''}" data-action="toggle-accordion" data-id="${t.id}">
                <span>${isExpanded ? 'Hide Deep Dive, Flowchart & Code' : '📖 View Analogy, Architecture Flowchart & Code'}</span>
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

                  <!-- 📊 Interactive System Architecture Flowchart -->
                  ${flowchartHtml}

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

                  <!-- Personal Study Notes -->
                  <div class="topic-note-box">
                    <label class="topic-note-label">📝 My Private Study Notes (Auto-Saved):</label>
                    <textarea class="topic-note-textarea" data-id="${t.id}" placeholder="Type your personal interview notes, insights, or reminders here...">${this.escapeHtml(userNote)}</textarea>
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
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    attachTopicEventListeners() {
      // Toggle Mastery
      this.topicsContainer.querySelectorAll('[data-action="toggle-mastery"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          if (window.TechPulseSession) {
            const isNowMastered = window.TechPulseSession.toggleMasteredTopic(id);
            if (isNowMastered) {
              this.playChime();
              this.showToast('🎉 Topic Mastered! Keep leveling up!');
            } else {
              this.showToast('Unmarked topic');
            }
            this.renderTopics();
            this.updateMasteryProgress();
          }
        });
      });

      // Toggle Accordion
      this.topicsContainer.querySelectorAll('[data-action="toggle-accordion"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (this.expandedCardIds.has(id)) {
            this.expandedCardIds.delete(id);
          } else {
            this.expandedCardIds.add(id);
          }
          this.renderTopics();
        });
      });

      // Copy Code
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

      // Auto-save Personal Notes
      this.topicsContainer.querySelectorAll('.topic-note-textarea').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
          const id = textarea.dataset.id;
          if (window.TechPulseSession) {
            window.TechPulseSession.saveNote(id, e.target.value);
          }
        });
      });
    }

    // ==========================================================================
    // 🎛 Visualizer AI Lab Mechanics
    // ==========================================================================
    setupVisualizerLab() {
      // Tab Switching
      document.querySelectorAll('.lab-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.lab-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tabKey = btn.dataset.tab;

          document.getElementById('labSamplingTab').classList.toggle('hidden', tabKey !== 'sampling');
          document.getElementById('labAttentionTab').classList.toggle('hidden', tabKey !== 'attention');
          document.getElementById('labVectorsTab').classList.toggle('hidden', tabKey !== 'vectors');

          if (tabKey === 'vectors') {
            this.drawVectorCanvas();
          }
        });
      });

      // 1. Temperature & Sampling Simulator
      const tempSlider = document.getElementById('tempSlider');
      const topPSlider = document.getElementById('topPSlider');
      const tempValDisplay = document.getElementById('tempValDisplay');
      const topPValDisplay = document.getElementById('topPValDisplay');
      const sampleBtn = document.getElementById('sampleTokenBtn');

      const updateSamplingBars = () => {
        const temp = parseFloat(tempSlider.value);
        const topP = parseFloat(topPSlider.value);
        tempValDisplay.textContent = temp.toFixed(2);
        topPValDisplay.textContent = topP.toFixed(2);

        // Baseline logits for: "The capital of France is..."
        const tokens = [
          { name: '"Paris"', logit: 5.2, color: '#10b981' },
          { name: '"a"', logit: 2.8, color: '#3b82f6' },
          { name: '"the"', logit: 2.4, color: '#6366f1' },
          { name: '"known"', logit: 1.8, color: '#8b5cf6' },
          { name: '"located"', logit: 1.2, color: '#ec4899' },
          { name: '"an"', logit: 0.6, color: '#f59e0b' }
        ];

        // Softmax with temperature
        const scaled = tokens.map(t => Math.exp(t.logit / Math.max(0.01, temp)));
        const sumScaled = scaled.reduce((a, b) => a + b, 0);
        let probs = tokens.map((t, i) => ({ ...t, prob: scaled[i] / sumScaled }));

        // Sort descending for Top-P
        probs.sort((a, b) => b.prob - a.prob);

        let cumSum = 0;
        probs = probs.map(t => {
          const inNucleus = cumSum < topP;
          cumSum += t.prob;
          return { ...t, inNucleus: inNucleus };
        });

        // Render bars
        const container = document.getElementById('samplingBarsContainer');
        container.innerHTML = probs.map(t => {
          const pct = (t.prob * 100).toFixed(1);
          const opacity = t.inNucleus ? '1' : '0.25';
          return `
            <div class="sim-bar-item" style="opacity: ${opacity};">
              <span class="bar-token-name">${t.name}</span>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${pct}%; background: ${t.color};"></div>
              </div>
              <span class="bar-pct-val">${pct}%</span>
            </div>
          `;
        }).join('');

        this.currentSamplingDistribution = probs.filter(t => t.inNucleus);
      };

      tempSlider.addEventListener('input', updateSamplingBars);
      topPSlider.addEventListener('input', updateSamplingBars);
      updateSamplingBars();

      sampleBtn.addEventListener('click', () => {
        if (!this.currentSamplingDistribution || this.currentSamplingDistribution.length === 0) return;
        const total = this.currentSamplingDistribution.reduce((a, b) => a + b.prob, 0);
        let rand = Math.random() * total;
        let chosen = this.currentSamplingDistribution[0];

        for (let item of this.currentSamplingDistribution) {
          if (rand < item.prob) {
            chosen = item;
            break;
          }
          rand -= item.prob;
        }

        const resText = document.getElementById('sampleResultText');
        resText.textContent = `🎯 Sampled: ${chosen.name} (${(chosen.prob * 100).toFixed(1)}% prob)`;
        this.playChime();
      });

      // 2. Self-Attention Matrix Heatmap Simulator
      const renderAttentionMatrix = (sentence) => {
        const words = sentence.split(' ');
        const container = document.getElementById('attentionMatrixContainer');
        const explainBox = document.getElementById('attentionExplainBox');

        // Precompute attention affinities
        let html = '<table class="attention-matrix-table"><tr><th></th>';
        words.forEach(w => {
          html += `<th>${w}</th>`;
        });
        html += '</tr>';

        words.forEach((rowWord, rIdx) => {
          html += `<tr><th>${rowWord}</th>`;
          words.forEach((colWord, cIdx) => {
            // High attention on self, or semantically linked words (e.g. "it" -> "animal")
            let weight = 0.08;
            if (rowWord.toLowerCase() === 'it' && colWord.toLowerCase() === 'animal') weight = 0.68;
            else if (rowWord.toLowerCase() === 'it' && colWord.toLowerCase() === 'tired') weight = 0.22;
            else if (rowWord === colWord) weight = 0.45;
            else if (Math.abs(rIdx - cIdx) === 1) weight = 0.20;
            else weight = Math.max(0.04, 0.15 - Math.abs(rIdx - cIdx) * 0.02);

            const alpha = weight.toFixed(2);
            html += `<td class="attention-cell" data-row="${rowWord}" data-col="${colWord}" data-val="${(weight * 100).toFixed(0)}%" style="background: rgba(6, 182, 212, ${alpha});">${(weight * 100).toFixed(0)}%</td>`;
          });
          html += '</tr>';
        });
        html += '</table>';
        container.innerHTML = html;

        container.querySelectorAll('.attention-cell').forEach(cell => {
          cell.addEventListener('mouseenter', () => {
            const row = cell.dataset.row;
            const col = cell.dataset.col;
            const val = cell.dataset.val;
            explainBox.textContent = `🔍 Token "${row}" pays ${val} attention to token "${col}"`;
          });
        });
      };

      document.querySelectorAll('.preset-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.preset-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderAttentionMatrix(btn.dataset.sentence);
        });
      });
      renderAttentionMatrix('The animal didn\'t cross because it was tired');

      // 3. 2D Vector Math Canvas Simulator
      this.drawVectorCanvas = () => {
        const canvas = document.getElementById('vectorCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Draw Points
        const points = [
          { name: 'King', x: 140, y: 80, color: '#38bdf8' },
          { name: 'Man', x: 100, y: 220, color: '#6366f1' },
          { name: 'Woman', x: 260, y: 220, color: '#ec4899' },
          { name: 'Queen', x: 300, y: 80, color: '#10b981' },
          { name: 'Apple', x: 480, y: 230, color: '#f59e0b' },
          { name: 'Banana', x: 530, y: 190, color: '#eab308' }
        ];

        points.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 12px "JetBrains Mono"';
          ctx.fillText(p.name, p.x + 10, p.y + 4);
        });
      };

      document.getElementById('runKingQueenMathBtn').addEventListener('click', () => {
        const canvas = document.getElementById('vectorCanvas');
        const ctx = canvas.getContext('2d');
        const status = document.getElementById('vectorStatusText');

        this.drawVectorCanvas();

        // Animate vector arrow from King to Man, then Woman to Queen
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);

        // 1. King -> Man (Male gender vector)
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(140, 80);
        ctx.lineTo(100, 220);
        ctx.stroke();

        // 2. Woman -> Queen (Female parallel vector)
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(260, 220);
        ctx.lineTo(300, 80);
        ctx.stroke();

        ctx.setLineDash([]);
        status.textContent = '✅ Computed: Vector(King) - Vector(Man) + Vector(Woman) ≈ Vector(Queen)!';
        this.playChime();
      });

      document.getElementById('resetVectorCanvasBtn').addEventListener('click', () => {
        this.drawVectorCanvas();
        document.getElementById('vectorStatusText').textContent = 'Canvas reset to default 2D projection.';
      });
    }

    // ==========================================================================
    // 🏆 Daily 60-Second AI Micro-Quiz Engine
    // ==========================================================================
    startDailyQuiz() {
      if (!this.topics || this.topics.length === 0) return;

      // Pick 3 random topics with quizzes
      const shuffled = [...this.topics].sort(() => 0.5 - Math.random());
      this.quizQuestions = shuffled.slice(0, 3).map(t => t.quiz);
      this.currentQuizIndex = 0;
      this.quizScore = 0;

      document.getElementById('quizSummaryBox').classList.add('hidden');
      document.getElementById('quizQuestionBody').classList.remove('hidden');
      document.getElementById('quizFooter').classList.remove('hidden');

      this.renderCurrentQuizQuestion();
      this.quizDialog.showModal();
    }

    renderCurrentQuizQuestion() {
      const q = this.quizQuestions[this.currentQuizIndex];
      if (!q) return;

      document.getElementById('quizStepIndicator').textContent = `Question ${this.currentQuizIndex + 1} of 3`;
      document.getElementById('quizQuestionText').textContent = q.question;
      document.getElementById('quizFeedbackBox').classList.add('hidden');
      document.getElementById('quizNextBtn').classList.add('hidden');

      const optionsList = document.getElementById('quizOptionsList');
      // Shuffle options while tracking answer
      const indexedOptions = q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === q.answerIndex }));
      const shuffledOptions = indexedOptions.sort(() => 0.5 - Math.random());

      optionsList.innerHTML = shuffledOptions.map(opt => `
        <button class="quiz-opt-btn" data-correct="${opt.isCorrect}">${opt.text}</button>
      `).join('');

      optionsList.querySelectorAll('.quiz-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          // Disable all buttons
          optionsList.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
          const isCorrect = btn.dataset.correct === 'true';

          if (isCorrect) {
            btn.classList.add('correct');
            this.quizScore++;
            this.playChime();
            document.getElementById('feedbackStatus').textContent = '✅ Correct!';
            document.getElementById('feedbackStatus').style.color = '#34d399';
          } else {
            btn.classList.add('wrong');
            // Highlight correct one
            optionsList.querySelector('[data-correct="true"]').classList.add('correct');
            document.getElementById('feedbackStatus').textContent = '❌ Incorrect';
            document.getElementById('feedbackStatus').style.color = '#f87171';
          }

          document.getElementById('feedbackExplanation').textContent = q.explanation;
          document.getElementById('quizFeedbackBox').classList.remove('hidden');
          document.getElementById('quizNextBtn').classList.remove('hidden');
        });
      });
    }

    nextQuizQuestion() {
      this.currentQuizIndex++;
      if (this.currentQuizIndex < this.quizQuestions.length) {
        this.renderCurrentQuizQuestion();
      } else {
        // Finished Quiz!
        document.getElementById('quizQuestionBody').classList.add('hidden');
        document.getElementById('quizFooter').classList.add('hidden');
        document.getElementById('quizSummaryBox').classList.remove('hidden');
        document.getElementById('quizScoreSummary').textContent = `You scored ${this.quizScore} / 3 correct today!`;

        if (window.TechPulseSession) {
          window.TechPulseSession.recordQuizResult(this.quizScore, 3);
          this.updateHeaderProfile();
        }
      }
    }

    // ==========================================================================
    // 👤 Profile & Session Management
    // ==========================================================================
    openProfileModal() {
      if (!window.TechPulseSession) return;
      const user = window.TechPulseSession.currentUser;
      const isGuest = window.TechPulseSession.isGuest();

      document.getElementById('profileUsername').textContent = user.username === 'guest' ? 'Guest Explorer' : user.username;
      document.getElementById('pstatStreak').textContent = user.streak || 1;
      document.getElementById('pstatMastered').textContent = (user.masteredTopics || []).length;
      document.getElementById('pstatFavs').textContent = (user.favorites || []).length;

      document.getElementById('authLogoutBtn').classList.toggle('hidden', isGuest);

      this.profileDialog.showModal();
    }

    // Toast Notifications
    showToast(message) {
      if (!this.toastContainer) return;
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      this.toastContainer.appendChild(toast);
      setTimeout(() => { toast.remove(); }, 2500);
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
        });
      });

      // Career Path buttons
      document.querySelectorAll('.path-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.path-chip-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedPath = btn.dataset.path;
          this.updatePathBanner();
          this.renderTopics();
        });
      });

      // Reset filters
      this.resetFiltersBtn.addEventListener('click', () => {
        this.topicSearchInput.value = '';
        this.searchQuery = '';
        this.clearSearchBtn.classList.add('hidden');
        this.selectedCategory = 'ALL';
        this.selectedDifficulty = 'ALL';
        this.selectedPath = 'ALL';
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === 'ALL'));
        document.querySelectorAll('.path-chip-btn').forEach(b => b.classList.toggle('active', b.dataset.path === 'ALL'));
        this.renderCategoryFilters();
        this.updatePathBanner();
        this.renderTopics();
      });

      // Hamburger Menu Listeners
      const openMenu = () => {
        this.updateHeaderProfile();
        if (this.hamburgerDrawer && this.menuOverlay) {
          this.hamburgerDrawer.classList.add('open');
          this.menuOverlay.classList.add('active');
        }
      };
      const closeMenu = () => {
        if (this.hamburgerDrawer && this.menuOverlay) {
          this.hamburgerDrawer.classList.remove('open');
          this.menuOverlay.classList.remove('active');
        }
      };

      if (this.hamburgerBtn) this.hamburgerBtn.addEventListener('click', openMenu);
      if (this.closeMenuBtn) this.closeMenuBtn.addEventListener('click', closeMenu);
      if (this.menuOverlay) this.menuOverlay.addEventListener('click', closeMenu);
      if (this.menuQuizBtn) {
        this.menuQuizBtn.addEventListener('click', () => {
          closeMenu();
          this.startDailyQuiz();
        });
      }
      if (this.menuSyncBtn) {
        this.menuSyncBtn.addEventListener('click', () => {
          closeMenu();
          this.openProfileModal();
        });
      }
      document.getElementById('menuSimulatorsLink')?.addEventListener('click', () => {
        closeMenu();
      });
      document.getElementById('menuRoadmapsLink')?.addEventListener('click', () => {
        closeMenu();
      });

      // Sound toggle
      this.soundToggleBtn.addEventListener('click', () => {
        this.audioEnabled = !this.audioEnabled;
        localStorage.setItem('techpulse_sound_v1', this.audioEnabled);
        this.updateHeaderProfile();
        const soundStatusText = document.getElementById('soundStatusText');
        if (soundStatusText) soundStatusText.textContent = this.audioEnabled ? 'ON' : 'OFF';
        this.showToast(this.audioEnabled ? 'Sound FX On 🔊' : 'Sound FX Muted 🔇');
        if (this.audioEnabled) this.playChime();
      });

      // Quiz Modal Open/Close
      this.openQuizBtn.addEventListener('click', () => this.startDailyQuiz());
      this.closeQuizBtn.addEventListener('click', () => this.quizDialog.close());
      document.getElementById('quizNextBtn').addEventListener('click', () => this.nextQuizQuestion());
      document.getElementById('finishQuizBtn').addEventListener('click', () => this.quizDialog.close());

      // Profile Modal Open/Close
      this.userProfileBtn.addEventListener('click', () => this.openProfileModal());
      this.closeProfileBtn.addEventListener('click', () => this.profileDialog.close());

      // Auth actions
      document.getElementById('authSubmitRegisterBtn').addEventListener('click', () => {
        const u = document.getElementById('authUsernameInput').value;
        const p = document.getElementById('authPasswordInput').value;
        const res = window.TechPulseSession.register(u, p);
        this.showToast(res.message);
        if (res.success) {
          this.updateHeaderProfile();
          this.renderTopics();
          this.profileDialog.close();
        }
      });

      document.getElementById('authSubmitLoginBtn').addEventListener('click', () => {
        const u = document.getElementById('authUsernameInput').value;
        const p = document.getElementById('authPasswordInput').value;
        const res = window.TechPulseSession.login(u, p);
        this.showToast(res.message);
        if (res.success) {
          this.updateHeaderProfile();
          this.renderTopics();
          this.profileDialog.close();
        }
      });

      document.getElementById('authLogoutBtn').addEventListener('click', () => {
        const res = window.TechPulseSession.logout();
        this.showToast(res.message);
        this.updateHeaderProfile();
        this.renderTopics();
        this.profileDialog.close();
      });

      // Sync Export / Import
      document.getElementById('exportProfileBtn').addEventListener('click', () => {
        const json = window.TechPulseSession.exportProfileJSON();
        navigator.clipboard.writeText(json).then(() => {
          this.showToast('📋 Copied Sync JSON! Paste into your phone browser.');
        }).catch(() => {
          this.showToast('Failed to copy to clipboard.');
        });
      });

      document.getElementById('importProfileBtn').addEventListener('click', () => {
        const pasted = prompt('Paste your TechPulse Sync JSON string:');
        if (pasted) {
          const res = window.TechPulseSession.importProfileJSON(pasted);
          this.showToast(res.message);
          if (res.success) {
            this.updateHeaderProfile();
            this.renderTopics();
            this.profileDialog.close();
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LearnAIEngine());
  } else {
    new LearnAIEngine();
  }
})();
