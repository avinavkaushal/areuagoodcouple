import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getRandomMemory } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function RandomMemory({ messages }) {
  const [memory, setMemory] = useState(() => getRandomMemory(messages));
  const cardRef = useRef(null);
  const sectionRef = useRef(null);

  const pickMemory = useCallback(() => {
    const next = getRandomMemory(messages);
    if (!next) return;

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 14, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out' }
      );
    }
    setMemory(next);
  }, [messages]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.memory-container', {
        y: 28,
        opacity: 0,
        duration: 0.8,
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

  if (!memory) return null;

  return (
    <section
      id="memories"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy"
    >
      <div className="memory-container relative z-10 max-w-2xl">
        <p className="font-sans text-blush/70 text-sm mb-4 sm:mb-8">a random bookmark</p>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-10 sm:mb-14">
          <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug">
            frozen in time.
          </p>

          <button
            type="button"
            onClick={pickMemory}
            className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-cloud text-xs font-sans font-semibold tracking-wide active:scale-95 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
          >
            Roll another memory
          </button>
        </div>

        {/* Quoted conversation block */}
        <div ref={cardRef} className="glass rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="space-y-3">
            {memory.messages.map((m, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-xs text-pink">{m.sender}</span>
                </div>
                <p className="font-serif italic text-cloud/90 text-base sm:text-lg leading-relaxed pl-2 border-l-2 border-pink/60">
                  &ldquo;{m.text}&rdquo;
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-sans text-cloud/50">
            <span>Sent on {memory.date}</span>
            <span>{memory.time}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RandomMemory;
