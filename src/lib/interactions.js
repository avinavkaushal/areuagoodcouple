/**
 * Global, delegated interaction engine for the liquid-glass UI.
 *
 * Clean, efficient, and lightweight:
 *  - Scroll parallax: sets --scroll (0..1 page progress) on <html> for ambient orbs.
 *  - Reveal: adds `.is-visible` to `[data-reveal]` elements entering the viewport.
 *  - Refraction: flags Chromium so SVG backdrop refraction can be enabled.
 */

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function checkAmbientBarrier(
  win = typeof window !== 'undefined' ? window : null,
  doc = typeof document !== 'undefined' ? document : null
) {
  if (!win || !doc) return false;

  const unifiedEl = doc.getElementById('unified');
  const milestonesEl = doc.getElementById('milestones');
  const exportGuideEl = doc.getElementById('export-guide');

  // Results screen: trigger when scrolled halfway through Unified or almost reaching Milestones
  if (unifiedEl || milestonesEl) {
    if (unifiedEl) {
      const uRect = unifiedEl.getBoundingClientRect();
      // Halfway through Unified: midpoint reached/passed viewport center or top scrolled into 2nd half
      const halfwayUnified =
        uRect.top + uRect.height * 0.5 <= win.innerHeight * 0.5 ||
        uRect.top <= -(uRect.height * 0.35);
      if (halfwayUnified) return true;
    }
    if (milestonesEl) {
      const mRect = milestonesEl.getBoundingClientRect();
      // Almost reaching Milestones: milestone top is close to entering or within viewport
      const nearMilestones = mRect.top <= win.innerHeight + 150;
      if (nearMilestones) return true;
    }
    return false;
  }

  // Landing screen fallback: fade in when scrolled past hero towards export guide/FAQ
  if (exportGuideEl) {
    const egRect = exportGuideEl.getBoundingClientRect();
    return egRect.top <= win.innerHeight * 0.85 || (win.scrollY || 0) > 250;
  }

  // Generic fallback if neither story nor landing is mounted
  return (win.scrollY || 0) > 300;
}

function setupScrollProgress() {
  let frame = 0;
  let ambientEl = null;

  const update = () => {
    frame = 0;
    if (!ambientEl) {
      ambientEl = document.querySelector('.ambient');
    }
    if (!ambientEl) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = (window.scrollY / max).toFixed(4);
    ambientEl.style.setProperty('--scroll', progress);

    const isVisible = checkAmbientBarrier();
    ambientEl.classList.toggle('is-visible', isVisible);
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  let mo = null;
  if ('MutationObserver' in window && document.body) {
    mo = new MutationObserver(() => onScroll());
    mo.observe(document.body, { childList: true, subtree: true });
  }

  update();
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (mo) mo.disconnect();
    if (frame) cancelAnimationFrame(frame);
  };
}

function setupReveal() {
  const root = document.documentElement;
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  const observeAll = (scope) => {
    scope.querySelectorAll?.('[data-reveal]:not(.is-visible)').forEach((el) => io.observe(el));
  };

  observeAll(document);
  root.classList.add('reveal-ready');

  // Pick up sections that mount later (after upload, platform switch, etc.)
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('[data-reveal]')) io.observe(node);
        observeAll(node);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
    root.classList.remove('reveal-ready');
  };
}

function setupRefractionFlag() {
  const brands = navigator.userAgentData?.brands || [];
  const isChromium = brands.some((b) => /Chromium/i.test(b.brand));
  if (isChromium) document.documentElement.classList.add('supports-refraction');
}

/** Install all global interactions. Returns a cleanup function. */
export function installInteractions() {
  if (typeof window === 'undefined') return () => {};
  setupRefractionFlag();
  const cleanups = [setupScrollProgress(), setupReveal()];

  return () => {
    cleanups.forEach((fn) => fn && fn());
  };
}
