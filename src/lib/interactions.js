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
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
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
