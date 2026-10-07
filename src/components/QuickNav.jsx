import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';

const NAV_ITEMS = [
  { id: 'unified', label: 'Unified', icon: '🌐' },
  { id: 'milestones', label: 'Milestones', icon: '🏆' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'highlights', label: 'Highlights', icon: '✨' },
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

function QuickNav({ messages, onOpenSettings }) {
  const [activeId, setActiveId] = useState('milestones');
  const [compact, setCompact] = useState(false);
  const [lens, setLens] = useState({ left: 0, width: 0, ready: false });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isClickScrolling = useRef(false);
  const clickTimeout = useRef(null);
  const navContainerRef = useRef(null);

  // Filter NAV_ITEMS so features without data (e.g. reels/media/reactions on WhatsApp-only chats) don't clutter nav
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

  // Move the liquid lens under the active pill with GPU transform
  useLayoutEffect(() => {
    const updateLens = () => {
      const container = navContainerRef.current;
      if (!container) return;
      const activeBtn = container.querySelector(`[data-nav-id="${activeId}"]`);
      if (!activeBtn) return;

      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;
      setLens({ left, width, ready: true });

      const btnLeft = activeBtn.offsetLeft;
      const btnRight = btnLeft + activeBtn.offsetWidth;
      const scrollLeft = container.scrollLeft;
      const clientWidth = container.clientWidth;

      // Only scroll rail if active pill is near the edges or outside the rail
      if (btnLeft < scrollLeft + 36 || btnRight > scrollLeft + clientWidth - 36) {
        const targetScroll = btnLeft - clientWidth / 2 + width / 2;
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    };

    updateLens();

    window.addEventListener('resize', updateLens);
    return () => window.removeEventListener('resize', updateLens);
  }, [activeId, navItems, compact]);

  // Robust, jitter-free scroll-spy + compact-on-scroll-down morph
  useEffect(() => {
    let ticking = false;
    let lastY = window.scrollY;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
          const y = window.scrollY;
          const delta = y - lastY;
          if (Math.abs(delta) > 20) {
            setCompact(delta > 0 && y > 280);
            lastY = y;
          }

          if (isClickScrolling.current) return;
          const navOffset = window.innerHeight * 0.35;

          let currentId = null;
          for (let i = 0; i < navItems.length; i++) {
            const el = document.getElementById(navItems[i].id);
            if (el && el.getBoundingClientRect().top <= navOffset) {
              currentId = navItems[i].id;
            }
          }

          if (currentId) {
            setActiveId((prev) => (prev !== currentId ? currentId : prev));
          } else if (navItems[0]) {
            setActiveId((prev) => (prev !== navItems[0].id ? navItems[0].id : prev));
          }
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, [navItems]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    isClickScrolling.current = true;
    setActiveId(id);

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    clickTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 900);
  };

  return (
    <>
      <nav
        aria-label="Quick jump navigation"
        className="fixed left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-1.5rem)] select-none
          bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] md:bottom-auto md:top-4 transition-all duration-300"
      >
        <div
          className={`glass glass-strong rounded-full flex items-center gap-1 max-w-[calc(100vw-1.5rem)] shadow-2xl transition-all duration-500 border border-glass-divider ${
            compact ? 'px-1.5 py-1 scale-[0.97]' : 'px-2 py-1.5'
          }`}
          style={{
            boxShadow: 'var(--nav-shadow)',
            transitionTimingFunction: 'var(--ease-out-expo)',
          }}
        >
          {/* Mobile Quick Section Grid Trigger */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            title="All story sections"
            aria-label="Open sections grid"
            className="md:hidden lg-icon-btn shrink-0 text-pink hover:text-blush pl-1 pr-1.5 active:!scale-95"
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

          {/* Scrollable pill rail */}
          <div
            ref={navContainerRef}
            className="relative flex items-center gap-0.5 overflow-x-auto no-scrollbar min-w-0 flex-1"
          >
            {/* Liquid lens indicator */}
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 left-0 rounded-full pointer-events-none will-change-transform"
              style={{
                transform: `translate3d(${lens.left}px, 0, 0)`,
                width: `${lens.width}px`,
                opacity: lens.ready ? 1 : 0,
                background:
                  'linear-gradient(180deg, color-mix(in oklab, var(--color-pink) 100%, white 18%), var(--color-pink))',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.15), 0 4px 14px -4px color-mix(in oklab, var(--color-pink) 70%, transparent)',
                transition: lens.ready
                  ? 'transform 0.36s cubic-bezier(0.16, 1, 0.3, 1), width 0.36s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease'
                  : 'opacity 0.2s ease',
              }}
            />
            {navItems.map(({ id, label }) => {
              const isActive = activeId === id;
              return (
                <button
                  key={id}
                  data-nav-id={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative z-10 px-3 sm:px-3.5 min-h-9 rounded-full text-[13px] sm:text-xs font-sans whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-200 active:!scale-100 !transform-none ${
                    isActive ? 'text-on-pink font-semibold' : 'text-cloud/75 hover:text-cloud font-medium'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-[var(--glass-divider)] shrink-0 mx-0.5" aria-hidden="true" />

          {/* Settings */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Chat Settings & Nickname Mapping"
              aria-label="Chat Settings & Nickname Mapping"
              className="lg-icon-btn shrink-0 group"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Quick Section Grid Bottom Sheet */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in md:hidden"
          style={{ background: 'var(--scrim)', WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)' }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full glass glass-strong rounded-t-[32px] px-6 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] relative select-none animate-sheet-up max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full shrink-0" style={{ backgroundColor: 'var(--modal-grabber)' }} aria-hidden="true" />

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-glass-divider shrink-0">
              <div>
                <span className="font-serif text-lg font-semibold text-cloud block">Story Sections</span>
                <span className="text-[11px] font-sans text-cloud/50 block">Tap any chapter to jump</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-cloud/60 hover:text-cloud glass-chip cursor-pointer"
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
                      scrollTo(id);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all cursor-pointer ${
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
