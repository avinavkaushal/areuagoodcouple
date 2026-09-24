import { useState, useEffect, useRef } from 'react';

const NAV_ITEMS = [
  { id: 'milestones', label: 'Milestones' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'activity', label: 'Activity' },
  { id: 'initiator', label: 'Initiator' },
  { id: 'response-time', label: 'Response Time' },
  { id: 'love-words', label: 'Love Words' },
  { id: 'search', label: 'Search' },
  { id: 'emoji', label: 'Emoji' },
  { id: 'word-cloud', label: 'Word Cloud' },
  { id: 'memories', label: 'Memories' },
  { id: 'streaks', label: 'Streaks' },
  { id: 'longest-message', label: 'Longest' },
];

function QuickNav({ onOpenSettings }) {
  const [activeId, setActiveId] = useState('milestones');
  const isClickScrolling = useRef(false);
  const clickTimeout = useRef(null);
  const navContainerRef = useRef(null);

  // Smoothly center the active pill in the horizontal nav on small screens
  useEffect(() => {
    if (!navContainerRef.current) return;
    const activeBtn = navContainerRef.current.querySelector(`[data-nav-id="${activeId}"]`);
    if (activeBtn) {
      const container = navContainerRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScroll = btnLeft - containerWidth / 2 + btnWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeId]);

  // Robust, jitter-free scroll-spy
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (isClickScrolling.current) return;
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
          const navOffset = 180; // Distance from viewport top where section becomes active

          let currentId = null;

          for (let i = 0; i < NAV_ITEMS.length; i++) {
            const item = NAV_ITEMS[i];
            const el = document.getElementById(item.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= navOffset) {
                currentId = item.id;
              }
            }
          }

          if (currentId) {
            setActiveId((prev) => (prev !== currentId ? currentId : prev));
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
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    isClickScrolling.current = true;
    setActiveId(id);

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    clickTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  return (
    <nav
      aria-label="Quick jump navigation"
      className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 max-w-[96vw] select-none"
    >
      <div className="glass backdrop-blur-md bg-[#021A54]/85 border border-white/15 shadow-xl rounded-full px-2 py-1.5 flex items-center gap-1.5 max-w-[96vw]">
        {/* Scrollable pill container */}
        <div
          ref={navContainerRef}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0 flex-1"
        >
          {NAV_ITEMS.map(({ id, label }) => {
            const isActive = activeId === id;
            return (
              <button
                key={id}
                data-nav-id={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-pink text-navy shadow-sm font-semibold'
                    : 'text-cloud/70 hover:text-cloud hover:bg-white/10 font-medium'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Integrated pinned settings button with divider */}
        {onOpenSettings && (
          <>
            <div className="w-px h-4 bg-white/20 shrink-0 mx-0.5" aria-hidden="true" />
            <button
              type="button"
              onClick={onOpenSettings}
              title="Chat Settings & Nickname Mapping"
              aria-label="Chat Settings & Nickname Mapping"
              className="shrink-0 p-1.5 sm:px-2.5 sm:py-1 rounded-full text-cloud/70 hover:text-cloud hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans font-medium"
            >
              <svg className="w-3.5 h-3.5 text-pink shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default QuickNav;
