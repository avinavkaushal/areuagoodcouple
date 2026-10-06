import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLoveWordStats } from '../lib/stats';
import CountUp from './CountUp';

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
      className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32"
    >
      <div className="relative z-10 max-w-3xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          terms of endearment
        </p>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-8 sm:mb-12">
          {stats.whoSaysMoreOverall} reaches for sweet words most.
        </h2>

        {/* Summary Card */}
        <div className="love-card glass glass-lift rounded-3xl p-6 sm:p-8 mb-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-glass-divider pb-6">
            <div>
              <span className="font-sans text-xs text-cloud/50 font-medium block">Sweet Words Total</span>
              <span className="font-serif text-4xl sm:text-5xl font-semibold text-pink mt-1 block">
                <CountUp value={stats.totals.overall} />
              </span>
            </div>
            <div className="text-left sm:text-right font-sans text-sm text-cloud/70 space-y-1">
              <div>
                <strong className="text-pink font-semibold">{p1}</strong>: <span className="tabular-nums font-medium">{stats.totals[p1].toLocaleString()}</span> times
              </div>
              <div>
                <strong className="text-blush font-semibold">{p2}</strong>: <span className="tabular-nums font-medium">{stats.totals[p2].toLocaleString()}</span> times
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4">
            <span className="font-sans text-xs text-cloud/50 font-semibold uppercase tracking-wider block">
              Top Affection Words
            </span>
            {stats.leaderboard.slice(0, 6).map((item) => {
              const widthPct = Math.round((item.total / maxTotal) * 100);
              return (
                <div key={item.word} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs font-sans">
                    <span className="font-serif text-cloud text-base font-semibold capitalize">
                      &ldquo;{item.word}&rdquo;
                    </span>
                    <span className="text-cloud/50 font-mono text-[11px]">
                      {item.total.toLocaleString()} total ({p1}: {item[p1]} · {p2}: {item[p2]})
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-track rounded-full overflow-hidden p-0.5 border border-glass-divider">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-pink rounded-full transition-all duration-500 dark:shadow-[0_0_8px_rgba(255,133,187,0.4)]"
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
