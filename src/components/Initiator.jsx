import { useMemo } from 'react';
import { getInitiatorStats } from '../lib/stats';

function Initiator({ messages }) {
  const stats = useMemo(() => getInitiatorStats(messages), [messages]);

  const leader = stats.herPct >= stats.himPct ? 'Her' : 'Him';
  const leaderPct = stats.herPct >= stats.himPct ? stats.herPct : stats.himPct;

  return (
    <section className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-cloud">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.03] text-[24vw] sm:text-[18vw] leading-none font-semibold"
      >
        AM
      </div>

      <div className="relative z-10 max-w-2xl">
        <p className="font-sans text-navy/50 text-sm mb-4 sm:mb-8">who says good morning first</p>

        <p className="font-serif text-navy text-3xl sm:text-5xl leading-snug mb-10 sm:mb-14">
          {leader} starts the day, {leaderPct}% of the time.
        </p>

        {/* Diverging initiator bar */}
        <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-baseline font-serif text-navy text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink inline-block" />
              <span>Her ({stats.herPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Him ({stats.himPct}%)</span>
              <span className="w-3 h-3 rounded-full bg-navy inline-block" />
            </div>
          </div>

          {/* Proportional split bar */}
          <div className="h-4 w-full bg-navy/10 rounded-full flex overflow-hidden p-0.5">
            <div
              style={{ width: `${stats.herPct}%` }}
              className="h-full bg-pink rounded-l-full transition-all duration-700"
            />
            <div
              style={{ width: `${stats.himPct}%` }}
              className="h-full bg-navy rounded-r-full transition-all duration-700"
            />
          </div>

          <div className="flex justify-between text-xs font-sans text-navy/50">
            <span>{stats.her} mornings started</span>
            <span>{stats.him} mornings started</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Initiator;
