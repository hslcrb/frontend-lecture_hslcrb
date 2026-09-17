/**
 * Theme Engine - Automatic Theme Adjustment & Accessibility
 * Inspired by rheehoseTechportpolio_nextjs
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
    updateToggleIcons(isDark);
  }

  function updateToggleIcons(isDark) {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn, .floating-theme-toggle');
    toggleBtns.forEach(btn => {
      btn.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
      btn.innerHTML = isDark
        ? `<svg class="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
        : `<svg class="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    });
  }

  // 1. Instant execution to prevent FOUC
  const initialTheme = getSavedTheme() || getSystemTheme();
  applyTheme(initialTheme);

  // 2. DOM Ready Listeners
  document.addEventListener('DOMContentLoaded', () => {
    // If no header theme toggle exists (e.g. on lecture/quiz subpages), inject floating toggle
    if (!document.querySelector('.theme-toggle-btn') && !document.querySelector('.floating-theme-toggle')) {
      const floatingBtn = document.createElement('button');
      floatingBtn.className = 'floating-theme-toggle a11y-target';
      floatingBtn.type = 'button';
      floatingBtn.title = '테마 전환 (다크/라이트)';
      document.body.appendChild(floatingBtn);
    }

    // If no scroll progress bar exists, inject one
    if (!document.querySelector('.scroll-progress-bar')) {
      const prog = document.createElement('div');
      prog.className = 'scroll-progress-bar';
      prog.setAttribute('aria-hidden', 'true');
      document.body.appendChild(prog);
    }

    // Re-apply icons to all bound buttons
    applyTheme(getSavedTheme() || getSystemTheme());

    // Bind click events on all theme buttons (delegated or direct)
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.theme-toggle-btn, .floating-theme-toggle');
      if (target) {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(STORAGE_KEY, nextTheme);
        } catch (err) {}
        applyTheme(nextTheme);
      }
    });

    // 3. Auto System Theme Synchronization
    if (window.matchMedia) {
      const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      colorSchemeQuery.addEventListener('change', (e) => {
        if (!getSavedTheme()) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }

    // 4. Real-time Scroll Progress Bar
    function updateProgress() {
      const progressBar = document.querySelector('.scroll-progress-bar');
      if (!progressBar) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  });

  window.__setTheme = function(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    applyTheme(theme);
  };
})();
