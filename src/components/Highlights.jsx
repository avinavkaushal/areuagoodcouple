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
      opts.push({ id: 'whatsapp', label: 'WhatsApp', color: '#25D366', count: platformCounts.whatsapp });
    }
    if (platformCounts.instagram > 0) {
      opts.push({ id: 'instagram', label: 'Instagram', color: '#8A2BE2', count: platformCounts.instagram });
    }
    if (platformCounts.telegram > 0) {
      opts.push({ id: 'telegram', label: 'Telegram', color: '#2AABEE', count: platformCounts.telegram });
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
      ? 'text-[#25D366]'
      : activeFilter === 'instagram'
      ? 'text-[#8A2BE2]'
      : activeFilter === 'telegram'
      ? 'text-[#2AABEE]'
      : 'text-pink';

  const rows = [
    { label: 'busiest day', value: h.busiestDay?.count?.toLocaleString() || 0, detail: h.busiestDay?.label, size: 'text-5xl sm:text-6xl' },
    { label: 'longest we talked, daily, in a row', value: `${h.longestStreak}`, detail: 'days in a row', size: 'text-5xl sm:text-6xl' },
    { label: 'busiest month', value: h.busiestMonth?.count?.toLocaleString() || 0, detail: h.busiestMonth?.label, size: 'text-4xl sm:text-5xl' },
    { label: 'longest we went quiet', value: h.longestGapDays, detail: 'days apart', size: 'text-4xl sm:text-5xl' },
    { label: 'late-night messages (12am – 4am)', value: `${late.p1.pct}% · ${late.p2.pct}%`, detail: `${p1} · ${p2} (% of own messages)`, size: 'text-3xl sm:text-4xl' },
    { label: 'average words per message', value: `${verb.p1.avg} · ${verb.p2.avg}`, detail: `${p1} · ${p2} (words/msg)`, size: 'text-3xl sm:text-4xl' },
  ];

  return (
    <section id="highlights" className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <p className="font-sans text-blush/70 text-sm">moments worth marking</p>

          {/* Liquid Glass Switcher */}
          <LiquidGlassSwitcher
            options={filterOptions}
            activeValue={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        <div className="max-w-2xl space-y-4">
          {rows.map((r) => (
            <div
              key={r.label}
              className="glass rounded-2xl p-6 flex items-baseline justify-between gap-6"
            >
              <p className="font-sans text-cloud/80 text-sm sm:text-base max-w-[50%]">{r.label}</p>
              <div className="text-right">
                <span className={`font-serif font-semibold ${accentColor} ${r.size}`}>{r.value}</span>
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