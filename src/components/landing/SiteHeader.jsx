import { useState, useEffect } from 'react';

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isPast = window.scrollY > threshold;
      setScrolled((prev) => (prev !== isPast ? isPast : prev));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}

function SiteHeader({ onReset }) {
  const isScrolled = useScrolled(8);

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (onReset) {
      onReset();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`site-header fixed top-0 inset-x-0 z-30 w-full pt-[env(safe-area-inset-top,0px)] ${
        isScrolled ? 'site-header-scrolled' : 'site-header-top'
      }`}
    >
      <div className="max-w-[1200px] mx-auto w-full h-14 sm:h-16 flex items-center justify-between px-5 sm:px-8 pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
        {/* Site Logo */}
        <a
          href="/"
          onClick={handleLogoClick}
          aria-label="areuagoodcouple home"
          className="font-serif text-[15px] sm:text-lg font-semibold tracking-tight text-cloud hover:opacity-90 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2 rounded select-none whitespace-nowrap shrink-0"
        >
          areuagood<span className="text-pink">couple</span>
        </a>

        {/* GitHub Repository Link */}
        <a
          href="https://github.com/avinavkaushal/areuagoodcouple"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center rounded-xl text-cloud/80 hover:text-pink hover:bg-pink/15 hover:scale-[1.06] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2 transition-all duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none shrink-0"
        >
          <svg
            className="w-[22px] h-[22px] sm:w-6 sm:h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
          </svg>
        </a>
      </div>
    </header>
  );
}

export default SiteHeader;
