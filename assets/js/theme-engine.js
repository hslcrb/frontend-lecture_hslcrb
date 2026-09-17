/**
 * Theme Engine - Minimalist System Theme Synchronization
 * Pretendard | Automatic Dark/Light Detection | LocalStorage
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'frontend_lecture_theme';

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    updateToggleButtons(isDark);
  }

  function updateToggleButtons(isDark) {
    const btns = document.querySelectorAll('.theme-toggle, .floating-theme-toggle');
    btns.forEach(btn => {
      btn.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
      btn.setAttribute('title', isDark ? '라이트 모드' : '다크 모드');
      btn.innerHTML = isDark
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    });
  }

  // 1. Immediate theme execution to prevent flash
  const initialTheme = getSavedTheme() || getSystemTheme();
  applyTheme(initialTheme);

  // 2. DOM Ready Listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Inject floating button only on subpages (when no header toggle exists)
    if (!document.querySelector('.theme-toggle') && !document.querySelector('.floating-theme-toggle')) {
      const floatBtn = document.createElement('button');
      floatBtn.className = 'floating-theme-toggle';
      floatBtn.type = 'button';
      document.body.appendChild(floatBtn);
    }

    applyTheme(getSavedTheme() || getSystemTheme());

    // Toggle event listener
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-toggle, .floating-theme-toggle');
      if (btn) {
        const isDark = document.documentElement.classList.contains('dark');
        const nextTheme = isDark ? 'light' : 'dark';
        try {
          localStorage.setItem(STORAGE_KEY, nextTheme);
        } catch (err) {}
        applyTheme(nextTheme);
      }
    });

    // OS preference change listener
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!getSavedTheme()) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  });

  window.__setTheme = function(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    applyTheme(theme);
  };
})();
