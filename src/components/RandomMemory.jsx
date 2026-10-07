import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getRandomMemory } from '../lib/stats';
import GlassButton from './GlassButton';

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
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', clearProps: 'transform,opacity' }
      );
    }
    setMemory(next);
  }, [messages]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.memory-container', {
        y: 20,
        opacity: 0,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 82%',
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
      className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32"
    >
      <div className="memory-container relative z-10 max-w-3xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          a random bookmark
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold">
            frozen in time.
          </h2>

          <GlassButton
            text="Roll another memory"
            onClick={pickMemory}
            icon="sparkle"
            className="self-start sm:self-auto shrink-0"
          />
        </div>

        {/* Quoted conversation block with Apple iMessage liquid bubble aesthetic */}
        <div ref={cardRef} className="glass glass-lift rounded-3xl p-6 sm:p-9 space-y-5">
          <div className="space-y-4">
            {memory.messages.map((m, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink inline-block dark:shadow-[0_0_8px_var(--color-pink)]" />
                  <span className="font-sans font-bold text-xs text-pink">{m.sender}</span>
                </div>
                <div className="glass-chip rounded-2xl p-4 sm:p-5 border border-glass-divider">
                  <p className="font-serif italic text-cloud text-base sm:text-lg leading-relaxed">
                    &ldquo;{m.text}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-glass-divider flex justify-between items-center text-xs font-sans text-cloud/50">
            <span>Sent on <strong className="text-cloud/80 font-semibold">{memory.date}</strong></span>
            <span className="font-mono text-cloud/40">{memory.time}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RandomMemory;
