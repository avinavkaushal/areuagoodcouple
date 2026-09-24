import { useMemo, useState } from 'react';
import { getHeatmapData, getPeakSlot } from '../lib/stats';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PERIOD_LABELS = [
  { id: 'night', name: 'Night', sub: '12a–6a' },
  { id: 'morning', name: 'Morning', sub: '6a–12p' },
  { id: 'afternoon', name: 'Afternoon', sub: '12p–6p' },
  { id: 'evening', name: 'Evening', sub: '6p–12a' },
];

const HOUR_TICKS_CLEAN = [
  '12a', '', '', '3a', '', '',
  '6a', '', '', '9a', '', '',
  '12p', '', '', '3p', '', '',
  '6p', '', '', '9p', '', '',
];

const HOUR_LABELS_12H = [
  '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM',
  '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM',
];

function getIntensityClass(count, max) {
  if (count === 0) {
    return 'bg-white/[0.03] border-white/[0.04] text-transparent hover:border-white/20';
  }
  const ratio = count / max;
  if (ratio < 0.25) {
    return 'bg-pink/20 border-pink/30 hover:border-pink/60';
  }
  if (ratio < 0.55) {
    return 'bg-pink/45 border-pink/55 hover:border-pink/80';
  }
  if (ratio < 0.8) {
    return 'bg-pink/75 border-pink/90 hover:border-white shadow-[0_0_8px_rgba(255,133,187,0.3)]';
  }
  return 'bg-[#C93F82] border-pink hover:border-white shadow-[0_0_12px_rgba(201,63,130,0.5)]';
}

