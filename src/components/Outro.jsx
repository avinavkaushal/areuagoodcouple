import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import CountUp from './CountUp';

function Outro({ messages, senders }) {
  const cardRef = useRef(null);
  const sectionRef = useRef(null);

  const [p1 = 'Her', p2 = 'Him'] = senders && senders.length === 2 ? senders : ['Her', 'Him'];
  const first = messages?.[0]?.timestamp || messages?.[0]?.date;
  const last = messages?.[messages?.length - 1]?.timestamp || messages?.[messages?.length - 1]?.date;
  const dayCount = first && last
    ? Math.max(1, Math.round((new Date(last).getTime() - new Date(first).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.75,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%', once: true },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col items-center justify-center px-6 sm:px-14 md:px-20 py-28 sm:py-40 text-center"
    >
      <div className="relative z-10 max-w-2xl mx-auto w-full">
        <div
          ref={cardRef}
          className="glass glass-strong rounded-[36px] p-8 sm:p-14 flex flex-col items-center shadow-2xl space-y-6"
        >
          <div className="w-12 h-12 rounded-full glass-chip flex items-center justify-center text-pink">
            <svg
              className="w-5 h-5 text-pink"
              viewBox="0 0 24 24"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>

          <h2 className="font-serif text-cloud text-3xl sm:text-5xl max-w-xl leading-tight font-semibold">
            <span className="text-pink">
              <CountUp value={dayCount} />
            </span>{' '}
            days since the first message.
          </h2>

          <p className="font-serif italic text-cloud/85 text-xl sm:text-2xl font-normal">
            {p1} &amp; {p2}, still talking.
          </p>

          <div className="pt-4 border-t border-glass-divider w-full flex items-center justify-center gap-2 text-xs font-sans text-cloud/50">
            <span>Built with care · 100% private to both of you</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Outro;