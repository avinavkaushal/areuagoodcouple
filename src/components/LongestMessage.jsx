import { useMemo, useState } from 'react';
import { getLongestMessage } from '../lib/stats';
import CountUp from './CountUp';

function LongestMessage({ messages, senders }) {
  const longest = useMemo(() => getLongestMessage(messages, senders), [messages, senders]);
  const [isExpanded, setIsExpanded] = useState(false);

  const dateStr = longest.date
    ? new Date(longest.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const isLong = (longest.text || '').length > 400;
  const displayedText = isLong && !isExpanded ? `${longest.text.slice(0, 380)}...` : longest.text;

  return (
    <section id="longest-message" className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32">
      <div className="relative z-10 max-w-3xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          the longest monologue
        </p>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-8 sm:mb-10">
          when words spilled over.
        </h2>

        {/* Word count dominant stat */}
        <div className="mb-8">
          <div className="font-serif font-semibold text-pink text-6xl sm:text-7xl leading-none">
            <CountUp value={longest.wordCount} />
          </div>
          <p className="font-sans text-cloud/70 text-sm sm:text-base mt-2 font-medium">
            words typed in one breath by <strong className="text-cloud font-semibold">{longest.sender}</strong>
          </p>
        </div>

        {/* Quoted message block */}
        <div className="glass glass-lift rounded-3xl p-6 sm:p-9 space-y-4">
          <p className="font-serif italic text-cloud/95 text-base sm:text-lg leading-relaxed break-words">
            &ldquo;{displayedText}&rdquo;
          </p>

          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-sans text-pink hover:text-blush font-semibold underline cursor-pointer"
            >
              {isExpanded ? 'Show less' : 'Read full message'}
            </button>
          )}

          {dateStr && (
            <p className="font-sans text-cloud/50 text-xs pt-3 border-t border-glass-divider">
              Sent on {dateStr}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default LongestMessage;
