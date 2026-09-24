import { useMemo } from 'react';
import { getHighlights, getLateNightStats, getVerbosityStats } from '../lib/stats';

function Highlights({ messages, senders }) {
  const [p1 = 'Aru', p2 = 'Avu'] = senders && senders.length === 2 ? senders : ['Aru', 'Avu'];

  const h = useMemo(() => getHighlights(messages), [messages]);
  const late = useMemo(() => getLateNightStats(messages, senders), [messages, senders]);
  const verb = useMemo(() => getVerbosityStats(messages, senders), [messages, senders]);

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
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-white/[0.04] text-[24vw] sm:text-[18vw] leading-none"
      >
        ★
      </div>

      <div className="relative z-10">
        <p className="font-sans text-blush/70 text-sm mb-8 sm:mb-12">moments worth marking</p>

        <div className="max-w-2xl space-y-4">
          {rows.map((r) => (
            <div
              key={r.label}
              className="glass rounded-2xl p-6 flex items-baseline justify-between gap-6"
            >
              <p className="font-sans text-cloud/80 text-sm sm:text-base max-w-[50%]">{r.label}</p>
              <div className="text-right">
                <span className={`font-serif font-semibold text-pink ${r.size}`}>{r.value}</span>
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