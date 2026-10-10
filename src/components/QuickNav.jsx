import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import gsap from 'gsap';

const NAV_ITEMS = [
  { id: 'unified', label: 'Unified', icon: '🌐' },
  { id: 'milestones', label: 'Milestones', icon: '🏆' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'reels', label: 'Reels', icon: '🎬' },
  { id: 'media-breakdown', label: 'Media', icon: '📸' },
  { id: 'activity', label: 'Activity', icon: '⏰' },
  { id: 'initiator', label: 'Initiator', icon: '☀️' },
  { id: 'response-time', label: 'Response Time', icon: '💬' },
  { id: 'love-words', label: 'Love Words', icon: '💖' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'emoji', label: 'Emoji', icon: '😍' },
  { id: 'reactions', label: 'Reactions', icon: '❤️' },
  { id: 'word-cloud', label: 'Word Cloud', icon: '☁️' },
  { id: 'memories', label: 'Memories', icon: '📖' },
  { id: 'streaks', label: 'Streaks', icon: '🔥' },
  { id: 'longest-message', label: 'Longest', icon: '📜' },
];

// Inset-only shadows: nothing paints outside pill, so nothing leaks past nav edge.
// Same structure in both so GSAP can interpolate.
const PILL_SHADOW_REST =
  'inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -7px 12px -6px rgba(255, 133, 187, 0.30)';
const PILL_SHADOW_LIFT =
  'inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 -9px 14px -6px rgba(255, 133, 187, 0.55)';

// Max side growth of lifted pill (px). Must stay below rail horizontal padding (px-1 = 4px).
const MAX_SIDE_GROW = 3.5;
const LIFT_SCALE_Y = 1.06;

function isReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Horizontal scale cap so lifted/stretched pill never grows past rail padding
function getScaleXCap(width) {
  return 1 + (MAX_SIDE_GROW * 2) / Math.max(width, 1);
}

