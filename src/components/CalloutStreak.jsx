import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getCalloutStats } from '../lib/stats';
import CountUp from './CountUp';

gsap.registerPlugin(ScrollTrigger);

function CalloutStreak({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getCalloutStats(messages, senders), [messages, senders]);
  const [p1, p2] = stats.senders;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.streak-card', {
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

  return (
    <section
      id="streaks"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32"
    >
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          first &amp; last hello
        </p>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-8 sm:mb-12">
          greetings from dusk till dawn.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Good Morning Card */}
          <div className="streak-card glass glass-lift rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">☀️</span>
              <span className="font-serif text-xl font-semibold text-cloud">Good Morning</span>
            </div>

            <div>
              <span className="font-sans text-xs text-cloud/50 font-medium block">Longest Morning Streak</span>
              <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl mt-2 flex items-baseline gap-2">
                <CountUp value={stats.morning.longestStreak} />
                <span className="text-lg font-sans font-normal text-cloud/60">days</span>
              </div>
            </div>

            <div className="pt-4 border-t border-glass-divider text-xs font-sans text-cloud/70 space-y-1">
              <div>
                Leading sender: <strong className="text-pink font-semibold">{stats.morning.leader ?? (stats.morning.counts.total === 0 ? '—' : 'tied')}</strong>
              </div>
              <div className="text-cloud/50 font-mono text-[11px]">
                {p1}: {stats.morning.counts[p1]} · {p2}: {stats.morning.counts[p2]}
              </div>
            </div>
          </div>

          {/* Good Night Card */}
          <div className="streak-card glass glass-lift rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌙</span>
              <span className="font-serif text-xl font-semibold text-cloud">Good Night</span>
            </div>

            <div>
              <span className="font-sans text-xs text-cloud/50 font-medium block">Longest Night Streak</span>
              <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl mt-2 flex items-baseline gap-2">
                <CountUp value={stats.night.longestStreak} />
                <span className="text-lg font-sans font-normal text-cloud/60">days</span>
              </div>
            </div>

            <div className="pt-4 border-t border-glass-divider text-xs font-sans text-cloud/70 space-y-1">
              <div>
                Leading sender: <strong className="text-pink font-semibold">{stats.night.leader ?? (stats.night.counts.total === 0 ? '—' : 'tied')}</strong>
              </div>
              <div className="text-cloud/50 font-mono text-[11px]">
                {p1}: {stats.night.counts[p1]} · {p2}: {stats.night.counts[p2]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CalloutStreak;
