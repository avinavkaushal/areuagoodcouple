import { useMemo, useState } from 'react';
import { getHeatmapData, getPeakSlot } from '../lib/stats';

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOUR_LABELS_12H = [
  '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM',
  '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM',
];

const HOUR_TICKS = [
  '12a', '', '', '3a', '', '',
  '6a', '', '', '9a', '', '',
  '12p', '', '', '3p', '', '',
  '6p', '', '', '9p', '', '',
];

function formatCount(num) {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return num.toString();
}

function ActivityHeatmap({ messages }) {
  const grid = useMemo(() => getHeatmapData(messages), [messages]);
  const peak = useMemo(() => getPeakSlot(grid), [grid]);

  // Find exact peak slot indices
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

  const maxCount = useMemo(() => Math.max(peakSlot.count, 1), [peakSlot.count]);

  const totalMessages = useMemo(() => {
    return grid.flat().reduce((a, b) => a + b, 0);
  }, [grid]);

  // Total messages per day of the week
  const dayTotals = useMemo(() => {
    return grid.map((row) => row.reduce((sum, val) => sum + val, 0));
  }, [grid]);

  // Busiest day of the week index
  const busiestDayIdx = useMemo(() => {
    let max = -1;
    let idx = 0;
    dayTotals.forEach((tot, d) => {
      if (tot > max) {
        max = tot;
        idx = d;
      }
    });
    return idx;
  }, [dayTotals]);

  // Time periods aggregation (Late Night, Morning, Afternoon, Evening)
  const timeBlocks = useMemo(() => {
    let lateNight = 0; // 0..5 (12 AM - 6 AM)
    let morning = 0;   // 6..11 (6 AM - 12 PM)
    let afternoon = 0; // 12..16 (12 PM - 5 PM)
    let evening = 0;   // 17..23 (5 PM - 12 AM)

    grid.forEach((row) => {
      row.forEach((count, h) => {
        if (h < 6) lateNight += count;
        else if (h < 12) morning += count;
        else if (h < 17) afternoon += count;
        else evening += count;
      });
    });

    return [
      { label: 'Late Night', time: '12 AM – 6 AM', count: lateNight },
      { label: 'Morning', time: '6 AM – 12 PM', count: morning },
      { label: 'Afternoon', time: '12 PM – 5 PM', count: afternoon },
      { label: 'Evening', time: '5 PM – 12 AM', count: evening },
    ].sort((a, b) => b.count - a.count);
  }, [grid]);

  const [hoveredCell, setHoveredCell] = useState(null);

  // Cell color helper
  const getCellColor = (count) => {
    if (count === 0) {
      return 'bg-white/[0.03] border-white/[0.04] text-transparent hover:border-white/20';
    }
    const ratio = count / maxCount;
    if (ratio < 0.2) {
      return 'bg-pink/20 border-pink/30 hover:border-pink/70 text-pink/80';
    }
    if (ratio < 0.45) {
      return 'bg-pink/40 border-pink/50 hover:border-pink/80 text-cloud';
    }
    if (ratio < 0.75) {
      return 'bg-pink/70 border-pink/85 hover:border-white text-cloud shadow-[0_0_10px_rgba(255,133,187,0.3)]';
    }
    return 'bg-[#C93F82] border-pink hover:border-white text-cloud shadow-[0_0_14px_rgba(201,63,130,0.6)]';
  };

  return (
    <section id="activity" className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-12 md:px-16 py-24 sm:py-32 bg-night">
      <div className="relative z-10 max-w-6xl w-full mx-auto">
        <p className="font-sans text-pink/80 text-xs sm:text-sm uppercase tracking-wider mb-3">
          24/7 Activity Rhythm
        </p>

        <h2 className="font-serif text-cloud text-3xl sm:text-5xl leading-snug max-w-3xl mb-8 sm:mb-12 font-semibold">
          {peak.dayName}s around {peak.hourLabel}, we talk the most.
        </h2>

        {/* 3 Insight Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-8">
          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col gap-1">
            <span className="text-xs font-sans text-cloud/50 uppercase tracking-wider">
              Peak Slot
            </span>
            <span className="font-serif text-lg sm:text-xl text-cloud font-semibold">
              {peak.dayName} · {peak.hourLabel}
            </span>
            <span className="text-xs text-pink font-medium">
              {peak.count.toLocaleString()} messages
            </span>
          </div>

          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col gap-1">
            <span className="text-xs font-sans text-cloud/50 uppercase tracking-wider">
              Loudest Day
            </span>
            <span className="font-serif text-lg sm:text-xl text-cloud font-semibold">
              {DAYS_FULL[busiestDayIdx]}s
            </span>
            <span className="text-xs text-pink font-medium">
              {dayTotals[busiestDayIdx].toLocaleString()} total messages
            </span>
          </div>

          <div className="glass rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col gap-1">
            <span className="text-xs font-sans text-cloud/50 uppercase tracking-wider">
              Favorite Time
            </span>
            <span className="font-serif text-lg sm:text-xl text-cloud font-semibold">
              {timeBlocks[0]?.label}
            </span>
            <span className="text-xs text-pink font-medium">
              {timeBlocks[0]?.time} ({formatCount(timeBlocks[0]?.count || 0)} msgs)
            </span>
          </div>
        </div>

        {/* Main Gridmap Glass Card */}
        <div className="glass rounded-3xl p-5 sm:p-8 border border-white/10 shadow-2xl overflow-hidden">
          {/* Scrollable Container with nice padding */}
          <div className="overflow-x-auto pb-4 pt-1 select-none">
            <div className="min-w-[680px]">
              {/* Top Time Band Markers */}
              <div className="grid grid-cols-[54px_repeat(24,1fr)_56px] gap-1 mb-2 text-[11px] font-sans text-cloud/40 text-center">
                <div />
                <div className="col-span-6 bg-white/[0.02] rounded py-0.5 border border-white/[0.04]">
                  Night (12a–6a)
                </div>
                <div className="col-span-6 bg-white/[0.02] rounded py-0.5 border border-white/[0.04]">
                  Morning (6a–12p)
                </div>
                <div className="col-span-5 bg-white/[0.02] rounded py-0.5 border border-white/[0.04]">
                  Afternoon (12p–5p)
                </div>
                <div className="col-span-7 bg-white/[0.02] rounded py-0.5 border border-white/[0.04]">
                  Evening (5p–12a)
                </div>
                <div className="text-[10px] uppercase tracking-wider flex items-center justify-end pr-1">
                  Total
                </div>
              </div>

              {/* Hour Tick Headers (0 to 23) */}
              <div className="grid grid-cols-[54px_repeat(24,1fr)_56px] gap-1 mb-2.5 text-[11px] font-mono text-cloud/50 text-center">
                <div />
                {HOUR_TICKS.map((tick, h) => (
                  <div key={h} className="flex justify-center items-center h-4 font-semibold">
                    {tick ? tick : <span className="w-1 h-1 rounded-full bg-white/20" />}
                  </div>
                ))}
                <div />
              </div>

              {/* Day Rows (Sun through Sat) */}
              <div className="space-y-1.5">
                {grid.map((row, d) => {
                  const isBusiestDay = d === busiestDayIdx;
                  return (
                    <div
                      key={d}
                      className="grid grid-cols-[54px_repeat(24,1fr)_56px] gap-1 items-center"
                    >
                      {/* Day Label */}
                      <div className="font-sans text-xs flex items-center gap-1.5 font-medium pr-1">
                        <span className={isBusiestDay ? 'text-pink font-semibold' : 'text-cloud/70'}>
                          {DAYS_SHORT[d]}
                        </span>
                        {isBusiestDay && (
                          <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" title="Loudest Day" />
                        )}
                      </div>

                      {/* 24 Hour Cells */}
                      {row.map((count, h) => {
                        const isPeak = d === peakSlot.day && h === peakSlot.hour && count > 0;
                        const isHovered =
                          hoveredCell && hoveredCell.day === d && hoveredCell.hour === h;

                        return (
                          <div
                            key={h}
                            onMouseEnter={() => setHoveredCell({ day: d, hour: h, count })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => setHoveredCell({ day: d, hour: h, count })}
                            title={`${DAYS_FULL[d]} at ${HOUR_LABELS_12H[h]}: ${count.toLocaleString()} messages`}
                            className={`relative h-6 sm:h-8 rounded-md border transition-all duration-150 cursor-pointer flex items-center justify-center ${getCellColor(
                              count
                            )} ${isPeak ? 'ring-2 ring-pink ring-offset-1 ring-offset-[#021A54]' : ''} ${
                              isHovered ? 'scale-125 z-20 shadow-2xl brightness-125' : ''
                            }`}
                          >
                            {isPeak && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping pointer-events-none" />
                            )}
                          </div>
                        );
                      })}

                      {/* Row Total (Day summary) */}
                      <div className="font-mono text-xs text-cloud/50 text-right pr-1">
                        {formatCount(dayTotals[d])}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Inspector Bar & Legend */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-sans">
            {/* Live Inspector Readout */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink animate-pulse shrink-0" />
              {hoveredCell ? (
                <p className="text-cloud">
                  <strong className="text-pink font-semibold">
                    {DAYS_FULL[hoveredCell.day]} at {HOUR_LABELS_12H[hoveredCell.hour]}
                  </strong>
                  : {hoveredCell.count.toLocaleString()} messages{' '}
                  <span className="text-cloud/40">
                    ({totalMessages > 0 ? ((hoveredCell.count / totalMessages) * 100).toFixed(1) : 0}% of all messages)
                  </span>
                </p>
              ) : (
                <p className="text-cloud/70">
                  <strong className="text-cloud font-medium">Peak Hour:</strong> {peak.dayName} at{' '}
                  {peak.hourLabel} with {peak.count.toLocaleString()} messages. Hover over any cell to inspect.
                </p>
              )}
            </div>

            {/* Intensity Scale Legend */}
            <div className="flex items-center gap-2 text-cloud/50 shrink-0">
              <span>Quiet</span>
              <div className="flex gap-1 items-center">
                <div className="w-3 h-3 rounded bg-white/[0.04] border border-white/10" title="Zero activity" />
                <div className="w-3 h-3 rounded bg-pink/20 border border-pink/30" title="Low" />
                <div className="w-3 h-3 rounded bg-pink/40 border border-pink/50" title="Moderate" />
                <div className="w-3 h-3 rounded bg-pink/70 border border-pink/85" title="High" />
                <div className="w-3 h-3 rounded bg-[#C93F82] border border-pink" title="Peak" />
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