function ActivityHeatmap({ messages }) {
  const grid = useMemo(() => getHeatmapData(messages), [messages]);
  const peak = useMemo(() => getPeakSlot(grid), [grid]);

  // Hourly peak slot
  const peakSlot = useMemo(() => {
    let best = { day: 0, hour: 0, count: 0 };
    grid.forEach((row, d) => {
      row.forEach((count, h) => {
        if (count > best.count) {
          best = { day: d, hour: h, count };
        }
      });
    });
    return best;
  }, [grid]);

  const maxHourCount = useMemo(() => Math.max(peakSlot.count, 1), [peakSlot.count]);

  // Group into 4 periods per day (Night, Morning, Afternoon, Evening) for uncluttered mobile view
  const periodGrid = useMemo(() => {
    return grid.map((row) => {
      let night = 0;     // 0..5
      let morning = 0;   // 6..11
      let afternoon = 0; // 12..17
      let evening = 0;   // 18..23
      row.forEach((count, h) => {
        if (h < 6) night += count;
        else if (h < 12) morning += count;
        else if (h < 18) afternoon += count;
        else evening += count;
      });
      return [night, morning, afternoon, evening];
    });
  }, [grid]);

  const peakPeriodSlot = useMemo(() => {
    let best = { day: 0, period: 0, count: 0 };
    periodGrid.forEach((row, d) => {
      row.forEach((count, p) => {
        if (count > best.count) {
          best = { day: d, period: p, count };
        }
      });
    });
    return best;
  }, [periodGrid]);

  const maxPeriodCount = useMemo(() => Math.max(peakPeriodSlot.count, 1), [peakPeriodSlot.count]);

  // View mode: default to 'period' on mobile to prevent cramps, 'hourly' on desktop
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'period';
    }
    return 'hourly';
  });

  const [hovered, setHovered] = useState(null);

  return (
    <section id="activity" className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-12 md:px-16 py-20 sm:py-28 bg-night">
      <div className="relative z-10 max-w-5xl w-full mx-auto">
        <p className="font-sans text-pink/80 text-xs uppercase tracking-wider mb-2">
          our loudest hour
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <h2 className="font-serif text-cloud text-3xl sm:text-5xl leading-snug max-w-2xl font-semibold">
            {peak.dayName}s around {peak.hourLabel}, we talk the most.
          </h2>

          {/* Simple View Toggle */}
          <div className="inline-flex p-1 rounded-full bg-white/[0.06] border border-white/10 text-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setViewMode('period');
                setHovered(null);
              }}
              className={`px-3 py-1 rounded-full font-sans transition-all cursor-pointer ${
                viewMode === 'period'
                  ? 'bg-pink text-navy font-semibold shadow-sm'
                  : 'text-cloud/60 hover:text-cloud'
              }`}
            >
              4 Periods
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('hourly');
                setHovered(null);
              }}
              className={`px-3 py-1 rounded-full font-sans transition-all cursor-pointer ${
                viewMode === 'hourly'
                  ? 'bg-pink text-navy font-semibold shadow-sm'
                  : 'text-cloud/60 hover:text-cloud'
              }`}
            >
              24 Hours
            </button>
          </div>
        </div>

        {/* Decluttered Glass Card Container */}
        <div className="glass rounded-3xl p-5 sm:p-7 border border-white/10 shadow-xl select-none">
          {viewMode === 'period' ? (
            /* ------------------ 4 PERIODS VIEW (Mobile-friendly, Zero Horizontal Scroll) ------------------ */
            <div className="w-full">
              {/* Period Column Headers */}
              <div className="grid grid-cols-[40px_repeat(4,1fr)] gap-2 sm:gap-3 mb-2.5 text-center">
                <div />
                {PERIOD_LABELS.map((p) => (
                  <div key={p.id} className="flex flex-col items-center">
                    <span className="text-xs font-sans font-medium text-cloud/80">{p.name}</span>
                    <span className="text-[10px] font-mono text-cloud/40">{p.sub}</span>
                  </div>
                ))}
              </div>

              {/* Day Rows */}
              <div className="space-y-2">
                {periodGrid.map((row, d) => (
                  <div key={d} className="grid grid-cols-[40px_repeat(4,1fr)] gap-2 sm:gap-3 items-center">
                    <span className="text-xs font-sans text-cloud/60 font-medium">{DAYS_SHORT[d]}</span>

                    {row.map((count, p) => {
                      const isPeak = d === peakPeriodSlot.day && p === peakPeriodSlot.period && count > 0;
                      const isHovered = hovered?.type === 'period' && hovered?.day === d && hovered?.period === p;

                      return (
                        <div
                          key={p}
                          onMouseEnter={() =>
                            setHovered({
                              type: 'period',
                              day: d,
                              period: p,
                              title: `${DAYS_FULL[d]} ${PERIOD_LABELS[p].name} (${PERIOD_LABELS[p].sub})`,
                              count,
                            })
                          }
                          onMouseLeave={() => setHovered(null)}
                          onClick={() =>
                            setHovered({
                              type: 'period',
                              day: d,
                              period: p,
                              title: `${DAYS_FULL[d]} ${PERIOD_LABELS[p].name} (${PERIOD_LABELS[p].sub})`,
                              count,
                            })
                          }
                          className={`relative h-10 sm:h-12 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-center ${getIntensityClass(
                            count,
                            maxPeriodCount
                          )} ${isPeak ? 'ring-2 ring-pink ring-offset-1 ring-offset-[#021A54]' : ''} ${
                            isHovered ? 'scale-105 shadow-xl brightness-125 z-10' : ''
                          }`}
                        >
                          {isPeak && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping pointer-events-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ------------------ 24 HOURS VIEW (Clean Minimal Punchcard) ------------------ */
            <div className="overflow-x-auto no-scrollbar pb-1">
              <div className="min-w-[540px]">
                {/* 24 Hour Tick Markers */}
                <div className="grid grid-cols-[36px_repeat(24,1fr)] gap-1 mb-2 text-[10px] font-mono text-cloud/40 text-center">
                  <div />
                  {HOUR_TICKS_CLEAN.map((tick, h) => (
                    <div key={h} className="flex justify-center items-center h-4">
                      {tick ? tick : <span className="w-1 h-1 rounded-full bg-white/15" />}
                    </div>
                  ))}
                </div>

                {/* Day Rows */}
                <div className="space-y-1.5">
                  {grid.map((row, d) => (
                    <div key={d} className="grid grid-cols-[36px_repeat(24,1fr)] gap-1 items-center">
                      <span className="text-xs font-sans text-cloud/60 font-medium">{DAYS_SHORT[d]}</span>

                      {row.map((count, h) => {
                        const isPeak = d === peakSlot.day && h === peakSlot.hour && count > 0;
                        const isHovered = hovered?.type === 'hourly' && hovered?.day === d && hovered?.hour === h;

                        return (
                          <div
                            key={h}
                            onMouseEnter={() =>
                              setHovered({
                                type: 'hourly',
                                day: d,
                                hour: h,
                                title: `${DAYS_FULL[d]} at ${HOUR_LABELS_12H[h]}`,
                                count,
                              })
                            }
                            onMouseLeave={() => setHovered(null)}
                            onClick={() =>
                              setHovered({
                                type: 'hourly',
                                day: d,
                                hour: h,
                                title: `${DAYS_FULL[d]} at ${HOUR_LABELS_12H[h]}`,
                                count,
                              })
                            }
                            className={`relative h-6 sm:h-7 rounded border transition-all duration-150 cursor-pointer flex items-center justify-center ${getIntensityClass(
                              count,
                              maxHourCount
                            )} ${isPeak ? 'ring-2 ring-pink ring-offset-1 ring-offset-[#021A54]' : ''} ${
                              isHovered ? 'scale-125 shadow-xl brightness-125 z-10' : ''
                            }`}
                          >
                            {isPeak && (
                              <span className="w-1 h-1 rounded-full bg-white animate-ping pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Simple Minimal Footer (Inspection Text & Scale) */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans text-cloud/60">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse shrink-0" />
              {hovered ? (
                <span className="text-cloud">
                  <strong className="text-pink font-semibold">{hovered.title}</strong>: {hovered.count.toLocaleString()} messages
                </span>
              ) : (
                <span>
                  Peak: <strong className="text-cloud">{peak.dayName} at {peak.hourLabel}</strong> ({peak.count.toLocaleString()} msgs)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-cloud/40 shrink-0">
              <span>Quiet</span>
              <div className="flex gap-1 items-center">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.04]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-pink/25" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-pink/55" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C93F82]" />
              </div>
              <span>Peak</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ActivityHeatmap;