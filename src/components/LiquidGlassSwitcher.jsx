function formatCompactCount(num) {
  if (num == null) return null;
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 10_000) {
    return `${(num / 1_000).toFixed(num >= 100_000 ? 0 : 1).replace(/\.0$/, '')}k`;
  }
  return num.toLocaleString();
}

function LiquidGlassSwitcher({
  options = [],
  activeValue,
  onChange,
  className = '',
}) {
  if (!options || options.length <= 1) return null;

  return (
    <div
      className={`max-w-full overflow-x-auto no-scrollbar py-0.5 self-start sm:self-auto ${className}`}
      role="tablist"
      aria-label="Platform view switcher"
    >
      <div className="inline-flex items-center p-1 rounded-full glass glass-strong relative select-none shadow-md shrink-0 border border-glass-divider">
        {options.map((opt) => {
          const isActive = activeValue === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(opt.id)}
              className={`relative z-10 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-sans font-medium whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 active:!scale-98 ${
                isActive
                  ? 'bg-pink text-on-pink font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_14px_-2px_color-mix(in_oklab,var(--color-pink)_70%,transparent)]'
                  : 'text-cloud/75 hover:text-cloud hover:bg-[var(--pill-inactive-hover)]'
              }`}
            >
              {opt.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: opt.color }}
                />
              )}
              <span>{opt.label}</span>
              {opt.count != null && (
                <span className={`text-[10px] ${isActive ? 'text-on-pink/80 font-bold' : 'text-cloud/60'}`}>
                  <span className="inline sm:hidden">({formatCompactCount(opt.count)})</span>
                  <span className="hidden sm:inline">({opt.count.toLocaleString()})</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LiquidGlassSwitcher;
