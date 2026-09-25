import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getReelStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function ReelStats({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getReelStats(messages, senders), [messages, senders]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.reel-card', {
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

  if (!stats || stats.totalReels === 0) {
    return null;
  }

  const leaderPct = stats.leader === stats.p1.name ? stats.p1.pct : stats.p2.pct;
  const leaderCount = stats.leader === stats.p1.name ? stats.p1.count : stats.p2.count;

  return (
    <section
      id="reels"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy"
    >
      <div className="relative z-10 max-w-3xl">
        <p className="font-sans text-blush/70 text-sm mb-4 sm:mb-8">our reel exchange</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug mb-10 sm:mb-14">
          {stats.leader} sent the most reels &mdash; {leaderCount.toLocaleString()} ({leaderPct}%).
        </p>

        {/* Proportional Split Bar (reusing Initiator style) */}
        <div className="reel-card glass rounded-2xl p-6 sm:p-8 space-y-4 mb-6">
          <div className="flex justify-between items-baseline font-serif text-cloud text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink inline-block" />
              <span>
                {stats.p1.name} ({stats.p1.pct}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                {stats.p2.name} ({stats.p2.pct}%)
              </span>
              <span className="w-3 h-3 rounded-full bg-blush inline-block" />
            </div>
          </div>

          <div className="h-4 w-full bg-white/10 rounded-full flex overflow-hidden p-0.5">
            <div
              style={{ width: `${stats.p1.pct}%` }}
              className="h-full bg-pink rounded-l-full transition-all duration-700"
            />
            <div
              style={{ width: `${stats.p2.pct}%` }}
              className="h-full bg-blush rounded-r-full transition-all duration-700"
            />
          </div>

          <div className="flex justify-between text-xs font-sans text-cloud/50">
            <span>{stats.p1.count.toLocaleString()} reels sent</span>
            <span>{stats.p2.count.toLocaleString()} reels sent</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Ping-Pong Streak */}
          <div className="reel-card glass rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink/20 border border-pink/30 text-pink text-xs font-semibold mb-3">
                <span>🏓 Reel Ping-Pong Streak</span>
              </div>
              <p className="font-sans text-cloud/60 text-xs">Longest back-and-forth volley</p>
              <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2">
                {stats.streak.length} {stats.streak.length === 1 ? 'reel' : 'reels'}
              </div>
            </div>
            {stats.streak.formattedStartDate && (
              <p className="font-sans text-cloud/70 text-xs mt-2 pt-2 border-t border-white/10">
                {stats.streak.formattedStartDate === stats.streak.formattedEndDate
                  ? `Achieved on ${stats.streak.formattedStartDate}`
                  : `${stats.streak.formattedStartDate} → ${stats.streak.formattedEndDate}`}
              </p>
            )}
          </div>

          {/* Card 2: Peak Reel Activity */}
          <div className="reel-card glass rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-3">
                <span>🔥 Peak Reel Period</span>
              </div>
              <p className="font-sans text-cloud/60 text-xs">Most active month for reels</p>
              <div className="font-serif font-semibold text-pink text-3xl sm:text-4xl my-2">
                {stats.busiestMonth ? stats.busiestMonth.label : '—'}
              </div>
            </div>
            {stats.busiestMonth && (
              <p className="font-sans text-cloud/70 text-xs mt-2 pt-2 border-t border-white/10">
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
