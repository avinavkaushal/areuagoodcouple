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

function QuickNav() {
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
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[96vw] w-max select-none"
    >
      <div
        ref={navContainerRef}
        className="glass backdrop-blur-md bg-[#021A54]/85 border border-white/15 shadow-xl rounded-full px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full"
      >
        {NAV_ITEMS.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              data-nav-id={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={`px-3 py-1 rounded-full text-xs font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer ${
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
    </nav>
  );
}

export default QuickNav;
