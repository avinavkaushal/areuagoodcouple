import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getMilestoneStats } from '../lib/stats';
import CountUp from './CountUp';

gsap.registerPlugin(ScrollTrigger);

function Milestones({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getMilestoneStats(messages, senders), [messages, senders]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.milestone-card', {
        y: 20,
        opacity: 0,
        duration: 0.65,
        stagger: 0.06,
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

  const platformSources = useMemo(() => {
    const set = new Set();
    for (const m of messages || []) {
      if (m && m.type !== 'system' && m.platform) {
        set.add(m.platform);
      }
    }
    return Array.from(set).map((p) =>
      p === 'instagram' ? 'Instagram' : p === 'telegram' ? 'Telegram' : 'WhatsApp'
    );
  }, [messages]);

  const hasMultipleSources = platformSources.length > 1;

  return (
    <section
      id="milestones"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32"
    >
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold mb-3">
          our biggest marks
        </p>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-6 sm:mb-8">
          every milestone, counted.
        </h2>

        {/* Source Unification Badge */}
        {hasMultipleSources && (
          <div data-reveal className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-chip text-xs font-sans text-cloud/85 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-pink animate-pulse" aria-hidden="true" />
            <span>
              Combined across all sources:{' '}
              <strong className="text-cloud font-semibold">
                {platformSources.join(' + ')}
              </strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Card 1: Total Messages */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="font-sans text-cloud/60 text-xs font-medium">Total Conversations</span>
              {hasMultipleSources && (
                <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-pink/15 text-pink font-semibold">
                  Combined Sources
                </span>
              )}
            </div>
            <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2.5">
              <CountUp value={stats.totalMessages} />
            </div>
            <p className="font-sans text-cloud/70 text-xs mt-1">
              {stats.p1.name}: {stats.p1.messages.toLocaleString()} · {stats.p2.name}: {stats.p2.messages.toLocaleString()}
            </p>
          </div>

          {/* Card 2: Total Words */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7">
            <span className="font-sans text-cloud/60 text-xs font-medium">Words Typed</span>
            <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2.5">
              <CountUp value={stats.totalWords} />
            </div>
            <p className="font-sans text-cloud/70 text-xs mt-1">
              {stats.p1.name}: {stats.p1.words.toLocaleString()} · {stats.p2.name}: {stats.p2.words.toLocaleString()}
            </p>
          </div>

          {/* Card 3: Daily Average */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7">
            <span className="font-sans text-cloud/60 text-xs font-medium">Daily Pace</span>
            <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2.5">
              <CountUp value={stats.avgMessagesPerDay} />
            </div>
            <p className="font-sans text-cloud/70 text-xs mt-1">
              average messages sent per day across {stats.daySpan} days
            </p>
          </div>

          {/* Card 4: Longest Streak */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7">
            <span className="font-sans text-cloud/60 text-xs font-medium">Unbroken Chat Streak</span>
            <div className="font-serif font-semibold text-pink text-4xl sm:text-5xl my-2.5 flex items-baseline gap-2">
              <CountUp value={stats.longestDailyStreak} />
              <span className="text-base sm:text-lg font-sans font-normal text-cloud/60">days</span>
            </div>
            <p className="font-sans text-cloud/70 text-xs mt-1">
              consecutive days without missing a single beat
            </p>
          </div>

          {/* Card 5: Busiest Day (Span 2 cols on tablet+) */}
          {stats.busiestDay && (
            <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-sans text-cloud/60 text-xs font-medium">Our Most Talkative Day</span>
                <p className="font-serif text-xl sm:text-2xl font-semibold text-cloud mt-1">
                  {stats.busiestDay.date}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="font-serif font-semibold text-pink text-3xl sm:text-4xl">
                  <CountUp value={stats.busiestDay.count} />
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
