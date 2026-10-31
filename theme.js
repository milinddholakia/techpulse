/**
 * TechPulse Dynamic Theme Management System
 * Supports 7 curated color themes with instant zero-flash switching,
 * localStorage persistence, and interactive visual theme pickers.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'techpulse_active_theme_v1';
  const DEFAULT_THEME = 'midnight';

  const THEMES = [
    {
      id: 'midnight',
      name: 'Midnight Electric',
      subtitle: 'Obsidian deep space with electric cyan & indigo',
      colors: ['#07090e', '#6366f1', '#06b6d4'],
      icon: '🌌'
    },
    {
      id: 'cyberpunk',
      name: 'Neo Cyberpunk',
      subtitle: 'High-contrast violet with neon magenta & mint',
      colors: ['#080612', '#ec4899', '#00f5a0'],
      icon: '⚡️'
    },
    {
      id: 'sunset',
      name: 'Sunset Mirage',
      subtitle: 'Deep plum with radiant coral rose & warm gold',
      colors: ['#0e0708', '#f43f5e', '#f59e0b'],
      icon: '🌅'
    },
    {
      id: 'emerald',
      name: 'Nordic Aurora',
      subtitle: 'Deep forest with glowing emerald mint & arctic teal',
      colors: ['#040d0a', '#10b981', '#2dd4bf'],
      icon: '🌿'
    },
    {
      id: 'cobalt',
      name: 'Deep Cobalt',
      subtitle: 'Linear-style dark royal navy with ice blue',
      colors: ['#060b18', '#3b82f6', '#38bdf8'],
      icon: '🔷'
    },
    {
      id: 'obsidian',
      name: 'OLED Pure Black',
      subtitle: 'Pitch black with sleek monochrome titanium',
      colors: ['#000000', '#ffffff', '#94a3b8'],
      icon: '🪐'
    },
    {
      id: 'solar',
      name: 'Solar Daylight',
      subtitle: 'Crisp paper white with high-contrast slate & indigo',
      colors: ['#f8fafc', '#4f46e5', '#0284c7'],
      icon: '☀️'
    }
  ];

  // Immediately apply stored theme to prevent screen flash
  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    } catch (_) {
      return DEFAULT_THEME;
    }
  }

  function applyTheme(themeId) {
    const validTheme = THEMES.some(t => t.id === themeId) ? themeId : DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', validTheme);
    try {
      localStorage.setItem(STORAGE_KEY, validTheme);
    } catch (_) {}
    
    // Update any active theme UI elements
    updateThemeUI(validTheme);
    return validTheme;
  }

  // Initial immediate application
  const initialTheme = getStoredTheme();
  document.documentElement.setAttribute('data-theme', initialTheme);

  function renderThemeSelectorHTML(containerId = 'themePickerGrid') {
    const active = getStoredTheme();
    return THEMES.map(theme => {
      const isActive = theme.id === active;
      const swatchesHtml = theme.colors.map(c => `
        <span class="theme-swatch" style="background-color: ${c}"></span>
      `).join('');

      return `
        <button class="theme-card-option ${isActive ? 'active' : ''}" data-theme-id="${theme.id}" title="${theme.name}">
          <div class="theme-card-top">
            <span class="theme-icon">${theme.icon}</span>
            <div class="theme-swatches-group">
              ${swatchesHtml}
            </div>
            ${isActive ? '<span class="theme-active-tag">Active</span>' : ''}
          </div>
          <div class="theme-info">
            <h4 class="theme-name">${theme.name}</h4>
            <p class="theme-sub">${theme.subtitle}</p>
          </div>
        </button>
      `;
    }).join('');
  }

  function updateThemeUI(activeThemeId) {
    document.querySelectorAll('.theme-card-option').forEach(card => {
      const isThisTheme = card.dataset.themeId === activeThemeId;
      card.classList.toggle('active', isThisTheme);
      const tag = card.querySelector('.theme-active-tag');
      if (isThisTheme && !tag) {
        const top = card.querySelector('.theme-card-top');
        if (top) {
          const newTag = document.createElement('span');
          newTag.className = 'theme-active-tag';
          newTag.textContent = 'Active';
          top.appendChild(newTag);
        }
      } else if (!isThisTheme && tag) {
        tag.remove();
      }
    });

    // Update theme pill label in header / drawer if present
    const activeObj = THEMES.find(t => t.id === activeThemeId) || THEMES[0];
    const themeLabel = document.getElementById('currentThemeLabel');
    if (themeLabel) {
      themeLabel.textContent = `${activeObj.icon} ${activeObj.name}`;
    }
  }

  function initThemeListeners(onThemeChangeCallback) {
    document.querySelectorAll('[data-theme-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTheme = btn.dataset.themeId;
        if (targetTheme) {
          applyTheme(targetTheme);
          if (typeof onThemeChangeCallback === 'function') {
            const themeObj = THEMES.find(t => t.id === targetTheme);
            onThemeChangeCallback(themeObj);
          }
        }
      });
    });
  }

  window.TechPulseTheme = {
    themes: THEMES,
    getActiveTheme: getStoredTheme,
    setTheme: applyTheme,
    renderSelectorHTML: renderThemeSelectorHTML,
    initListeners: initThemeListeners,
    updateUI: updateThemeUI
  };

})(window);
