import { useMemo, useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getMilestoneStats, getHighlights, getLateNightStats, getVerbosityStats } from '../lib/stats';
import CountUp from './CountUp';
import LiquidGlassSwitcher from './LiquidGlassSwitcher';

gsap.registerPlugin(ScrollTrigger);

function Milestones({ messages, senders }) {
  const sectionRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const platformCounts = useMemo(() => {
    const counts = { all: (messages || []).length, whatsapp: 0, instagram: 0, telegram: 0 };
    for (const m of messages || []) {
      const p = m.platform || 'whatsapp';
      counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [messages]);

  const filterOptions = useMemo(() => {
    const opts = [{ id: 'all', label: 'All', count: platformCounts.all }];
    if (platformCounts.whatsapp > 0) {
      opts.push({ id: 'whatsapp', label: 'WhatsApp', color: 'var(--color-wa-pink)', count: platformCounts.whatsapp });
    }
    if (platformCounts.instagram > 0) {
      opts.push({ id: 'instagram', label: 'Instagram', color: 'var(--color-ig-pink)', count: platformCounts.instagram });
    }
    if (platformCounts.telegram > 0) {
      opts.push({ id: 'telegram', label: 'Telegram', color: 'var(--color-tg-pink)', count: platformCounts.telegram });
    }
    return opts;
  }, [platformCounts]);

  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all') return messages || [];
    return (messages || []).filter((m) => (m.platform || 'whatsapp') === activeFilter);
  }, [messages, activeFilter]);

  const stats = useMemo(() => getMilestoneStats(filteredMessages, senders), [filteredMessages, senders]);
  const highlights = useMemo(() => getHighlights(filteredMessages), [filteredMessages]);
  const late = useMemo(() => getLateNightStats(filteredMessages, senders), [filteredMessages, senders]);
  const verb = useMemo(() => getVerbosityStats(filteredMessages, senders), [filteredMessages, senders]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.milestone-card', {
        y: 20,
        opacity: 0,
        duration: 0.65,
        stagger: 0.05,
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

  const accentColor =
    activeFilter === 'whatsapp'
      ? 'text-wa-pink'
      : activeFilter === 'instagram'
      ? 'text-ig-pink'
      : activeFilter === 'telegram'
      ? 'text-tg-pink'
      : 'text-pink';

  return (
    <section
      id="milestones"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32"
    >
      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 min-w-0">
          <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold">
            our biggest marks
          </p>

          {/* Liquid Glass Platform Switcher */}
          <LiquidGlassSwitcher
            options={filterOptions}
            activeValue={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-6 sm:mb-8">
          every milestone, counted.
        </h2>

        {/* Source Unification Badge when viewing All and multiple platforms exist */}
        {hasMultipleSources && activeFilter === 'all' && (
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Total Conversations */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-cloud/60 text-xs font-medium">Total Conversations</span>
                {hasMultipleSources && activeFilter === 'all' && (
                  <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-pink/15 text-pink font-semibold">
                    Combined
                  </span>
                )}
              </div>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3`}>
                <CountUp value={stats.totalMessages} />
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              {stats.p1.name}: {stats.p1.messages.toLocaleString()} · {stats.p2.name}: {stats.p2.messages.toLocaleString()}
            </p>
          </div>

          {/* Card 2: Words Typed */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="font-sans text-cloud/60 text-xs font-medium">Words Typed</span>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3`}>
                <CountUp value={stats.totalWords} />
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              {stats.p1.name}: {stats.p1.words.toLocaleString()} · {stats.p2.name}: {stats.p2.words.toLocaleString()}
            </p>
          </div>

          {/* Card 3: Daily Pace */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="font-sans text-cloud/60 text-xs font-medium">Daily Pace</span>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3 flex items-baseline gap-1.5`}>
                <CountUp value={stats.avgMessagesPerDay} />
                <span className="text-sm sm:text-base font-sans font-normal text-cloud/50">msgs/day</span>
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              average sent per day across {stats.daySpan.toLocaleString()} days
            </p>
          </div>

          {/* Card 4: Unbroken Chat Streak */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="font-sans text-cloud/60 text-xs font-medium">Unbroken Chat Streak</span>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3 flex items-baseline gap-1.5`}>
                <CountUp value={stats.longestDailyStreak} />
                <span className="text-sm sm:text-base font-sans font-normal text-cloud/50">days</span>
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              consecutive days without missing a single beat
            </p>
          </div>

          {/* Card 5: Most Talkative Day */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="font-sans text-cloud/60 text-xs font-medium">Most Talkative Day</span>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3 flex items-baseline gap-1.5`}>
                <CountUp value={stats.busiestDay?.count || 0} />
                <span className="text-sm sm:text-base font-sans font-normal text-cloud/50">msgs</span>
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              record set on <strong className="text-cloud/90 font-medium">{stats.busiestDay?.date || '—'}</strong>
            </p>
          </div>

          {/* Card 6: Busiest Month */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="font-sans text-cloud/60 text-xs font-medium">Busiest Month</span>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3 flex items-baseline gap-1.5`}>
                <CountUp value={highlights.busiestMonth?.count || 0} />
                <span className="text-sm sm:text-base font-sans font-normal text-cloud/50">msgs</span>
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              peak volume in <strong className="text-cloud/90 font-medium">{highlights.busiestMonth?.label || '—'}</strong>
            </p>
          </div>

          {/* Card 7: Longest We Went Quiet */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="font-sans text-cloud/60 text-xs font-medium">Longest We Went Quiet</span>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3 flex items-baseline gap-1.5`}>
                <CountUp value={highlights.longestGapDays || 0} />
                <span className="text-sm sm:text-base font-sans font-normal text-cloud/50">days</span>
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              longest pause between messages
            </p>
          </div>

          {/* Card 8: Late-Night Messages */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="font-sans text-cloud/60 text-xs font-medium">Late-Night Messages (12am–4am)</span>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3 tabular-nums`}>
                {late.p1.pct}% · {late.p2.pct}%
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              {stats.p1.name} · {stats.p2.name} (% of own messages)
            </p>
          </div>

          {/* Card 9: Average Message Depth */}
          <div className="milestone-card glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="font-sans text-cloud/60 text-xs font-medium">Average Message Depth</span>
              <div className={`font-serif font-semibold ${accentColor} text-4xl sm:text-5xl my-3 tabular-nums flex items-baseline gap-1.5`}>
                <span>{verb.p1.avg} · {verb.p2.avg}</span>
                <span className="text-sm sm:text-base font-sans font-normal text-cloud/50">words</span>
              </div>
            </div>
            <p className="font-sans text-cloud/70 text-xs pt-2 border-t border-glass-divider">
              {stats.p1.name} · {stats.p2.name} (average words per msg)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Milestones;
