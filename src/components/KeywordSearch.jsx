import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { getKeywordStats } from '../lib/stats';

function KeywordSearch({ messages }) {
  const [keyword, setKeyword] = useState('');
  const resultRef = useRef(null);
  const stats = getKeywordStats(messages, keyword);

  const first = messages[0]?.date;
  const last = messages[messages.length - 1]?.date;
  const span = last - first;

  useEffect(() => {
    if (stats && resultRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          resultRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        );
      });
      return () => ctx.revert();
    }
  }, [keyword, stats]);

  const hourLabel = (h) => {
    if (h === null || h === undefined) return '—';
    const period = h < 12 ? 'am' : 'pm';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${period}`;
  };

  return (
    <section className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-blush">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.04] text-[24vw] sm:text-[18vw] leading-none font-semibold"
      >
        ?
      </div>

      <div className="relative z-10">
        <p className="font-sans text-navy/50 text-sm mb-4 sm:mb-8">a word, counted</p>

        <div className="max-w-2xl glass rounded-3xl p-6 sm:p-8">
          <p className="font-serif text-navy text-3xl sm:text-5xl leading-snug">
            how many times did we say{' '}
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="sorry"
              style={{ width: `${Math.max(keyword.length, 5)}ch` }}
              className="bg-transparent border-b-2 border-navy/30 focus:border-pink outline-none text-pink placeholder:text-navy/20 font-serif italic px-1"
            />
            {' '}?
          </p>
        </div>

        {stats && (
          <div ref={resultRef} className="mt-12 sm:mt-16 max-w-2xl">
            <div className="flex items-baseline gap-4">
              <span className="font-serif font-semibold text-navy text-6xl sm:text-7xl">
                {stats.count}
              </span>
              <span className="font-sans text-navy/60 text-sm">
                times, mostly around {hourLabel(stats.topHour)}
                {stats.avgGapDays ? `, every ${stats.avgGapDays.toFixed(1)} days on average` : ''}
              </span>
            </div>

            {/* timeline: dot per occurrence, positioned across full chat span */}
            {stats.hits.length > 0 && span > 0 && (
              <div className="relative mt-8 h-8">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-navy/15" />
                {stats.hits.map((h, i) => {
                  const pct = ((h.date - first) / span) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-1/2 w-2 h-2 rounded-full bg-pink -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${pct}%` }}
                      title={h.date.toDateString()}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default KeywordSearch;