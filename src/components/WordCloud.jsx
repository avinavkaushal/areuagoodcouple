import { useMemo } from 'react';
import { getWordCloudData } from '../lib/stats';

function WordCloud({ messages }) {
  const words = getWordCloudData(messages);
  const max = words.length > 0 ? Math.max(...words.map((w) => w.value)) : 1;
  const min = words.length > 0 ? Math.min(...words.map((w) => w.value)) : 0;

  const styled = useMemo(() => {
    return words.map((w, i) => {
      const t = max === min ? 0.5 : (w.value - min) / (max - min);
      const size = 13 + t * 38; // 13px – 51px
      const rotate = ((i * 37) % 11) - 5; // deterministic pseudo-random, -5deg to 5deg
      const isTop = t > 0.6;
      return { ...w, size, rotate, isTop };
    });
  }, [words, max, min]);

  return (
    <section className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-cloud">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.03] text-[26vw] sm:text-[20vw] leading-none font-semibold"
      >
        ”
      </div>

      <div className="relative z-10">
        <p className="font-sans text-navy/50 text-sm mb-8 sm:mb-12">words we reached for most</p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 max-w-3xl items-baseline">
          {styled.map((w) => (
            <span
              key={w.text}
              style={{
                fontSize: `${w.size}px`,
                transform: `rotate(${w.rotate}deg)`,
              }}
              className={`font-serif inline-block transition-transform hover:scale-110 ${w.isTop ? 'text-pink font-semibold' : 'text-navy/70'}`}
              title={`said ${w.value} times`}
            >
              {w.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WordCloud;