function QuickNav({ messages, onOpenSettings }) {
  const [activeId, setActiveId] = useState('milestones');
  const [highlightedId, setHighlightedId] = useState('milestones');
  const [compact, setCompact] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const closeMenuTimeoutRef = useRef(null);
  const menuSheetRef = useRef(null);
  const menuDragRef = useRef({
    isDragging: false,
    startY: 0,
    currentY: 0,
    lastY: 0,
    lastTime: 0,
    velocityY: 0,
    pointerId: null,
  });

  const openMenu = useCallback(() => {
    if (closeMenuTimeoutRef.current) {
      clearTimeout(closeMenuTimeoutRef.current);
      closeMenuTimeoutRef.current = null;
    }
    setIsMenuClosing(false);
    setIsMenuOpen(true);
  }, []);

  const closeMenu = useCallback((onClosed) => {
    if (isMenuClosing || !isMenuOpen) return;
    setIsMenuClosing(true);
    if (closeMenuTimeoutRef.current) {
      clearTimeout(closeMenuTimeoutRef.current);
    }
    closeMenuTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
      closeMenuTimeoutRef.current = null;
      if (typeof onClosed === 'function') {
        onClosed();
      }
    }, 240);
  }, [isMenuClosing, isMenuOpen]);

  useEffect(() => {
    return () => {
      if (closeMenuTimeoutRef.current) {
        clearTimeout(closeMenuTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    if (menuSheetRef.current) {
      gsap.set(menuSheetRef.current, { y: 0, opacity: 1 });
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, closeMenu]);

  const handleMenuPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (isMenuClosing) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    if (menuSheetRef.current) {
      gsap.killTweensOf(menuSheetRef.current);
    }

    menuDragRef.current = {
      isDragging: true,
      startY: e.clientY,
      currentY: 0,
      lastY: e.clientY,
      lastTime: performance.now(),
      velocityY: 0,
      pointerId: e.pointerId,
    };
  };

  const handleMenuPointerMove = (e) => {
    const drag = menuDragRef.current;
    if (!drag.isDragging || drag.pointerId !== e.pointerId) return;

    const deltaY = e.clientY - drag.startY;
    const effectiveY = deltaY < 0 ? deltaY * 0.25 : deltaY;

    const now = performance.now();
    const dt = now - drag.lastTime;
    if (dt > 0) {
      const vy = (e.clientY - drag.lastY) / (dt / 1000);
      drag.velocityY = drag.velocityY * 0.4 + vy * 0.6;
    }
    drag.lastY = e.clientY;
    drag.lastTime = now;
    drag.currentY = effectiveY;

    if (menuSheetRef.current) {
      gsap.set(menuSheetRef.current, { y: effectiveY });
    }
  };

  const handleMenuPointerUp = (e) => {
    const drag = menuDragRef.current;
    if (!drag.isDragging || drag.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    drag.isDragging = false;
    const sheet = menuSheetRef.current;
    if (!sheet) return;

    const shouldDismiss =
      drag.currentY > 75 || (drag.currentY > 25 && drag.velocityY > 400);

    if (shouldDismiss) {
      const sheetHeight = sheet.offsetHeight || 320;
      setIsMenuClosing(true);
      gsap.to(sheet, {
        y: sheetHeight + 40,
        opacity: 0,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => {
          setIsMenuOpen(false);
          setIsMenuClosing(false);
          gsap.set(sheet, { y: 0, opacity: 1 });
        },
      });
    } else {
      gsap.to(sheet, {
        y: 0,
        duration: 0.35,
        ease: 'power3.out',
      });
    }
  };

  const handleMenuPointerCancel = (e) => {
    const drag = menuDragRef.current;
    if (!drag.isDragging || drag.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    drag.isDragging = false;
    if (menuSheetRef.current) {
      gsap.to(menuSheetRef.current, {
        y: 0,
        duration: 0.3,
        ease: 'power3.out',
      });
    }
  };

  const navRootRef = useRef(null);
  const navContainerRef = useRef(null);
  const pillRef = useRef(null);
  const itemRefs = useRef({});
  const itemsMetaRef = useRef([]);

  const activeIdRef = useRef('milestones');
  const highlightedIdRef = useRef('milestones');

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    highlightedIdRef.current = highlightedId;
  }, [highlightedId]);

  // Scroll lock state.
  // isProgrammaticScrolling: true while page auto-scrolls after click/snap.
  // holdTargetRef: after scroll settles, spy stays quiet until user scrolls on their own.
  const isProgrammaticScrolling = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const holdTargetRef = useRef(null);
  const holdYRef = useRef(0);
  const lockRafRef = useRef(0);

  const dragStateRef = useRef({
    isDragging: false,
    pointerId: null,
    startX: 0,
    startPillX: 0,
    currentX: 0,
    currentPillWidth: 0,
    startScrollLeft: 0,
    hasMoved: false,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
    sourceId: null,
    captureEl: null,
  });

  // Filter NAV_ITEMS so features without data don't clutter nav
  const navItems = useMemo(() => {
    const hasReels = (messages || []).some((m) => m?.type === 'reel_share');

    const hasMedia = (messages || []).some(
      (m) =>
        m?.type === 'photo' ||
        m?.type === 'video' ||
        m?.type === 'story_reply' ||
        (Array.isArray(m?.meta?.photos) && m.meta.photos.length > 0) ||
        (Array.isArray(m?.meta?.videos) && m.meta.videos.length > 0)
    );

    const hasReactions = (messages || []).some(
      (m) =>
        (m?.reactions && m.reactions.length > 0) ||
        (m?.meta?.reactions && m.meta.reactions.length > 0)
    );

    return NAV_ITEMS.filter((item) => {
      if (item.id === 'reels' && !hasReels) return false;
      if (item.id === 'media-breakdown' && !hasMedia) return false;
      if (item.id === 'reactions' && !hasReactions) return false;
      return true;
    });
  }, [messages]);

  // Keep rail scrolled so active pill is visible
  const ensurePillVisibleInRail = useCallback((itemMeta, behavior = 'smooth') => {
    const container = navContainerRef.current;
    if (!container || !itemMeta) return;

    const btnLeft = itemMeta.left;
    const btnRight = btnLeft + itemMeta.width;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    if (btnLeft < scrollLeft + 36 || btnRight > scrollLeft + clientWidth - 36) {
      const targetScroll = btnLeft - clientWidth / 2 + itemMeta.width / 2;
      container.scrollTo({ left: Math.max(0, targetScroll), behavior });
    }
  }, []);

  // Measure item rects and update cached snap points
  const measureItems = useCallback(() => {
    const container = navContainerRef.current;
    if (!container) return;

    const metas = [];
    for (const item of navItems) {
      const el = itemRefs.current[item.id];
      if (el) {
        const left = el.offsetLeft;
        const width = el.offsetWidth;
        metas.push({
          id: item.id,
          left,
          width,
          center: left + width / 2,
        });
      }
    }

    itemsMetaRef.current = metas;

    // Reposition pill immediately without animation on resize / measurement
    const currentMeta =
      metas.find((m) => m.id === activeIdRef.current) || metas[0];
    if (currentMeta && pillRef.current && !dragStateRef.current.isDragging && !gsap.isTweening(pillRef.current)) {
      gsap.set(pillRef.current, {
        x: currentMeta.left,
        width: currentMeta.width,
        yPercent: -50,
        scaleX: 1,
        scaleY: 1,
        transformOrigin: '50% 50%',
        opacity: 1,
      });
      dragStateRef.current.currentX = currentMeta.left;
      dragStateRef.current.currentPillWidth = currentMeta.width;
    }
  }, [navItems]);

  // Handle ResizeObserver, fonts ready, and window resize
  useLayoutEffect(() => {
    measureItems();

    const container = navContainerRef.current;
    if (!container) return;

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        measureItems();
      });
      ro.observe(container);
      for (const item of navItems) {
        const el = itemRefs.current[item.id];
        if (el) ro.observe(el);
      }
    }

    const onResize = () => measureItems();
    window.addEventListener('resize', onResize);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        measureItems();
      });
    }

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [measureItems, navItems]);

  // ---- Scroll lock helpers -------------------------------------------------

  const cancelLock = useCallback(() => {
    if (lockRafRef.current) {
      cancelAnimationFrame(lockRafRef.current);
      lockRafRef.current = 0;
    }
    isProgrammaticScrolling.current = false;
  }, []);

  // Programmatic smooth scroll. Lock released only when scroll position stops
  // changing (poll in rAF), not on a fixed timer. Long jumps take > 850ms, a fixed
  // timer released lock mid-scroll and spy flashed an in-between section.
  const scrollToSection = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;

      cancelLock();
      isProgrammaticScrolling.current = true;
      holdTargetRef.current = id;

      const start = performance.now();
      let lastY = window.scrollY;
      let stableSince = start;

      const tick = (now) => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 0.5) {
          lastY = y;
          stableSince = now;
        }
        const settled = now - start > 80 && now - stableSince > 160;
        if (settled || now - start > 4000) {
          lockRafRef.current = 0;
          holdYRef.current = window.scrollY;
          // Spy stays off until user scrolls on their own (see spy effect)
          isProgrammaticScrolling.current = false;
          return;
        }
        lockRafRef.current = requestAnimationFrame(tick);
      };
      lockRafRef.current = requestAnimationFrame(tick);

      const onScrollEnd = () => {
        window.removeEventListener('scrollend', onScrollEnd);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
        isProgrammaticScrolling.current = false;
      };
      window.addEventListener('scrollend', onScrollEnd, { once: true });
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(onScrollEnd, 1000);

      const reduced = isReducedMotion();
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    },
    [cancelLock]
  );

  // User takes over scroll (wheel / touch outside nav): drop lock + hold at once
  useEffect(() => {
    const onUserScroll = (e) => {
      const nav = navRootRef.current;
      if (nav && e.target instanceof Node && nav.contains(e.target)) return;
      cancelLock();
      holdTargetRef.current = null;
    };
    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
    };
  }, [cancelLock]);

  useEffect(() => cancelLock, [cancelLock]);

  // ---- Pill tween helpers --------------------------------------------------

  // Move pill: x/width use non-overshooting ease (never exits nav edge).
  // Spring feel lives on scale only.
  const tweenPillTo = useCallback((targetMeta, { spring = 'back', soft = false } = {}) => {
    const pill = pillRef.current;
    if (!targetMeta || !pill) return;

    const reduced = isReducedMotion();
    const moveDur = reduced ? 0.15 : soft ? 0.3 : 0.5;
    const moveEase = reduced ? 'power1.out' : soft ? 'power2.out' : 'expo.out';
    const scaleDur = reduced ? 0.15 : spring === 'elastic' ? 0.6 : 0.4;
    const scaleEase = reduced
      ? 'power1.out'
      : spring === 'elastic'
      ? 'elastic.out(1, 0.7)'
      : 'back.out(1.4)';

    gsap.to(pill, {
      x: targetMeta.left,
      width: targetMeta.width,
      duration: moveDur,
      ease: moveEase,
      overwrite: 'auto',
    });
    if (!soft) {
      gsap.to(pill, {
        scaleX: 1,
        scaleY: 1,
        boxShadow: PILL_SHADOW_REST,
        filter: 'brightness(1)',
        duration: scaleDur,
        ease: scaleEase,
        overwrite: 'auto',
      });
    }

    dragStateRef.current.currentX = targetMeta.left;
    dragStateRef.current.currentPillWidth = targetMeta.width;
  }, []);

  // Lift: grows pill slightly, capped so it stays inside rail
  const liftPill = useCallback(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const reduced = isReducedMotion();
    gsap.to(pill, {
      scaleX: reduced ? 1 : 1.10,
      scaleY: reduced ? 1 : 1.06,
      boxShadow: PILL_SHADOW_LIFT,
      filter: 'brightness(1.12)',
      duration: 0.15,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }, []);

  // Drop lift without moving
  const dropPill = useCallback(() => {
    const pill = pillRef.current;
    if (!pill) return;
    gsap.to(pill, {
      scaleX: 1,
      scaleY: 1,
      boxShadow: PILL_SHADOW_REST,
      filter: 'brightness(1)',
      duration: 0.2,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }, []);

  // Glide pill to target item (tap, keyboard, drag release)
  const glidePillTo = useCallback(
    (targetMeta, { spring = 'back', scroll = true } = {}) => {
      if (!targetMeta || !pillRef.current) return;

      tweenPillTo(targetMeta, { spring });

      setActiveId(targetMeta.id);
      setHighlightedId(targetMeta.id);
      activeIdRef.current = targetMeta.id;
      highlightedIdRef.current = targetMeta.id;

      ensurePillVisibleInRail(targetMeta);

      if (scroll) {
        scrollToSection(targetMeta.id);
      }
    },
    [tweenPillTo, ensurePillVisibleInRail, scrollToSection]
  );

  // ---- Scroll spy ----------------------------------------------------------

  useEffect(() => {
    let ticking = false;
    let lastY = window.scrollY;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        const delta = y - lastY;
        if (Math.abs(delta) > 20) {
          setCompact(delta > 0 && y > 280);
          lastY = y;
        }

        // Ignore spy while dragging or auto-scrolling
        if (isProgrammaticScrolling.current || dragStateRef.current.isDragging) {
          return;
        }

        // After a click-jump settles, trust the clicked target until user
        // scrolls on their own (> 40px away from settled position).
        if (holdTargetRef.current) {
          if (Math.abs(window.scrollY - holdYRef.current) > 40) {
            holdTargetRef.current = null;
          } else {
            return;
          }
        }

        const navOffset = window.innerHeight * 0.35;
        let currentId = null;
        for (let i = 0; i < navItems.length; i++) {
          const el = document.getElementById(navItems[i].id);
          if (el && el.getBoundingClientRect().top <= navOffset) {
            currentId = navItems[i].id;
          }
        }

        // Page bottom: last sections too short to reach spy line. Force last item.
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
        if (atBottom && navItems.length > 0 && window.scrollY > 0) {
          currentId = navItems[navItems.length - 1].id;
        }

        const targetId = currentId || (navItems[0] ? navItems[0].id : null);
        if (targetId && targetId !== activeIdRef.current) {
          setActiveId(targetId);
          setHighlightedId(targetId);
          activeIdRef.current = targetId;
          highlightedIdRef.current = targetId;

          const targetMeta = itemsMetaRef.current.find((m) => m.id === targetId);
          if (targetMeta && pillRef.current) {
            tweenPillTo(targetMeta, { soft: true });
            ensurePillVisibleInRail(targetMeta);
          }
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const pillNode = pillRef.current;
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (pillNode) gsap.killTweensOf(pillNode);
    };
  }, [navItems, ensurePillVisibleInRail, tweenPillTo]);

  // ---- Drag ----------------------------------------------------------------

  const handlePointerDown = (e, sourceId) => {
    // Only primary pointer (left mouse button or touch/pen)
    if (e.button !== undefined && e.button !== 0) return;

    const metas = itemsMetaRef.current;
    if (metas.length === 0) return;

    const pill = pillRef.current;
    const currentMeta =
      metas.find((m) => m.id === activeIdRef.current) || metas[0];
    const isPillOrActive =
      sourceId === 'pill' || sourceId === activeIdRef.current;

    // Read live pill position (pill may be mid-glide), freeze x/width tweens
    let currentPillX = dragStateRef.current.currentX || currentMeta.left;
    let currentPillWidth =
      dragStateRef.current.currentPillWidth || currentMeta.width;
    if (pill) {
      currentPillX = Number(gsap.getProperty(pill, 'x')) || currentPillX;
      currentPillWidth = Number(gsap.getProperty(pill, 'width')) || currentPillWidth;
      gsap.killTweensOf(pill, 'x,width');
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Graceful fallback
    }

    dragStateRef.current = {
      isDragging: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startPillX: currentPillX,
      currentX: currentPillX,
      currentPillWidth,
      startScrollLeft: navContainerRef.current?.scrollLeft || 0,
      hasMoved: false,
      velocity: 0,
      lastX: e.clientX,
      lastTime: performance.now(),
      sourceId,
      captureEl: e.currentTarget,
    };

    // Starting on active pill or item: lift immediately
    if (isPillOrActive) liftPill();
  };

  const handlePointerMove = (e) => {
    const state = dragStateRef.current;
    if (!state.isDragging || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    if (!state.hasMoved && Math.abs(dx) > 3) {
      state.hasMoved = true;
      // Drag began on inactive item and finger moved: lift now
      if (state.sourceId !== 'pill' && state.sourceId !== activeIdRef.current) {
        liftPill();
      }
    }

    if (!state.hasMoved) return;

    const metas = itemsMetaRef.current;
    if (metas.length === 0) return;

    // Auto-scroll rail when finger nears edge
    const container = navContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const edgeThreshold = 44;
      if (e.clientX < rect.left + edgeThreshold) {
        container.scrollLeft -= 5;
      } else if (e.clientX > rect.right - edgeThreshold) {
        container.scrollLeft += 5;
      }
    }

    const scrollDelta = (container?.scrollLeft || 0) - state.startScrollLeft;
    const unclampedX = state.startPillX + dx + scrollDelta;

    const minX = metas[0].left;
    const maxX =
      metas[metas.length - 1].left +
      metas[metas.length - 1].width -
      state.currentPillWidth;
    const clampedX = Math.max(minX, Math.min(maxX, unclampedX));
    state.currentX = clampedX;

    // Velocity (EMA, px/s)
    const now = performance.now();
    const dt = now - state.lastTime;
    if (dt > 0) {
      const instantVx = (e.clientX - state.lastX) / (dt / 1000);
      state.velocity = state.velocity * 0.4 + instantVx * 0.6;
    }
    state.lastX = e.clientX;
    state.lastTime = now;

    // Liquid stretch, hard-capped so pill never grows past rail padding
    const reduced = isReducedMotion();
    const speed = Math.abs(state.velocity);
    const cap = getScaleXCap(state.currentPillWidth);
    const baseX = Math.min(1.06, cap);
    const stretch = reduced ? 0 : Math.min(0.02, (speed / 3000) * 0.02);
    const scaleX = reduced ? 1 : Math.min(cap, baseX + stretch);
    const scaleY = reduced ? 1 : LIFT_SCALE_Y - stretch * 0.5;

    if (pillRef.current) {
      gsap.set(pillRef.current, {
        x: clampedX,
        scaleX,
        scaleY,
      });
    }

    // Live highlight of item under pill center
    const pillCenter = clampedX + state.currentPillWidth / 2;
    let nearest = metas[0];
    let minDiff = Infinity;
    for (const m of metas) {
      const diff = Math.abs(m.center - pillCenter);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = m;
      }
    }

    if (nearest.id !== highlightedIdRef.current) {
      highlightedIdRef.current = nearest.id;
      setHighlightedId(nearest.id);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(8);
        } catch {
          // Unsupported browsers
        }
      }
    }
  };

  const handlePointerUp = (e) => {
    const state = dragStateRef.current;
    if (!state.isDragging || state.pointerId !== e.pointerId) return;

    try {
      state.captureEl?.releasePointerCapture(state.pointerId);
    } catch {
      // Ignored
    }

    const metas = itemsMetaRef.current;
    state.isDragging = false;

    // Plain tap
    if (!state.hasMoved) {
      if (state.sourceId === 'pill' || state.sourceId === activeIdRef.current) {
        dropPill();
        return;
      }
      const targetMeta = metas.find((m) => m.id === state.sourceId);
      if (targetMeta) {
        glidePillTo(targetMeta, { spring: 'back', scroll: true });
      }
      return;
    }

    // Drag release: snap with velocity projection
    if (metas.length === 0) return;

    const timeSinceLast = performance.now() - state.lastTime;
    let finalVx = state.velocity;
    if (timeSinceLast > 80) finalVx = 0;

    const projectedX = state.currentX + finalVx * 0.15;
    const projectedCenter = projectedX + state.currentPillWidth / 2;

    let nearest = metas[0];
    let minDiff = Infinity;
    for (const m of metas) {
      const diff = Math.abs(m.center - projectedCenter);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = m;
      }
    }

    glidePillTo(nearest, { spring: 'elastic', scroll: true });
  };

  const handlePointerCancel = (e) => {
    const state = dragStateRef.current;
    if (!state.isDragging || state.pointerId !== e.pointerId) return;

    try {
      state.captureEl?.releasePointerCapture(state.pointerId);
    } catch {
      // Ignored
    }

    state.isDragging = false;
    const metas = itemsMetaRef.current;
    if (metas.length === 0) return;

    const currentMeta =
      metas.find((m) => m.id === activeIdRef.current) || metas[0];
    glidePillTo(currentMeta, { spring: 'back', scroll: false });
  };

  const handleItemClick = (e, id) => {
    // Click right after a drag: ignore
    if (dragStateRef.current.hasMoved) {
      e.preventDefault();
      return;
    }

    if (id === activeIdRef.current) return;

    const targetMeta = itemsMetaRef.current.find((m) => m.id === id);
    if (targetMeta) {
      glidePillTo(targetMeta, { spring: 'back', scroll: true });
    }
  };

  // Keyboard: left/right arrows move pill + scroll
  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextItem = navItems[Math.min(navItems.length - 1, index + 1)];
      itemRefs.current[nextItem.id]?.focus();
      const targetMeta = itemsMetaRef.current.find((m) => m.id === nextItem.id);
      if (targetMeta) {
        glidePillTo(targetMeta, { spring: 'back', scroll: true });
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevItem = navItems[Math.max(0, index - 1)];
      itemRefs.current[prevItem.id]?.focus();
      const targetMeta = itemsMetaRef.current.find((m) => m.id === prevItem.id);
      if (targetMeta) {
        glidePillTo(targetMeta, { spring: 'back', scroll: true });
      }
    }
  };

  return (
    <>
      <nav
        ref={navRootRef}
        aria-label="Quick jump navigation"
        className="fixed left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-1.5rem)] select-none
          [--nav-item-h:50px]
          bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] md:bottom-auto md:top-4 transition-all duration-300 overflow-visible"
      >
        <div
          className={`relative rounded-full flex items-center gap-1 max-w-[calc(100vw-1.5rem)] shadow-2xl transition-all duration-500 overflow-visible ${
            compact ? 'px-1.5 py-1 scale-[0.97]' : 'px-2 py-2'
          }`}
          style={{
            transitionTimingFunction: 'var(--ease-out-expo)',
          }}
        >
          {/* Glass background layer */}
          <div
            className="nav-bg absolute inset-0 rounded-full pointer-events-none"
            style={{
              zIndex: 0,
              background: 'rgba(2, 26, 84, 0.2)',
              backdropFilter: 'blur(6px) saturate(100%)',
              WebkitBackdropFilter: 'blur(6px) saturate(100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow:
                '0 16px 40px -8px rgba(0, 2, 14, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.20)',
              borderRadius: 'inherit',
            }}
            aria-hidden="true"
          />

          {/* Mobile section grid trigger */}
          <button
            type="button"
            onClick={openMenu}
            title="All story sections"
            aria-label="Open sections grid"
            className="relative z-[2] md:hidden lg-icon-btn shrink-0 text-pink hover:text-blush pl-1 pr-1.5 active:!scale-95"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>

          {/* Scrollable rail. No vertical padding: nav height = button height (--nav-item-h).
              Pill is calc(100% - 8px) tall, fits with no clip. */}
          <div
            ref={navContainerRef}
            className="relative flex items-center gap-0.5 overflow-x-auto overflow-y-hidden no-scrollbar min-w-0 flex-1 touch-pan-y px-1"
            style={{ overscrollBehaviorX: 'none' }}
          >
            {/* Draggable glass pill */}
            <div
              ref={pillRef}
              aria-hidden="true"
              onPointerDown={(e) => handlePointerDown(e, 'pill')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              className="absolute left-0 rounded-full will-change-transform select-none cursor-grab active:cursor-grabbing"
              style={{
                top: '50%',
                height: 'calc(100% - 8px)',
                zIndex: 1,
                touchAction: 'none',
                transformOrigin: '50% 50%',
                background: 'rgba(255, 133, 187, 0.25)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -7px 12px -6px rgba(255, 133, 187, 0.30)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
              }}
            />

            {/* Nav item buttons */}
            {navItems.map(({ id, label }, index) => {
              const isActive = activeId === id;
              const isLiveHighlighted = highlightedId === id;
              return (
                <button
                  key={id}
                  ref={(el) => (itemRefs.current[id] = el)}
                  data-nav-id={id}
                  type="button"
                  onClick={(e) => handleItemClick(e, id)}
                  onPointerDown={(e) => handlePointerDown(e, id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative z-[2] px-3 sm:px-3.5 min-h-[var(--nav-item-h)] rounded-full text-sm font-sans whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-200 active:!scale-100 !transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/80 focus-visible:ring-offset-1 focus-visible:ring-offset-night ${
                    isLiveHighlighted
                      ? 'text-[#F5F5F5] font-medium'
                      : 'text-[#F5F5F5]/70 hover:text-[#F5F5F5] font-medium'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div
            className="relative z-[2] w-px h-5 bg-[var(--glass-divider)] shrink-0 mx-0.5"
            aria-hidden="true"
          />

          {/* Settings */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Chat Settings & Nickname Mapping"
              aria-label="Chat Settings & Nickname Mapping"
              className="relative z-[2] lg-icon-btn shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/80 focus-visible:ring-offset-1 focus-visible:ring-offset-night"
            >
              <svg
                className="w-[18px] h-[18px] text-pink shrink-0 transition-transform duration-700 group-hover:rotate-90"
                style={{ transitionTimingFunction: 'var(--ease-spring)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile section grid bottom sheet */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-50 flex items-end justify-center md:hidden ${
            isMenuClosing ? 'animate-fade-out pointer-events-none' : 'animate-fade-in'
          }`}
          style={{
            background: 'var(--scrim)',
            WebkitBackdropFilter: 'blur(10px)',
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => closeMenu()}
        >
          <div
            ref={menuSheetRef}
            className={`w-full glass glass-strong rounded-t-[32px] px-6 pt-2 pb-[max(2rem,env(safe-area-inset-bottom))] relative select-none max-h-[80vh] flex flex-col shadow-2xl ${
              isMenuClosing ? 'animate-sheet-down' : 'animate-sheet-up'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber pill with drag-to-dismiss */}
            <div
              className="w-full pt-2 pb-3 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none"
              onPointerDown={handleMenuPointerDown}
              onPointerMove={handleMenuPointerMove}
              onPointerUp={handleMenuPointerUp}
              onPointerCancel={handleMenuPointerCancel}
            >
              <div
                className="h-1.5 w-10 rounded-full shrink-0 transition-transform active:scale-110"
                style={{ backgroundColor: 'var(--modal-grabber)' }}
                aria-hidden="true"
              />
            </div>

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-glass-divider shrink-0">
              <div>
                <span className="font-serif text-lg font-semibold text-cloud block">
                  Story Sections
                </span>
                <span className="text-[11px] font-sans text-cloud/50 block">
                  Tap any chapter to jump
                </span>
              </div>
              <button
                type="button"
                onClick={() => closeMenu()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-cloud/60 hover:text-cloud glass-chip cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/80"
                aria-label="Close section menu"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 overflow-y-auto no-scrollbar pr-1 py-1">
              {navItems.map(({ id, label, icon }) => {
                const isActive = activeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      const targetMeta = itemsMetaRef.current.find(
                        (m) => m.id === id
                      );
                      if (targetMeta) {
                        glidePillTo(targetMeta, { spring: 'back', scroll: true });
                      } else {
                        scrollToSection(id);
                      }
                      closeMenu();
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/80 ${
                      isActive
                        ? 'bg-pink text-on-pink font-semibold shadow-md'
                        : 'glass-chip text-cloud/80 hover:text-cloud hover:bg-[var(--pill-inactive-hover)]'
                    }`}
                  >
                    <span className="text-base shrink-0">{icon}</span>
                    <span className="text-xs font-sans truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickNav;