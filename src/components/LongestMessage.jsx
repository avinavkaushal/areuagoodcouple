import { useMemo } from 'react';
import { getLongestMessage } from '../lib/stats';

function LongestMessage({ messages, senders }) {
  const longest = useMemo(() => getLongestMessage(messages, senders), [messages, senders]);

  const dateStr = longest.date
    ? new Date(longest.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <section id="longest-message" className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy">
      <div className="relative z-10 max-w-2xl">
        <p className="font-sans text-blush/70 text-sm mb-4 sm:mb-8">the longest monologue</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug mb-10 sm:mb-12">
          when words spilled over.
        </p>

        {/* Word count dominant stat */}
        <div className="mb-8">
          <div className="font-serif font-semibold text-pink text-6xl sm:text-7xl leading-none">
            {longest.wordCount.toLocaleString()}
          </div>
          <p className="font-sans text-cloud/70 text-sm mt-2">
            words typed in one breath by <strong className="text-cloud font-semibold">{longest.sender}</strong>
          </p>
        </div>

        {/* Quoted message block */}
        <div className="glass rounded-3xl p-6 sm:p-8">
          <p className="font-serif italic text-cloud/90 text-base sm:text-lg leading-relaxed">
            &ldquo;{longest.text}&rdquo;
          </p>
          {dateStr && (
            <p className="font-sans text-cloud/50 text-xs mt-4">
              Sent on {dateStr}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default LongestMessage;
