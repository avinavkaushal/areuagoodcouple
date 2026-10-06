import { useMemo, useState } from 'react';
import { getHighlights, getLateNightStats, getVerbosityStats } from '../lib/stats';
import LiquidGlassSwitcher from './LiquidGlassSwitcher';

function Highlights({ messages, senders }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];

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

  const h = useMemo(() => getHighlights(filteredMessages), [filteredMessages]);
  const late = useMemo(() => getLateNightStats(filteredMessages, senders), [filteredMessages, senders]);
  const verb = useMemo(() => getVerbosityStats(filteredMessages, senders), [filteredMessages, senders]);

  const accentColor =
    activeFilter === 'whatsapp'
      ? 'text-wa-pink'
      : activeFilter === 'instagram'
      ? 'text-ig-pink'
      : activeFilter === 'telegram'
      ? 'text-tg-pink'
      : 'text-pink';

  const rows = [
    { label: 'busiest day', value: h.busiestDay?.count?.toLocaleString() || '0', detail: h.busiestDay?.label, size: 'text-4xl sm:text-5xl' },
    { label: 'longest streak', value: `${h.longestStreak} days`, detail: 'daily without missing a beat', size: 'text-4xl sm:text-5xl' },
    { label: 'busiest month', value: h.busiestMonth?.count?.toLocaleString() || '0', detail: h.busiestMonth?.label, size: 'text-3xl sm:text-4xl' },
    { label: 'longest we went quiet', value: `${h.longestGapDays} days`, detail: 'longest gap between messages', size: 'text-3xl sm:text-4xl' },
    { label: 'late-night messages (12am – 4am)', value: `${late.p1.pct}% · ${late.p2.pct}%`, detail: `${p1} · ${p2} (% of own messages)`, size: 'text-2xl sm:text-3xl' },
    { label: 'average words per message', value: `${verb.p1.avg} · ${verb.p2.avg}`, detail: `${p1} · ${p2} (words/msg)`, size: 'text-2xl sm:text-3xl' },
  ];

  return (
    <section id="highlights" className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32">
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10 min-w-0">
          <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold">
            moments worth marking
          </p>

          {/* Liquid Glass Switcher */}
          <LiquidGlassSwitcher
            options={filterOptions}
            activeValue={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        <h2 data-reveal="2" className="font-serif text-cloud text-3xl sm:text-5xl leading-tight font-semibold mb-8 sm:mb-10">
          highs, streaks, &amp; quiet nights.
        </h2>

        <div className="space-y-4">
          {rows.map((r) => (
            <div
              key={r.label}
              className="glass glass-lift rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-6"
            >
              <p className="font-sans text-cloud/80 text-sm sm:text-base font-medium capitalize">{r.label}</p>
              <div className="sm:text-right">
                <span className={`font-serif font-semibold tabular-nums ${accentColor} ${r.size}`}>{r.value}</span>
                {r.detail && <p className="font-sans text-cloud/50 text-xs mt-1">{r.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Highlights;