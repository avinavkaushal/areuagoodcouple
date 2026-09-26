import { useMemo, useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getCrossPlatformStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

const PLATFORM_META = {
  whatsapp: {
    name: 'WhatsApp',
    color: '#25D366',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    barClass: 'bg-[#25D366]',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
      </svg>
    ),
  },
  telegram: {
    name: 'Telegram',
    color: '#2AABEE',
    badgeClass: 'bg-sky-500/15 border-sky-400/40 text-sky-300',
    barClass: 'bg-[#2AABEE]',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
      </svg>
    ),
  },
  instagram: {
    name: 'Instagram',
    color: '#8A2BE2',
    badgeClass: 'bg-purple-950/40 border-purple-500/40 text-purple-300',
    barClass: 'bg-[#8A2BE2]',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
};

function CrossPlatformStats({ messages, loadedPlatforms = {}, onAddPlatform }) {
  const sectionRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const stats = useMemo(
    () => getCrossPlatformStats(messages, loadedPlatforms),
    [messages, loadedPlatforms]
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.unified-card', {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (!stats || stats.totalMessages === 0) {
    return null;
  }

  const activeMonthData = selectedMonth
    ? stats.migrationTimeline.find((m) => m.monthKey === selectedMonth)
    : stats.migrationTimeline[stats.migrationTimeline.length - 1];

  return (
    <section
      id="unified"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-12 md:px-16 py-20 sm:py-28 bg-navy text-cloud"
    >
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        {/* Eyebrow */}
        <p className="font-sans text-blush/70 text-xs sm:text-sm uppercase tracking-wider mb-3">
          Cross-Platform Unification
        </p>

        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <h2 className="font-serif text-3xl sm:text-5xl text-cloud leading-tight font-semibold">
              Our Unified Story
            </h2>
            <p className="font-sans text-cloud/60 text-xs sm:text-sm mt-2 max-w-xl">
              {stats.isMultiPlatform
                ? 'Every conversation across WhatsApp, Telegram, and Instagram woven into one continuous history.'
                : 'Your relationship archive, ready to combine conversations across all your messaging apps.'}
            </p>
          </div>

          {/* Link Another Platform Action */}
          {onAddPlatform && (
            <button
              type="button"
              onClick={onAddPlatform}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/20 hover:border-pink text-xs font-sans text-pink hover:bg-pink/10 transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Link Another Platform</span>
            </button>
          )}
        </div>

        {/* -------------------- 1. PLATFORM PRESENCE & SHARE -------------------- */}
        <div className="unified-card glass rounded-3xl p-6 sm:p-8 space-y-6 mb-6 border border-white/10 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold">
              Active Platforms
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {stats.platformBreakdown.map((p) => {
                const meta = PLATFORM_META[p.platform] || PLATFORM_META.whatsapp;
                return (
                  <span
                    key={p.platform}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${meta.badgeClass}`}
                  >
                    {meta.icon}
                    <span>{meta.name}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Proportional Segmented Bar */}
          <div className="space-y-2">
            <div className="w-full h-4 sm:h-5 rounded-full overflow-hidden bg-white/5 flex p-0.5 border border-white/10 shadow-inner">
              {stats.platformBreakdown.map((p) => {
                const meta = PLATFORM_META[p.platform] || PLATFORM_META.whatsapp;
                return (
                  <div
                    key={p.platform}
                    style={{ width: `${Math.max(p.pct, 2)}%` }}
                    className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 ${meta.barClass}`}
                    title={`${p.name}: ${p.count.toLocaleString()} (${p.pct}%)`}
                  />
                );
              })}
            </div>

            {/* Split Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {stats.platformBreakdown.map((p) => {
                const meta = PLATFORM_META[p.platform] || PLATFORM_META.whatsapp;
                return (
                  <div
                    key={p.platform}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span className="font-sans text-xs text-cloud/70">{p.name}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-serif text-lg sm:text-xl text-cloud font-semibold">
                        {p.count.toLocaleString()}
                      </span>
                      <span className="font-sans text-xs text-cloud/50 font-medium">{p.pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* -------------------- 2 & 3: FIRST MESSAGE & BUSIEST DAY CARDS -------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Card: Absolute First Message Ever */}
          {stats.firstMessage && (
            <div className="unified-card glass rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 shadow-xl">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold">
                    Absolute First Message Ever
                  </span>
                  {(() => {
                    const p = stats.firstMessage.platform;
                    const meta = PLATFORM_META[p] || PLATFORM_META.whatsapp;
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${meta.badgeClass}`}
                      >
                        {meta.icon}
                        <span>{meta.name}</span>
                      </span>
                    );
                  })()}
                </div>

                <p className="font-sans text-xs text-cloud/50 mb-3">
                  Sent by <strong className="text-cloud font-semibold">{stats.firstMessage.sender}</strong> on{' '}
                  <span className="text-cloud/80 font-medium">{stats.firstMessage.formattedDate}</span>
                  {stats.firstMessage.formattedTime && (
                    <span> at {stats.firstMessage.formattedTime}</span>
                  )}
                </p>

                {/* Quoted Message Bubble */}
                <div className="relative pl-4 border-l-2 border-pink/60 py-1 my-3 bg-white/[0.02] rounded-r-xl pr-3">
                  <p className="font-serif italic text-base sm:text-lg text-cloud leading-relaxed break-words">
                    &ldquo;{stats.firstMessage.text}&rdquo;
                  </p>
                </div>
              </div>

              <p className="font-sans text-[11px] text-cloud/40 mt-4">
                The very first spark recorded in your loaded archives.
              </p>
            </div>
          )}

          {/* Card: Busiest Combined Day */}
          {stats.busiestDay && (
            <div className="unified-card glass rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 shadow-xl">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold">
                    Busiest Day Combined
                  </span>
                  <span className="font-sans text-[11px] text-cloud/50">{stats.busiestDay.weekday}</span>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-serif text-3xl sm:text-4xl text-cloud font-semibold">
                    {stats.busiestDay.total.toLocaleString()}
                  </span>
                  <span className="font-sans text-xs text-cloud/60">messages in a single day</span>
                </div>

                <p className="font-serif text-pink text-base sm:text-lg font-medium mb-4">
                  {stats.busiestDay.formattedDate}
                </p>

                {/* Day Platform Breakdown Bar */}
                <div className="space-y-2">
                  <div className="w-full h-3 rounded-full overflow-hidden bg-white/5 flex border border-white/10">
                    {Object.entries(stats.busiestDay.breakdown).map(([pKey, count]) => {
                      if (count <= 0) return null;
                      const meta = PLATFORM_META[pKey] || PLATFORM_META.whatsapp;
                      const share = stats.busiestDay.shares[pKey] || 0;
                      return (
                        <div
                          key={pKey}
                          style={{ width: `${Math.max(share, 3)}%` }}
                          className={`h-full transition-all duration-300 ${meta.barClass}`}
                          title={`${meta.name}: ${count} (${share}%)`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-sans text-cloud/60 pt-1">
                    {Object.entries(stats.busiestDay.breakdown).map(([pKey, count]) => {
                      if (count <= 0) return null;
                      const meta = PLATFORM_META[pKey] || PLATFORM_META.whatsapp;
                      return (
                        <div key={pKey} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                          <span>
                            <strong className="text-cloud font-medium">{count.toLocaleString()}</strong> on{' '}
                            {meta.name} ({stats.busiestDay.shares[pKey]}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p className="font-sans text-[11px] text-cloud/40 mt-4">
                Peak communication volume across all platforms combined.
              </p>
            </div>
          )}
        </div>

        {/* -------------------- 4. PLATFORM MIGRATION CHART -------------------- */}
        {stats.isMultiPlatform ? (
          <div className="unified-card glass rounded-3xl p-6 sm:p-8 space-y-6 mb-6 border border-white/10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold block mb-1">
                  Platform Migration Timeline
                </span>
                <p className="font-serif text-cloud text-xl sm:text-2xl font-medium">
                  How our chats evolved month by month
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 self-start sm:self-auto text-xs font-sans text-cloud/70">
                {stats.activePlatforms.map((p) => {
                  const meta = PLATFORM_META[p] || PLATFORM_META.whatsapp;
                  return (
                    <div key={p} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span>{meta.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Stacked Bars */}
            <div className="space-y-4">
              <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin">
                <div
                  className="flex items-end gap-2 sm:gap-3 min-w-[500px] h-48 sm:h-56 pt-6 border-b border-white/10"
                  style={{ minWidth: `${Math.max(500, stats.migrationTimeline.length * 36)}px` }}
                >
                  {stats.migrationTimeline.map((item) => {
                    const heightPct = Math.max(8, Math.round((item.total / stats.maxMonthTotal) * 100));
                    const isSelected = selectedMonth === item.monthKey;

                    return (
                      <div
                        key={item.monthKey}
                        onClick={() => setSelectedMonth(isSelected ? null : item.monthKey)}
                        className="flex-1 flex flex-col items-center cursor-pointer group relative h-full justify-end"
                      >
                        {/* Month Bar */}
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full max-w-[28px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-300 border ${
                            isSelected
                              ? 'ring-2 ring-pink border-white/80 scale-105'
                              : 'border-white/10 hover:border-pink/60 group-hover:scale-105'
                          }`}
                        >
                          {/* WhatsApp segment */}
                          {item.whatsapp > 0 && (
                            <div
                              style={{ height: `${item.shares.whatsapp}%` }}
                              className="w-full bg-[#25D366] transition-all"
                              title={`WhatsApp: ${item.whatsapp}`}
                            />
                          )}
                          {/* Telegram segment */}
                          {item.telegram > 0 && (
                            <div
                              style={{ height: `${item.shares.telegram}%` }}
                              className="w-full bg-[#2AABEE] transition-all"
                              title={`Telegram: ${item.telegram}`}
                            />
                          )}
                          {/* Instagram segment */}
                          {item.instagram > 0 && (
                            <div
                              style={{ height: `${item.shares.instagram}%` }}
                              className="w-full bg-[#8A2BE2] transition-all"
                              title={`Instagram: ${item.instagram}`}
                            />
                          )}
                        </div>

                        {/* Month Label */}
                        <span
                          className={`text-[10px] sm:text-xs font-sans mt-2 transition-colors whitespace-nowrap ${
                            isSelected ? 'text-pink font-bold' : 'text-cloud/50 group-hover:text-cloud'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Month Detail Box */}
              {activeMonthData && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                  <div>
                    <span className="font-serif text-lg text-cloud font-semibold">
                      {activeMonthData.fullLabel}
                    </span>
                    <span className="font-sans text-xs text-cloud/50 ml-2">
                      ({activeMonthData.total.toLocaleString()} total messages)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-sans">
                    {activeMonthData.whatsapp > 0 && (
                      <span className="text-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                        WhatsApp: <strong>{activeMonthData.whatsapp.toLocaleString()}</strong> (
                        {activeMonthData.shares.whatsapp}%)
                      </span>
                    )}
                    {activeMonthData.telegram > 0 && (
                      <span className="text-sky-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#2AABEE]" />
                        Telegram: <strong>{activeMonthData.telegram.toLocaleString()}</strong> (
                        {activeMonthData.shares.telegram}%)
                      </span>
                    )}
                    {activeMonthData.instagram > 0 && (
                      <span className="text-purple-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#8A2BE2]" />
                        Instagram: <strong>{activeMonthData.instagram.toLocaleString()}</strong> (
                        {activeMonthData.shares.instagram}%)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Narrative Takeaway Box */}
              {stats.migrationNarrative && (
                <div className="p-4 rounded-2xl bg-pink/10 border border-pink/20 flex items-start gap-3">
                  <span className="text-lg">🧭</span>
                  <p className="font-sans text-xs sm:text-sm text-cloud/90 leading-relaxed">
                    <strong className="text-pink font-semibold">Migration Journey: </strong>
                    {stats.migrationNarrative}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Graceful Degradation Card (Single Platform Loaded) */
          <div className="unified-card glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-pink/15 text-pink flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl text-cloud font-semibold mb-2">
              Ready to unify your chats across platforms?
            </h3>

            <p className="font-sans text-xs sm:text-sm text-cloud/60 max-w-md mb-6 leading-relaxed">
              You currently have{' '}
              <strong className="text-cloud">
                {PLATFORM_META[stats.activePlatforms[0]]?.name || 'one platform'}
              </strong>{' '}
              loaded. Link your other exports (WhatsApp, Telegram, or Instagram) to reveal your full
              cross-platform relationship migration and combined timeline!
            </p>

            {onAddPlatform && (
              <button
                type="button"
                onClick={onAddPlatform}
                className="px-6 py-2.5 rounded-full bg-pink text-night font-sans font-bold text-xs uppercase tracking-wider hover:bg-blush transition-all shadow-lg hover:shadow-pink/20 cursor-pointer"
              >
                Link Another Platform Now
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default CrossPlatformStats;
