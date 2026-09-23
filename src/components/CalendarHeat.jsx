import { useMemo } from 'react';
import { getCalendarHeat } from '../lib/stats';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CalendarHeat({ messages }) {
  const days = useMemo(() => getCalendarHeat(messages), [messages]);
  const maxCount = useMemo(() => Math.max(...days.map((d) => d.count), 1), [days]);

  // GitHub-style grid alignment: pad initial days of the first week so Sunday is row 0
  const paddedDays = useMemo(() => {
    if (days.length === 0) return [];
    const firstDayOfWeek = days[0].date.getDay(); // 0 = Sunday
    const padding = Array.from({ length: firstDayOfWeek }, () => null);
    return [...padding, ...days];
  }, [days]);

  return (
    <section className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-cloud">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.03] text-[20vw] sm:text-[16vw] leading-none font-semibold"
      >
        365
      </div>

      <div className="relative z-10">
        <p className="font-sans text-navy/50 text-sm mb-4 sm:mb-8">every single day</p>

        <p className="font-serif text-navy text-3xl sm:text-5xl leading-snug max-w-2xl mb-10 sm:mb-14">
          two years, one square per day.
        </p>

        {/* Scrollable contribution graph container */}
        <div className="overflow-x-auto pb-4 pt-1">
          <div className="inline-flex gap-3 items-center">
            {/* Day of week labels */}
            <div className="grid grid-rows-7 gap-[3px] text-[10px] font-sans text-navy/40 pr-1 select-none">
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
                const opacity = isZero ? 0.06 : 0.25 + (item.count / maxCount) * 0.75;
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
                      isZero ? 'bg-navy' : 'bg-pink'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs font-sans text-navy/40">
          <span>Less</span>
          <div className="flex gap-1 items-center">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-navy opacity-[0.06]" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-pink opacity-[0.3]" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-pink opacity-[0.6]" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-pink opacity-[0.9]" />
          </div>
          <span>More messages</span>
        </div>
      </div>
    </section>
  );
}

export default CalendarHeat;
