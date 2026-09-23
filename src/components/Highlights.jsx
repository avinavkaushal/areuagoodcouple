import { getHighlights, getLateNightStats, getVerbosityStats } from '../lib/stats';

function Highlights({ messages }) {
  const h = getHighlights(messages);
  const late = getLateNightStats(messages);
  const verb = getVerbosityStats(messages);

  const rows = [
    { label: 'busiest day', value: h.busiestDay?.count, detail: h.busiestDay?.label, size: 'text-5xl sm:text-6xl' },
    { label: 'longest we talked, daily, in a row', value: `${h.longestStreak}`, detail: 'days in a row', size: 'text-5xl sm:text-6xl' },
    { label: 'busiest month', value: h.busiestMonth?.count, detail: h.busiestMonth?.label, size: 'text-4xl sm:text-5xl' },
    { label: 'longest we went quiet', value: h.longestGapDays, detail: 'days apart', size: 'text-4xl sm:text-5xl' },
    { label: 'late-night messages (12am – 4am)', value: `${late.her.pct}% · ${late.him.pct}%`, detail: 'Her · Him (% of own messages)', size: 'text-3xl sm:text-4xl' },
    { label: 'average words per message', value: `${verb.her} · ${verb.him}`, detail: 'Her · Him (words/msg)', size: 'text-3xl sm:text-4xl' },
  ];

  return (
    <section className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-blush">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.04] text-[24vw] sm:text-[18vw] leading-none"
      >
        ★
      </div>

      <div className="relative z-10">
        <p className="font-sans text-navy/50 text-sm mb-8 sm:mb-12">moments worth marking</p>

        <div className="max-w-2xl space-y-4">
          {rows.map((r) => (
            <div
              key={r.label}
              className="glass rounded-2xl p-6 flex items-baseline justify-between gap-6"
            >
              <p className="font-sans text-navy/70 text-sm sm:text-base max-w-[50%]">{r.label}</p>
              <div className="text-right">
                <span className={`font-serif font-semibold text-navy ${r.size}`}>{r.value}</span>
                {r.detail && <p className="font-sans text-navy/50 text-xs mt-1">{r.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Highlights;