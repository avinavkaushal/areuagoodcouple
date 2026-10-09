import { useMemo, useState } from 'react';
import { getCalendarHeat, formatDuration } from '../lib/stats';
import LiquidGlassSwitcher from './LiquidGlassSwitcher';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CalendarHeat({ messages }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredDay, setHoveredDay] = useState(null);

  const platformCounts = useMemo(() => {
    const counts = { all: (messages || []).length, whatsapp: 0, instagram: 0, telegram: 0 };
    for (const m of messages || []) {
      const p = m.platform || 'whatsapp';
      counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [messages]);

  const filterOptions = useMemo(() => {
    const opts = [{ id: 'all', label: 'All', count: platformCounts.all }];
    if (platformCounts.whatsapp > 0) {
      opts.push({ id: 'whatsapp', label: 'WhatsApp', color: 'var(--color-wa-pink)', count: platformCounts.whatsapp });
    }
    if (platformCounts.instagram > 0) {
      opts.push({ id: 'instagram', label: 'Instagram', color: 'var(--color-ig-pink)', count: platformCounts.instagram });
    }
    if (platformCounts.telegram > 0) {
      opts.push({ id: 'telegram', label: 'Telegram', color: 'var(--color-tg-pink)', count: platformCounts.telegram });
    }
    return opts;
  }, [platformCounts]);

  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all') return messages || [];
    return (messages || []).filter((m) => (m.platform || 'whatsapp') === activeFilter);
  }, [messages, activeFilter]);

  const days = useMemo(() => getCalendarHeat(filteredMessages), [filteredMessages]);
  const maxCount = useMemo(() => Math.max(...days.map((d) => d.count), 1), [days]);

  const duration = useMemo(() => {
    if (!filteredMessages || filteredMessages.length === 0) return 'no messages';
    const first = filteredMessages[0]?.timestamp || filteredMessages[0]?.date;
    const last = filteredMessages[filteredMessages.length - 1]?.timestamp || filteredMessages[filteredMessages.length - 1]?.date;
    return formatDuration(first, last);
  }, [filteredMessages]);

  // GitHub-style grid alignment: pad initial days of the first week so Sunday is row 0
  const paddedDays = useMemo(() => {
    if (days.length === 0) return [];
    const firstDayOfWeek = days[0].date.getDay(); // 0 = Sunday
    const padding = Array.from({ length: firstDayOfWeek }, () => null);
    return [...padding, ...days];
  }, [days]);

  // Active color for heat squares
  const activeSquareColor =
    activeFilter === 'whatsapp'
      ? 'bg-wa-pink'
      : activeFilter === 'instagram'
      ? 'bg-ig-pink'
      : activeFilter === 'telegram'
      ? 'bg-tg-pink'
      : 'bg-pink';

  const showDay = (e, item, dateStr) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setHoveredDay({
      dateStr,
      weekday: item.date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: item.count,
      x: r.left + r.width / 2,
      y: r.top,
    });
  };

  return (
    <section
      id="calendar"
      onClick={() => setHoveredDay(null)}
      className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32"
    >
      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 min-w-0">
          <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold">
            every single day
          </p>

          {/* Liquid Glass Switcher */}
          <LiquidGlassSwitcher
            options={filterOptions}
            activeValue={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight max-w-2xl font-semibold mb-8 sm:mb-10">
          {duration}, one square per day.
        </h2>

        {/* Glass card enclosing the graph */}
        <div className="glass rounded-3xl p-6 sm:p-8 space-y-4">
          <div
            className="overflow-x-auto no-scrollbar py-3 px-2"
            onScroll={() => setHoveredDay(null)}
          >
            <div className="inline-flex gap-3 items-center min-w-max">
              {/* Day of week labels */}
              <div className="grid grid-rows-7 gap-[3px] text-[10px] font-sans text-cloud/40 pr-1 select-none">
                {DAY_LABELS.map((label, idx) => (
                  <div key={idx} className="h-3.5 w-3.5 flex items-center justify-center font-medium">
                    {idx % 2 === 1 ? label : ''}
                  </div>
                ))}
              </div>

              {/* Grid of contribution squares (7 rows, flow col) */}
              <div className="grid grid-rows-7 grid-flow-col gap-[3px] [&:hover>div:not(:hover)]:brightness-75">
                {paddedDays.map((item, idx) => {
                  if (!item) {
                    return <div key={`pad-${idx}`} className="w-3.5 h-3.5" />;
                  }
                  const isZero = item.count === 0;
                  const opacity = isZero ? 1 : 0.35 + (item.count / maxCount) * 0.65;
                  const dateStr = item.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={item.date.toISOString()}
                      onMouseEnter={(e) => showDay(e, item, dateStr)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={(e) => showDay(e, item, dateStr)}
                      style={{ opacity }}
                      className={`w-3.5 h-3.5 rounded-[3px] cursor-pointer transition-[transform,opacity,filter,box-shadow] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.7] hover:z-20 hover:!opacity-100 hover:opacity-100! hover:!brightness-125 hover:brightness-125! hover:ring-2 hover:ring-white/50 hover:shadow-[0_0_12px_rgba(255,133,187,0.7)] ${
                        isZero ? 'bg-empty-cell' : activeSquareColor
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer info: Inspection text & Legend */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-glass-divider text-xs font-sans text-cloud/70">
            <div className="min-h-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink shrink-0" />
              {hoveredDay ? (
                <span className="text-cloud">
                  <strong className="text-pink font-semibold">{hoveredDay.dateStr}</strong>: {hoveredDay.count.toLocaleString()} messages
                </span>
              ) : (
                <span>Hover or tap any square to inspect messages for that day</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-cloud/60 shrink-0">
              <span>Less</span>
              <div className="flex gap-1 items-center">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-empty-cell" />
                <div className={`w-2.5 h-2.5 rounded-[2px] ${activeSquareColor} opacity-[0.35]`} />
                <div className={`w-2.5 h-2.5 rounded-[2px] ${activeSquareColor} opacity-[0.65]`} />
                <div className={`w-2.5 h-2.5 rounded-[2px] ${activeSquareColor} opacity-[1]`} />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full -mt-3 px-3 py-1.5 rounded-xl text-xs font-sans whitespace-nowrap text-cloud shadow-xl"
          style={{
            left: hoveredDay.x,
            top: hoveredDay.y,
            background: 'rgba(2, 26, 84, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <span className="text-pink font-semibold">
            {hoveredDay.weekday}, {hoveredDay.dateStr}
          </span>
          <span className="mx-1.5 text-cloud/40">·</span>
          {hoveredDay.count.toLocaleString()} messages
        </div>
      )}
    </section>
  );
}

export default CalendarHeat;
