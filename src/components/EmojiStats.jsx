import { useMemo } from 'react';
import { getEmojiComparison } from '../lib/stats';

function EmojiStats({ messages, senders }) {
  const { order, rows, maxVal } = useMemo(
    () => getEmojiComparison(messages, senders),
    [messages, senders]
  );

  return (
    <section id="emoji" className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-white/[0.04] text-[22vw] sm:text-[18vw] leading-none"
      >
        ☺
      </div>

      <div className="relative z-10">
        <p className="font-sans text-blush/70 text-sm mb-4 sm:mb-8">who reaches for what</p>

        <div className="flex justify-between max-w-2xl mb-6 font-serif text-lg">
          <span className="text-pink font-semibold">{order[0]}</span>
          <span className="text-blush font-semibold">{order[1]}</span>
        </div>

        <div className="max-w-2xl space-y-3">
          {rows.map((r) => (
            <div key={r.emoji} className="flex items-center gap-3">
              <div className="flex-1 flex justify-end items-center gap-2">
                <span className="font-sans text-cloud/50 text-xs w-6 text-right">
                  {r.left || ''}
                </span>
                <div
                  className="h-3 bg-pink rounded-l-full transition-all duration-500"
                  style={{ width: `${(r.left / maxVal) * 100}%`, minWidth: r.left ? '4px' : 0 }}
                />
              </div>

              <span className="text-xl w-8 text-center shrink-0">{r.emoji}</span>

              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-3 bg-blush rounded-r-full transition-all duration-500"
                  style={{ width: `${(r.right / maxVal) * 100}%`, minWidth: r.right ? '4px' : 0 }}
                />
                <span className="font-sans text-cloud/50 text-xs w-6">{r.right || ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default EmojiStats;