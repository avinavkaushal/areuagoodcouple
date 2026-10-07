import { useRef } from 'react';
import { PLATFORMS } from '../../constants/landingContent';

function renderStepText(step) {
  if (!step.highlights || step.highlights.length === 0) {
    return <span>{step.text}</span>;
  }

  // Regex to split and bold matching highlights
  const escaped = step.highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = step.text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        step.highlights.includes(part) ? (
          <strong key={i} className="text-cloud font-semibold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function ExportGuideTabs({ activeTab = 'whatsapp', onSelectTab }) {
  const tabListRef = useRef(null);

  const activePlatform =
    PLATFORMS.find((p) => p.id === activeTab) || PLATFORMS[0];

  const handleKeyDown = (e) => {
    const currentIndex = PLATFORMS.findIndex((p) => p.id === activeTab);
    let nextIndex = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % PLATFORMS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + PLATFORMS.length) % PLATFORMS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = PLATFORMS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextPlatform = PLATFORMS[nextIndex];
      onSelectTab(nextPlatform.id);
      const buttonEl = tabListRef.current?.querySelector(
        `#tab-${nextPlatform.id}`
      );
      buttonEl?.focus();
    }
  };

  return (
    <section
      id="export-guide"
      data-reveal="1"
      className="w-full glass glass-strong rounded-[32px] p-6 sm:p-10 flex flex-col items-center text-left scroll-mt-20 sm:scroll-mt-24 transition-all"
    >
      {/* Eyebrow & Section Heading */}
      <div className="w-full text-center sm:text-left mb-6 sm:mb-8">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-pink block mb-1">
          STEPS
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-cloud tracking-tight">
          How to export your chat
        </h2>
      </div>

      {/* Segmented Control Tabs */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Export platforms"
        onKeyDown={handleKeyDown}
        className="w-full glass-chip p-1 rounded-2xl flex items-center justify-between mb-6 sm:mb-8 gap-1"
      >
        {PLATFORMS.map((platform) => {
          const isSelected = platform.id === activePlatform.id;
          return (
            <button
              key={platform.id}
              id={`tab-${platform.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${platform.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelectTab(platform.id)}
              className={`flex-1 py-2 sm:py-2.5 px-2 text-center rounded-xl font-pixel text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center ${
                isSelected
                  ? 'bg-pink text-night font-bold shadow-md'
                  : 'text-cloud/70 hover:text-cloud hover:bg-white/5 active:scale-95'
              }`}
            >
              {platform.name}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div
        key={activePlatform.id}
        id={`panel-${activePlatform.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${activePlatform.id}`}
        tabIndex={0}
        className="w-full animate-fade-in focus-visible:outline-none"
      >
        <div className="space-y-3 sm:space-y-3.5">
          {activePlatform.steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-glass-divider transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-pink/20 text-pink text-xs font-sans font-bold flex items-center justify-center shrink-0 mt-0.5 border border-pink/30">
                {idx + 1}
              </span>
              <p className="font-sans text-cloud/85 text-xs sm:text-sm leading-relaxed flex-1">
                {renderStepText(step)}
              </p>
            </div>
          ))}
        </div>

        {/* Note line & optional hint */}
        <div className="mt-5 pt-4 border-t border-glass-divider flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-sans text-cloud/60">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-cloud/80">{activePlatform.note}</span>
          </div>
          {activePlatform.hint && (
            <span className="text-cloud/50 italic text-[11px]">
              {activePlatform.hint}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default ExportGuideTabs;
