import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getMilestoneStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function Milestones({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getMilestoneStats(messages, senders), [messages, senders]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.milestone-card', {
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

  return (
    <section
      id="milestones"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy"
    >
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-white/[0.04] text-[24vw] sm:text-[18vw] leading-none font-semibold"
      >
        ∞
      </div>

      <div className="relative z-10 max-w-3xl">
        <p className="font-sans text-blush/70 text-sm mb-4 sm:mb-8">our biggest marks</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug mb-10 sm:mb-14">
          every milestone, counted.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Total Messages */}
          <div className="milestone-card glass rounded-2xl p-6">
            <span className="font-sans text-cloud/60 text-xs">Total Conversations</span>
            <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2">
              {stats.totalMessages.toLocaleString()}
            </div>
            <p className="font-sans text-cloud/70 text-xs mt-1">
              {stats.p1.name}: {stats.p1.messages.toLocaleString()} · {stats.p2.name}: {stats.p2.messages.toLocaleString()}
            </p>
          </div>

          {/* Card 2: Total Words */}
          <div className="milestone-card glass rounded-2xl p-6">
            <span className="font-sans text-cloud/60 text-xs">Words Typed</span>
            <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2">
              {stats.totalWords.toLocaleString()}
            </div>
            <p className="font-sans text-cloud/70 text-xs mt-1">
              {stats.p1.name}: {stats.p1.words.toLocaleString()} · {stats.p2.name}: {stats.p2.words.toLocaleString()}
            </p>
          </div>

          {/* Card 3: Daily Average */}
          <div className="milestone-card glass rounded-2xl p-6">
            <span className="font-sans text-cloud/60 text-xs">Daily Pace</span>
            <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2">
              {stats.avgMessagesPerDay.toLocaleString()}
            </div>
            <p className="font-sans text-cloud/70 text-xs mt-1">
              average messages sent per day across {stats.daySpan} days
            </p>
          </div>

          {/* Card 4: Longest Streak */}
          <div className="milestone-card glass rounded-2xl p-6">
            <span className="font-sans text-cloud/60 text-xs">Unbroken Chat Streak</span>
            <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2">
              {stats.longestDailyStreak}
            </div>
            <p className="font-sans text-cloud/70 text-xs mt-1">
              consecutive days without missing a single beat
            </p>
          </div>

          {/* Card 5: Busiest Day (Span 2 cols on tablet+) */}
          {stats.busiestDay && (
            <div className="milestone-card glass rounded-2xl p-6 sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-sans text-cloud/60 text-xs">Our Most Talkative Day</span>
                <p className="font-serif text-xl sm:text-2xl font-semibold text-cloud mt-1">
                  {stats.busiestDay.date}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="font-serif font-semibold text-pink text-3xl sm:text-4xl">
                  {stats.busiestDay.count.toLocaleString()}
                </span>
                <p className="font-sans text-cloud/60 text-xs">messages sent</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Milestones;
