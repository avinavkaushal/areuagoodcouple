import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLoveWordStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function LoveWords({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getLoveWordStats(messages, senders), [messages, senders]);
  const [p1, p2] = stats.senders;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.love-card', {
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

  const maxTotal = stats.leaderboard[0]?.total || 1;

  return (
    <section
      id="love-words"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy"
    >
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-white/[0.04] text-[22vw] sm:text-[18vw] leading-none font-semibold"
      >
        ♥
      </div>

      <div className="relative z-10 max-w-2xl">
        <p className="font-sans text-blush/70 text-sm mb-4 sm:mb-8">terms of endearment</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug mb-10 sm:mb-14">
          {stats.whoSaysMoreOverall} reaches for sweet words most.
        </p>

        {/* Summary Card */}
        <div className="love-card glass rounded-3xl p-6 sm:p-8 mb-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="font-sans text-xs text-cloud/50 block">Sweet Words Total</span>
              <span className="font-serif text-4xl sm:text-5xl font-semibold text-pink mt-1 block">
                {stats.totals.overall.toLocaleString()}
              </span>
            </div>
            <div className="text-left sm:text-right font-sans text-sm text-cloud/70 space-y-1">
              <div>
                <strong className="text-pink font-semibold">{p1}</strong>: {stats.totals[p1].toLocaleString()} times
              </div>
              <div>
                <strong className="text-blush font-semibold">{p2}</strong>: {stats.totals[p2].toLocaleString()} times
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-3">
            <span className="font-sans text-xs text-cloud/50 font-semibold uppercase tracking-wider block">
              Top Affection Words
            </span>
            {stats.leaderboard.slice(0, 6).map((item) => {
              const widthPct = Math.round((item.total / maxTotal) * 100);
              return (
                <div key={item.word} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs font-sans">
                    <span className="font-serif text-cloud text-sm font-semibold capitalize">
                      {item.word}
                    </span>
                    <span className="text-cloud/50">
                      {item.total.toLocaleString()} ({p1}: {item[p1]} · {p2}: {item[p2]})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-pink rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoveWords;
