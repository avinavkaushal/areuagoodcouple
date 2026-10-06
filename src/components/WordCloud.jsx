import { useMemo } from 'react';
import { getWordCloudData } from '../lib/stats';

function WordCloud({ messages }) {
  const words = getWordCloudData(messages);
  const max = words.length > 0 ? Math.max(...words.map((w) => w.value)) : 1;
  const min = words.length > 0 ? Math.min(...words.map((w) => w.value)) : 0;

  const styled = useMemo(() => {
    return words.map((w, i) => {
      const t = max === min ? 0.5 : (w.value - min) / (max - min);
      const size = 14 + t * 40; // 14px – 54px
      const rotate = ((i * 37) % 9) - 4; // subtle, -4deg to 4deg
      const isTop = t > 0.6;
      return { ...w, size, rotate, isTop };
    });
  }, [words, max, min]);

  return (
    <section className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32">
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          shared vocabulary
        </p>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-8 sm:mb-12">
          words we reached for most.
        </h2>

        <div className="glass glass-lift rounded-3xl p-8 sm:p-12">
          <div className="flex flex-wrap gap-x-5 gap-y-3 items-baseline justify-center select-none">
            {styled.map((w) => (
              <span
                key={w.text}
                style={{
                  fontSize: `${w.size}px`,
                  transform: `rotate(${w.rotate}deg)`,
                }}
                className={`font-serif inline-block cursor-default transition-all duration-300 hover:scale-115 hover:z-20 ${
                  w.isTop
                    ? 'text-pink font-semibold dark:drop-shadow-[0_0_12px_rgba(255,133,187,0.4)]'
                    : 'text-cloud/75 hover:text-cloud'
                }`}
                title={`said ${w.value} times`}
              >
                {w.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WordCloud;