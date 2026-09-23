import { useEffect, useRef } from 'react';
import gsap from 'gsap';

function Hero() {
  const lettersRef = useRef(null);
  const subRef = useRef(null);
  const heartRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const letters = lettersRef.current?.querySelectorAll('span');
      if (!letters || letters.length === 0) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(letters, {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.05,
      })
        .from(subRef.current, { opacity: 0, y: 10, duration: 0.6 }, '-=0.3')
        .from(heartRef.current, { opacity: 0, scale: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.2');
    });

    return () => ctx.revert();
  }, []);

  const word = 'AruAvu';

  return (
    <section className="relative overflow-hidden bg-cloud py-24 sm:py-32 flex flex-col justify-center px-8 sm:px-16">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.03] text-[22vw] sm:text-[18vw] leading-none font-semibold"
      >
        ♥
      </div>
      <div className="max-w-3xl relative z-10">
        <h1
          ref={lettersRef}
          className="font-serif font-semibold text-navy leading-none text-[18vw] sm:text-[9vw] flex flex-wrap"
        >
          {word.split('').map((ch, i) => (
            <span key={i} className="inline-block">{ch}</span>
          ))}
        </h1>

        <div className="flex items-center gap-3 mt-6 sm:mt-8">
          <svg ref={heartRef} width="22" height="20" viewBox="0 0 22 20" fill="none">
            <path
              d="M11 19C11 19 1 12.5 1 6.5C1 3 3.5 1 6.5 1C8.5 1 10 2 11 3.5C12 2 13.5 1 15.5 1C18.5 1 21 3 21 6.5C21 12.5 11 19 11 19Z"
              stroke="#FF85BB"
              strokeWidth="1.5"
            />
          </svg>
          <p ref={subRef} className="font-sans text-navy/70 text-sm sm:text-base tracking-tight">
            two years, one chat, since Oct 2024
          </p>
        </div>
      </div>
    </section>
  );
}

export default Hero;