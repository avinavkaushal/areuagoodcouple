import { getHeatmapData, getPeakSlot } from '../lib/stats';

const DAY_LETTERS = ['S','M','T','W','T','F','S'];

function ActivityHeatmap({ messages }) {
  const grid = getHeatmapData(messages);
  const peak = getPeakSlot(grid);
  const max = Math.max(...grid.flat(), 1);

  return (
    <section id="activity" className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-night">
      <div className="relative z-10">
        <p className="font-sans text-pink/80 text-sm mb-4 sm:mb-8">our loudest hour</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug max-w-2xl mb-12 sm:mb-16">
          {peak.dayName}s around {peak.hourLabel}, we talk the most.
        </p>

        <div className="overflow-x-auto pb-2">
          <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `20px repeat(24, 1fr)` }}>
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="w-3.5" />
            ))}

            {grid.map((row, d) => (
              <FragmentRow key={d} letter={DAY_LETTERS[d]} row={row} max={max} />
            ))}
          </div>
        </div>
        <p className="font-sans text-cloud/40 text-xs mt-4">each row a day · each dot an hour, midnight to 11pm</p>
      </div>
    </section>
  );
}

function FragmentRow({ letter, row, max }) {
  return (
    <>
      <div className="font-sans text-cloud/40 text-xs flex items-center">{letter}</div>
      {row.map((count, h) => {
        const size = count ? 4 + (count / max) * 10 : 2;
        return (
          <div key={h} className="w-3.5 h-3.5 flex items-center justify-center">
            <div
              className={`rounded-full ${count ? 'bg-pink' : 'bg-white/15'}`}
              style={{ width: size, height: size, opacity: count ? 0.4 + (count / max) * 0.6 : 1 }}
            />
          </div>
        );
      })}
    </>
  );
}

export default ActivityHeatmap;