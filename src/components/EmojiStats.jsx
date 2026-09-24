import { useMemo } from 'react';
import { getEmojiComparison } from '../lib/stats';

function EmojiStats({ messages, senders }) {
  const { order, rows, maxVal } = useMemo(
    () => getEmojiComparison(messages, senders),
    [messages, senders]
  );

  return (
    <section className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-cloud">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.03] text-[22vw] sm:text-[18vw] leading-none"
      >
        ☺
      </div>

      <div className="relative z-10">
        <p className="font-sans text-navy/50 text-sm mb-4 sm:mb-8">who reaches for what</p>

        <div className="flex justify-between max-w-2xl mb-6 font-serif text-navy text-lg">
          <span>{order[0]}</span>
          <span>{order[1]}</span>
        </div>

        <div className="max-w-2xl space-y-3">
          {rows.map((r) => (
            <div key={r.emoji} className="flex items-center gap-3">
              <div className="flex-1 flex justify-end items-center gap-2">
                <span className="font-sans text-navy/50 text-xs w-6 text-right">
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
                  className="h-3 bg-navy rounded-r-full transition-all duration-500"
                  style={{ width: `${(r.right / maxVal) * 100}%`, minWidth: r.right ? '4px' : 0 }}
                />
                <span className="font-sans text-navy/50 text-xs w-6">{r.right || ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default EmojiStats;