import { useMemo, useState } from 'react';
import { getCalendarHeat, formatDuration } from '../lib/stats';
import LiquidGlassSwitcher from './LiquidGlassSwitcher';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CalendarHeat({ messages }) {
  const [activeFilter, setActiveFilter] = useState('all');

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
      opts.push({ id: 'whatsapp', label: 'WhatsApp', color: '#25D366', count: platformCounts.whatsapp });
    }
    if (platformCounts.instagram > 0) {
      opts.push({ id: 'instagram', label: 'Instagram', color: '#8A2BE2', count: platformCounts.instagram });
    }
    if (platformCounts.telegram > 0) {
      opts.push({ id: 'telegram', label: 'Telegram', color: '#2AABEE', count: platformCounts.telegram });
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
      ? 'bg-[#25D366]'
      : activeFilter === 'instagram'
      ? 'bg-[#8A2BE2]'
      : activeFilter === 'telegram'
      ? 'bg-[#2AABEE]'
      : 'bg-pink';

  return (
    <section id="calendar" className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-night">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-8">
          <p className="font-sans text-pink/80 text-sm">every single day</p>

          {/* Liquid Glass Switcher */}
          <LiquidGlassSwitcher
            options={filterOptions}
            activeValue={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug max-w-2xl mb-10 sm:mb-14">
          {duration}, one square per day.
        </p>

        {/* Scrollable contribution graph container */}
        <div className="overflow-x-auto pb-4 pt-1">
          <div className="inline-flex gap-3 items-center">
            {/* Day of week labels */}
            <div className="grid grid-rows-7 gap-[3px] text-[10px] font-sans text-cloud/40 pr-1 select-none">
              {DAY_LABELS.map((label, idx) => (
                <div key={idx} className="h-3 w-3 flex items-center justify-center">
                  {idx % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>

            {/* Grid of contribution squares (7 rows, flow col) */}
            <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
              {paddedDays.map((item, idx) => {
                if (!item) {
                  return <div key={`pad-${idx}`} className="w-3 h-3" />;
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
                    title={`${dateStr}: ${item.count} messages`}
                    style={{
                      opacity,
                    }}
                    className={`w-3 h-3 rounded-[2px] transition-transform hover:scale-150 hover:z-20 cursor-pointer ${
                      isZero ? 'bg-white/10' : activeSquareColor
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs font-sans text-cloud/50">
          <span>Less</span>
          <div className="flex gap-1 items-center">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-white/10" />
            <div className={`w-2.5 h-2.5 rounded-[2px] ${activeSquareColor} opacity-[0.35]`} />
            <div className={`w-2.5 h-2.5 rounded-[2px] ${activeSquareColor} opacity-[0.65]`} />
            <div className={`w-2.5 h-2.5 rounded-[2px] ${activeSquareColor} opacity-[1]`} />
          </div>
          <span>More messages</span>
        </div>
      </div>
    </section>
  );
}

export default CalendarHeat;
