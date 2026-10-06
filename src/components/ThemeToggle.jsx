/**
 * Sun/moon toggle with a springy icon morph.
 */
function ThemeToggle({ resolved, onToggle, className = '' }) {
  const isDark = resolved === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`lg-icon-btn relative overflow-hidden ${className}`}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-500"
        style={{
          transitionTimingFunction: 'var(--ease-spring)',
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.4)',
          opacity: isDark ? 1 : 0,
        }}
      >
        {/* Moon */}
        <svg className="w-[18px] h-[18px] text-pink" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-500"
        style={{
          transitionTimingFunction: 'var(--ease-spring)',
          transform: isDark ? 'rotate(90deg) scale(0.4)' : 'rotate(0deg) scale(1)',
          opacity: isDark ? 0 : 1,
        }}
      >
        {/* Sun */}
        <svg className="w-[18px] h-[18px] text-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
    </button>
  );
}

export default ThemeToggle;
