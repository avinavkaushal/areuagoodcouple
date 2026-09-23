import { useEffect, useRef } from 'react';
import gsap from 'gsap';

function Outro({ messages }) {
  const heartRef = useRef(null);
  const textRef = useRef(null);
  const sectionRef = useRef(null);

  const first = messages?.[0]?.date;
  const dayCount = first ? Math.round((new Date() - first) / (1000 * 60 * 60 * 24)) : 0;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from([heartRef.current, textRef.current], {
        opacity: 0,
        y: 16,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
      });
      gsap.to(heartRef.current, {
        scale: 1.12,
        duration: 0.8,
        delay: 1.2,
        repeat: 3,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col items-center justify-center bg-navy px-8 py-24 sm:py-32 text-center"
    >
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-cloud/[0.03] text-[24vw] sm:text-[18vw] leading-none font-semibold"
      >
        ♥
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <svg ref={heartRef} width="32" height="29" viewBox="0 0 22 20" fill="none" className="mb-6">
          <path
            d="M11 19C11 19 1 12.5 1 6.5C1 3 3.5 1 6.5 1C8.5 1 10 2 11 3.5C12 2 13.5 1 15.5 1C18.5 1 21 3 21 6.5C21 12.5 11 19 11 19Z"
            stroke="#FF85BB"
            strokeWidth="1.5"
          />
        </svg>

        <p ref={textRef} className="font-serif text-cloud text-2xl sm:text-4xl max-w-xl leading-snug">
          {dayCount.toLocaleString()} days since the first message.<br />
          Her & Him, still talking.
        </p>
      </div>
    </section>
  );
}

export default Outro;