import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getOverviewStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function Overview({ messages }) {
  const sectionRef = useRef(null);
  const msgRef = useRef(null);
  const wordRef = useRef(null);
  const dayRef = useRef(null);
  const mediaRef = useRef(null);

  const stats = getOverviewStats(messages);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const refs = [
        [msgRef, stats.totalMessages],
        [wordRef, stats.totalWords],
        [dayRef, stats.uniqueDays],
        [mediaRef, stats.totalMedia],
      ];

      refs.forEach(([ref, val]) => {
        const obj = { n: 0 };
        gsap.to(obj, {
          n: val || 0,
          duration: 1.6,
          ease: 'power1.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
          onUpdate: () => {
            if (ref.current) {
              ref.current.textContent = Math.floor(obj.n).toLocaleString();
            }
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [stats.totalMessages, stats.totalWords, stats.uniqueDays, stats.totalMedia]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-blush"
    >
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.04] text-[24vw] sm:text-[18vw] leading-none font-semibold"
      >
        #
      </div>

      <div className="relative z-10">
        <p className="font-sans text-navy/50 text-sm mb-4 sm:mb-8">
          two years, in numbers
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end gap-8 sm:gap-16">
          {/* dominant stat */}
          <div>
            <div
              ref={msgRef}
              className="font-serif font-semibold text-navy text-[16vw] sm:text-[8vw] leading-none"
            >
              0
            </div>
            <p className="font-sans text-navy/60 text-sm mt-2">messages sent</p>
          </div>

          {/* secondary stats, stacked, smaller */}
          <div className="flex flex-wrap sm:flex-col gap-6 sm:gap-5 sm:pb-2">
            <div>
              <div ref={wordRef} className="font-serif font-semibold text-navy text-2xl sm:text-3xl">0</div>
              <p className="font-sans text-navy/60 text-xs mt-0.5">words typed</p>
            </div>
            <div>
              <div ref={dayRef} className="font-serif font-semibold text-navy text-2xl sm:text-3xl">0</div>
              <p className="font-sans text-navy/60 text-xs mt-0.5">days talked</p>
            </div>
            <div>
              <div ref={mediaRef} className="font-serif font-semibold text-navy text-2xl sm:text-3xl">0</div>
              <p className="font-sans text-navy/60 text-xs mt-0.5">media shared</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Overview;