import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getReactionStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function ReactionStats({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getReactionStats(messages, senders), [messages, senders]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.reaction-card', {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
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

  if (!stats || stats.totalReactionsSent === 0) {
    return null;
  }

  const [p1 = 'Her', p2 = 'Him'] = senders || ['Her', 'Him'];
  const p1Rate = stats.reactionRates[p1];
  const p2Rate = stats.reactionRates[p2];

  return (
    <section
      id="reactions"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy"
    >
      <div className="relative z-10 max-w-3xl">
        <p className="font-sans text-blush/70 text-sm mb-4 sm:mb-8">our reaction chemistry</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug mb-10 sm:mb-14">
          {stats.reactionRates.leader}&apos;s messages get reacted to{' '}
          <strong className="text-pink font-semibold">
            {stats.reactionRates[stats.reactionRates.leader].rate}%
          </strong>{' '}
          of the time.
        </p>

        {/* Total Reactions Sent: Split Bar */}
        <div className="reaction-card glass rounded-2xl p-6 sm:p-8 space-y-4 mb-6">
          <div className="flex justify-between items-baseline font-serif text-cloud text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink inline-block" />
              <span>
                {p1} ({stats.reactionsSent[p1].pct}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                {p2} ({stats.reactionsSent[p2].pct}%)
              </span>
              <span className="w-3 h-3 rounded-full bg-blush inline-block" />
            </div>
          </div>

          <div className="h-4 w-full bg-white/10 rounded-full flex overflow-hidden p-0.5">
            <div
              style={{ width: `${stats.reactionsSent[p1].pct}%` }}
              className="h-full bg-pink rounded-l-full transition-all duration-700"
            />
            <div
              style={{ width: `${stats.reactionsSent[p2].pct}%` }}
              className="h-full bg-blush rounded-r-full transition-all duration-700"
            />
          </div>

          <div className="flex justify-between text-xs font-sans text-cloud/50">
            <span>{stats.reactionsSent[p1].count.toLocaleString()} reactions given</span>
            <span>{stats.reactionsSent[p2].count.toLocaleString()} reactions given</span>
          </div>
        </div>

        {/* Reaction Rates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Card: P1 Engagement Rate */}
          <div className="reaction-card glass rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold">
                {p1}&apos;s Message Engagement
              </span>
              <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2">
                {p1Rate.rate}%
              </div>
              <p className="font-sans text-cloud/70 text-xs mt-1">
                {p1Rate.messagesReacted.toLocaleString()} of {p1Rate.totalMessages.toLocaleString()} messages got a
                reaction from {p2}
              </p>
            </div>
          </div>

          {/* Card: P2 Engagement Rate */}
          <div className="reaction-card glass rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="font-sans text-xs uppercase tracking-wider text-blush font-semibold">
                {p2}&apos;s Message Engagement
              </span>
              <div className="font-serif font-semibold text-blush text-4xl sm:text-5xl my-2">
                {p2Rate.rate}%
              </div>
              <p className="font-sans text-cloud/70 text-xs mt-1">
                {p2Rate.messagesReacted.toLocaleString()} of {p2Rate.totalMessages.toLocaleString()} messages got a
                reaction from {p1}
              </p>
            </div>
          </div>
        </div>

        {/* Most-Used Reaction Emojis (Reusing EmojiStats layout) */}
        {stats.comparison.rows.length > 0 && (
          <div className="reaction-card glass rounded-2xl p-6 sm:p-8 space-y-6 mb-6">
            <div className="flex justify-between items-center font-serif text-base sm:text-lg pb-3 border-b border-white/10">
              <span className="text-pink font-semibold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink inline-block" />
                {p1}&apos;s Reactions
              </span>
              <span className="text-xs text-cloud/40 font-sans uppercase tracking-wider">
                Top Reaction Emojis
              </span>
              <span className="text-blush font-semibold flex items-center gap-2">
                {p2}&apos;s Reactions
                <span className="w-2.5 h-2.5 rounded-full bg-blush inline-block" />
              </span>
            </div>

            <div className="space-y-3">
              {stats.comparison.rows.map((r) => (
                <div key={r.emoji} className="flex items-center gap-3">
                  {/* Left (P1) Bar */}
                  <div className="flex-1 flex justify-end items-center gap-2">
                    <span className="font-sans text-cloud/50 text-xs w-6 text-right font-mono">
                      {r.left || ''}
                    </span>
                    <div
                      className="h-3 bg-pink rounded-l-full transition-all duration-500"
                      style={{
                        width: `${(r.left / stats.comparison.maxVal) * 100}%`,
                        minWidth: r.left ? '4px' : '0px',
                      }}
                    />
                  </div>

                  <span className="text-xl w-8 text-center shrink-0">{r.emoji}</span>

                  {/* Right (P2) Bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="h-3 bg-blush rounded-r-full transition-all duration-500"
                      style={{
                        width: `${(r.right / stats.comparison.maxVal) * 100}%`,
                        minWidth: r.right ? '4px' : '0px',
                      }}
                    />
                    <span className="font-sans text-cloud/50 text-xs w-6 font-mono">
                      {r.right || ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reaction Timing Card (Conditional) */}
        <div className="reaction-card glass rounded-2xl p-6">
          {stats.timing.hasReactionTimestamps ? (
            <div className="space-y-4">
              <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold">
                Reaction Response Latency
              </span>
              <div className="grid grid-cols-2 gap-4 text-center sm:text-left">
                <div>
                  <span className="text-xs text-cloud/60 font-sans">{p1} Reacts In:</span>
                  <div className="font-serif text-2xl font-semibold text-pink mt-1">
                    {stats.timing[p1].formattedAvg || '—'}
                  </div>
                  {stats.timing[p1].formattedFastest && (
                    <span className="text-[11px] text-cloud/50 font-sans">
                      fastest: {stats.timing[p1].formattedFastest}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-cloud/60 font-sans">{p2} Reacts In:</span>
                  <div className="font-serif text-2xl font-semibold text-blush mt-1">
                    {stats.timing[p2].formattedAvg || '—'}
                  </div>
                  {stats.timing[p2].formattedFastest && (
                    <span className="text-[11px] text-cloud/50 font-sans">
                      fastest: {stats.timing[p2].formattedFastest}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-cloud/50 text-xs font-sans">
              <svg className="w-4 h-4 text-pink/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Reaction timestamps are omitted in this export format (fastest reaction speed unavailable).
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ReactionStats;
