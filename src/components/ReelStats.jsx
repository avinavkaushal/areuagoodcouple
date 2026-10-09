import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getReelStats } from '../lib/stats';
import CountUp from './CountUp';

gsap.registerPlugin(ScrollTrigger);

function ReelStats({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getReelStats(messages, senders), [messages, senders]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.reel-card', {
        y: 20,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 82%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (!stats || stats.totalReels === 0) {
    return null;
  }

  const leaderPct = stats.leader === stats.p1.name ? stats.p1.pct : stats.p2.pct;
  const leaderCount = stats.leader === stats.p1.name ? stats.p1.count : stats.p2.count;

  return (
    <section
      id="reels"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32"
    >
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          our reel exchange
        </p>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-8 sm:mb-12">
          {stats.leader} sent the most reels &mdash; <span className="text-pink"><CountUp value={leaderCount} /></span> ({leaderPct}%).
        </h2>

        {/* Proportional Split Bar */}
        <div className="reel-card glass glass-lift rounded-3xl p-6 sm:p-8 space-y-5 mb-6">
          <div className="flex justify-between items-baseline font-serif text-cloud text-lg sm:text-xl">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-pink dark:shadow-[0_0_10px_var(--color-pink)] inline-block" />
              <span className="font-semibold">
                {stats.p1.name} (<span className="text-pink tabular-nums">{stats.p1.pct}%</span>)
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-semibold">
                {stats.p2.name} (<span className="text-blush tabular-nums">{stats.p2.pct}%</span>)
              </span>
              <span className="w-3 h-3 rounded-full bg-blush dark:shadow-[0_0_10px_var(--color-blush)] inline-block" />
            </div>
          </div>

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
            <span><strong className="text-cloud/80 font-semibold">{stats.p1.count.toLocaleString()}</strong> reels sent</span>
            <span><strong className="text-cloud/80 font-semibold">{stats.p2.count.toLocaleString()}</strong> reels sent</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Card 1: Ping-Pong Streak */}
          <div className="reel-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-chip text-pink text-xs font-semibold mb-3">
                <span>Reel Ping-Pong Streak</span>
              </div>
              <p className="font-sans text-cloud/60 text-xs font-medium">Longest back-and-forth volley</p>
              <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2.5 flex items-baseline gap-2">
                <CountUp value={stats.streak.length} />
                <span className="text-lg font-sans font-normal text-cloud/60">{stats.streak.length === 1 ? 'reel' : 'reels'}</span>
              </div>
            </div>
            {stats.streak.formattedStartDate && (
              <p className="font-sans text-cloud/60 text-xs mt-2 pt-3 border-t border-glass-divider">
                {stats.streak.formattedStartDate === stats.streak.formattedEndDate
                  ? `Achieved on ${stats.streak.formattedStartDate}`
                  : `${stats.streak.formattedStartDate} → ${stats.streak.formattedEndDate}`}
              </p>
            )}
          </div>

          {/* Card 2: Peak Reel Activity */}
          <div className="reel-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-chip text-pink text-xs font-semibold mb-3">
                <span>Peak Reel Period</span>
              </div>
              <p className="font-sans text-cloud/60 text-xs font-medium">Most active month for reels</p>
              <div className="font-serif font-semibold text-pink text-3xl sm:text-4xl my-2.5">
                {stats.busiestMonth ? stats.busiestMonth.label : '—'}
              </div>
            </div>
            {stats.busiestMonth && (
              <p className="font-sans text-cloud/60 text-xs mt-2 pt-3 border-t border-glass-divider">
                <strong className="text-cloud font-semibold">
                  {stats.busiestMonth.count.toLocaleString()} reels
                </strong>{' '}
                shared in this month
                {stats.busiestDay && ` · peak day: ${stats.busiestDay.label} (${stats.busiestDay.count})`}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReelStats;
