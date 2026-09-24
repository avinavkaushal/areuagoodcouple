import { useEffect, useRef } from 'react';
import gsap from 'gsap';

function Outro({ messages, senders }) {
  const textRef = useRef(null);
  const sectionRef = useRef(null);

  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const first = messages?.[0]?.timestamp || messages?.[0]?.date;
  const last = messages?.[messages?.length - 1]?.timestamp || messages?.[messages?.length - 1]?.date;
  const dayCount = first && last
    ? Math.max(1, Math.round((new Date(last).getTime() - new Date(first).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current, {
        opacity: 0,
        y: 16,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col items-center justify-center bg-midnight px-8 py-24 sm:py-32 text-center"
    >
      <div className="relative z-10 flex flex-col items-center">

        <p ref={textRef} className="font-serif text-cloud text-2xl sm:text-4xl max-w-xl leading-snug">
          {dayCount.toLocaleString()} days since the first message.<br />
          {p1} &amp; {p2}, still talking.
        </p>
      </div>
    </section>
  );
}

export default Outro;