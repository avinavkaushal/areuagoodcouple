import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getResponseTimeStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function ResponseTime({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getResponseTimeStats(messages, senders), [messages, senders]);
  const [p1, p2] = stats.order;

  const data1 = stats[p1];
  const data2 = stats[p2];

  const maxAvg = Math.max(data1.avgReplyMs, data2.avgReplyMs, 1);
  const pct1 = Math.round((data1.avgReplyMs / maxAvg) * 100);
  const pct2 = Math.round((data2.avgReplyMs / maxAvg) * 100);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.response-card', {
        y: 24,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
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

  return (
    <section
      id="response-time"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-night"
    >
      <div className="relative z-10 max-w-2xl">
        <p className="font-sans text-pink/80 text-sm mb-4 sm:mb-8">the waiting game</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug mb-10 sm:mb-14">
          {stats.fasterSender} is the quicker texter.
        </p>

        {/* Side-by-side comparison card */}
        <div className="response-card glass rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            {/* Person 1 */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-serif text-cloud text-lg font-semibold">{data1.name}</span>
                <span className="font-sans text-cloud/70 text-sm font-medium">
                  usually replies in <strong className="text-pink font-bold">{data1.formattedAvg}</strong>
                </span>
              </div>
              <div className="h-3.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct1}%` }}
                  className="h-full bg-pink rounded-full transition-all duration-700"
                />
              </div>
            </div>

            {/* Person 2 */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-serif text-cloud text-lg font-semibold">{data2.name}</span>
                <span className="font-sans text-cloud/70 text-sm font-medium">
                  usually replies in <strong className="text-blush font-bold">{data2.formattedAvg}</strong>
                </span>
              </div>
              <div className="h-3.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct2}%` }}
                  className="h-full bg-blush rounded-full transition-all duration-700"
                />
              </div>
            </div>
          </div>

          {/* Longest wait fun stat */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="font-sans text-xs text-cloud/50 block">Longest wait for {data1.name}</span>
              <span className="font-serif text-lg font-semibold text-cloud mt-1 block">
                {data1.formattedLongestGap}
              </span>
              {data1.longestGapDate && (
                <span className="font-sans text-[11px] text-cloud/40">
                  {new Date(data1.longestGapDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="font-sans text-xs text-cloud/50 block">Longest wait for {data2.name}</span>
              <span className="font-serif text-lg font-semibold text-cloud mt-1 block">
                {data2.formattedLongestGap}
              </span>
              {data2.longestGapDate && (
                <span className="font-sans text-[11px] text-cloud/40">
                  {new Date(data2.longestGapDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResponseTime;
