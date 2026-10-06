import { useMemo } from 'react';
import { getInitiatorStats } from '../lib/stats';
import CountUp from './CountUp';

function Initiator({ messages, senders }) {
  const stats = useMemo(() => getInitiatorStats(messages, senders), [messages, senders]);

  const leader = stats.p1.pct >= stats.p2.pct ? stats.p1.name : stats.p2.name;
  const leaderPct = stats.p1.pct >= stats.p2.pct ? stats.p1.pct : stats.p2.pct;

  return (
    <section id="initiator" className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32">
      <div className="relative z-10 max-w-3xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          who says good morning first
        </p>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-8 sm:mb-12">
          {leader} starts the day, <span className="text-pink"><CountUp value={leaderPct} />%</span> of the time.
        </h2>

        {/* Diverging initiator bar */}
        <div className="glass glass-lift rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex justify-between items-baseline font-serif text-cloud text-lg sm:text-xl">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-pink dark:shadow-[0_0_10px_var(--color-pink)] inline-block" />
              <span className="font-semibold">{stats.p1.name} (<span className="text-pink tabular-nums">{stats.p1.pct}%</span>)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-semibold">{stats.p2.name} (<span className="text-blush tabular-nums">{stats.p2.pct}%</span>)</span>
              <span className="w-3 h-3 rounded-full bg-blush dark:shadow-[0_0_10px_var(--color-blush)] inline-block" />
            </div>
          </div>

          {/* Proportional split bar */}
          <div className="h-5 w-full bg-track rounded-full flex overflow-hidden p-0.5 border border-glass-divider shadow-inner">
            <div
              style={{ width: `${stats.p1.pct}%` }}
              className="h-full bg-pink rounded-l-full transition-all duration-700 dark:shadow-[0_0_14px_rgba(255,133,187,0.4)]"
            />
            <div
              style={{ width: `${stats.p2.pct}%` }}
              className="h-full bg-blush rounded-r-full transition-all duration-700 dark:shadow-[0_0_14px_rgba(255,206,227,0.3)]"
            />
          </div>

          <div className="flex justify-between text-xs font-sans text-cloud/50 pt-1">
            <span><strong className="text-cloud/80 font-semibold">{stats.p1.count.toLocaleString()}</strong> mornings started</span>
            <span><strong className="text-cloud/80 font-semibold">{stats.p2.count.toLocaleString()}</strong> mornings started</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Initiator;
