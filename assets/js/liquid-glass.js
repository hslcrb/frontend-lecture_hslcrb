/**
 * Liquid Glass Frontend Interaction Script
 * - 포인터를 추적하여 스펙큘러 광원(--lg-mx, --lg-my)을 부드럽게 이동
 * - 렌즈 모드 좌표 정합(--lg-x, --lg-y) 동기화
 * - prefers-reduced-motion 준수
 */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initGlassInteractions() {
    const glassElements = document.querySelectorAll('.lg, [data-glass]');
    if (!glassElements.length) return;

    glassElements.forEach((el) => {
      // sheen 레이어가 없으면 자동 삽입
      if (!el.querySelector('.lg__sheen') && el.classList.contains('lg')) {
        const sheen = document.createElement('div');
        sheen.className = 'lg__sheen';
        el.insertBefore(sheen, el.firstChild);
      }
      if (!el.querySelector('.lg__backdrop') && el.classList.contains('lg')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'lg__backdrop';
        el.insertBefore(backdrop, el.firstChild);
      }

      if (isReducedMotion) return;

      let rafId = 0;
      let targetX = 30;
      let targetY = 0;

      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        targetX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        targetY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            el.style.setProperty('--lg-mx', targetX.toFixed(1) + '%');
            el.style.setProperty('--lg-my', targetY.toFixed(1) + '%');
            rafId = 0;
          });
        }
      });

      el.addEventListener('pointerleave', () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        el.style.setProperty('--lg-mx', '30%');
        el.style.setProperty('--lg-my', '0%');
      });
    });

    // 렌즈 모드 요소가 있을 경우 화면 좌표 동기화
    const lensElements = document.querySelectorAll('.lg--lens');
    if (lensElements.length > 0) {
      let syncRaf = 0;
      const syncLenses = () => {
        if (syncRaf) return;
        syncRaf = requestAnimationFrame(() => {
          lensElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--lg-x', rect.left + 'px');
            el.style.setProperty('--lg-y', rect.top + 'px');
          });
          syncRaf = 0;
        });
      };
      syncLenses();
      window.addEventListener('scroll', syncLenses, { passive: true });
      window.addEventListener('resize', syncLenses);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlassInteractions);
  } else {
    initGlassInteractions();
  }
})();
