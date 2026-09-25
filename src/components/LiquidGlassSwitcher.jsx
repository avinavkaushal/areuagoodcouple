function LiquidGlassSwitcher({
  options = [],
  activeValue,
  onChange,
  className = '',
}) {
  if (!options || options.length <= 1) return null;

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full bg-white/[0.06] border border-white/20 backdrop-blur-xl shadow-lg relative select-none ${className}`}
      role="tablist"
      aria-label="Platform view switcher"
    >
      {options.map((opt) => {
        const isActive = activeValue === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-sans font-medium transition-all duration-300 cursor-pointer ${
              isActive
                ? 'text-white bg-white/25 border border-white/40 backdrop-blur-2xl shadow-[0_2px_12px_rgba(255,255,255,0.2)] scale-[1.02]'
                : 'text-cloud/60 hover:text-cloud hover:bg-white/10 border border-transparent'
            }`}
          >
            {opt.color && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: opt.color }}
              />
            )}
            <span>{opt.label}</span>
            {opt.count != null && (
              <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-cloud/40'}`}>
                ({opt.count.toLocaleString()})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default LiquidGlassSwitcher;
