import { useMemo } from 'react';
import { getEmojiComparison } from '../lib/stats';

function EmojiStats({ messages, senders }) {
  const { order, rows, maxVal } = useMemo(
    () => getEmojiComparison(messages, senders),
    [messages, senders]
  );

  return (
    <section id="emoji" className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32">
      <div className="relative z-10 max-w-3xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          who reaches for what
        </p>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-8 sm:mb-12">
          favorite expressions &amp; reactions.
        </h2>

        <div className="glass glass-lift rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex justify-between font-serif text-base sm:text-lg pb-3 border-b border-glass-divider">
            <span className="text-pink font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink dark:shadow-[0_0_8px_var(--color-pink)] inline-block" />
              {order[0]}
            </span>
            <span className="text-xs text-cloud/40 font-sans uppercase tracking-wider font-semibold">
              Emoji Leaderboard
            </span>
            <span className="text-blush font-semibold flex items-center gap-2">
              {order[1]}
              <span className="w-2.5 h-2.5 rounded-full bg-blush dark:shadow-[0_0_8px_var(--color-blush)] inline-block" />
            </span>
          </div>

          <div className="space-y-3.5">
            {rows.map((r) => (
              <div key={r.emoji} className="flex items-center gap-3 group">
                <div className="flex-1 flex justify-end items-center gap-2.5">
                  <span className="font-mono text-cloud/50 text-xs w-8 text-right tabular-nums">
                    {r.left || ''}
                  </span>
                  <div
                    className="h-3.5 bg-pink rounded-l-full transition-all duration-500 dark:shadow-[0_0_8px_rgba(255,133,187,0.3)]"
                    style={{ width: `${(r.left / maxVal) * 100}%`, minWidth: r.left ? '4px' : 0 }}
                  />
                </div>

                <span className="text-2xl w-10 text-center shrink-0 transition-transform duration-300 group-hover:scale-135 select-none">
                  {r.emoji}
                </span>

                <div className="flex-1 flex items-center gap-2.5">
                  <div
                    className="h-3.5 bg-blush rounded-r-full transition-all duration-500 dark:shadow-[0_0_8px_rgba(255,206,227,0.3)]"
                    style={{ width: `${(r.right / maxVal) * 100}%`, minWidth: r.right ? '4px' : 0 }}
                  />
                  <span className="font-mono text-cloud/50 text-xs w-8 tabular-nums">
                    {r.right || ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmojiStats;