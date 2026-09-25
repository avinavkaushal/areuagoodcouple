import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getMediaBreakdownStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function MediaBreakdown({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getMediaBreakdownStats(messages, senders), [messages, senders]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.media-card', {
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

  const [p1 = 'Her', p2 = 'Him'] = senders || ['Her', 'Him'];
  const hasAnyMedia =
    stats &&
    (stats.totals.totalMediaShared > 0 || stats.totals.storyReplies > 0);

  if (!hasAnyMedia) {
    return null;
  }

  const p1Data = stats[p1] || { photos: 0, videos: 0, reels: 0, storyReplies: 0, totalMediaShared: 0 };
  const p2Data = stats[p2] || { photos: 0, videos: 0, reels: 0, storyReplies: 0, totalMediaShared: 0 };

  const categories = [
    {
      key: 'photos',
      label: 'Photos',
      icon: '📸',
      p1: p1Data.photos,
      p2: p2Data.photos,
      total: stats.totals.photos,
      isDirectMedia: true,
    },
    {
      key: 'videos',
      label: 'Videos',
      icon: '🎥',
      p1: p1Data.videos,
      p2: p2Data.videos,
      total: stats.totals.videos,
      isDirectMedia: true,
    },
    {
      key: 'reels',
      label: 'Reels',
      icon: '🎬',
      p1: p1Data.reels,
      p2: p2Data.reels,
      total: stats.totals.reels,
      isDirectMedia: true,
    },
    {
      key: 'storyReplies',
      label: 'Story Replies',
      icon: '💬',
      p1: p1Data.storyReplies,
      p2: p2Data.storyReplies,
      total: stats.totals.storyReplies,
      isDirectMedia: false,
    },
  ];

  const maxCategoryVal = Math.max(
    ...categories.map((c) => Math.max(c.p1, c.p2)),
    1
  );

  return (
    <section
      id="media-breakdown"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-navy"
    >
      <div className="relative z-10 max-w-3xl">
        <p className="font-sans text-blush/70 text-sm mb-4 sm:mb-8">our visual archives</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug mb-4 sm:mb-6">
          {stats.totals.totalMediaShared.toLocaleString()} media items shared.
        </p>

        {/* Informational badge clarifying story replies separation */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-cloud/60 text-xs font-sans mb-10 max-w-xl">
          <svg className="w-3.5 h-3.5 text-pink shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Story replies are tracked separately from shared media as interactions with Instagram stories.
          </span>
        </div>

        {/* Total media shared summary card */}
        <div className="media-card glass rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold">
              Total Direct Media Exchanged
            </span>
            <span className="text-xs text-cloud/50 font-sans">Photos + Videos + Reels</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center sm:text-left">
            <div className="border-r border-white/10 pr-4">
              <span className="text-xs font-sans text-cloud/60">{p1}</span>
              <div className="font-serif text-3xl sm:text-4xl font-semibold text-pink mt-1">
                {p1Data.totalMediaShared.toLocaleString()}
              </div>
            </div>
            <div className="pl-2">
              <span className="text-xs font-sans text-cloud/60">{p2}</span>
              <div className="font-serif text-3xl sm:text-4xl font-semibold text-blush mt-1">
                {p2Data.totalMediaShared.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Comparison Bars */}
        <div className="media-card glass rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center font-serif text-base sm:text-lg pb-3 border-b border-white/10">
            <span className="text-pink font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink inline-block" />
              {p1}
            </span>
            <span className="text-xs text-cloud/40 font-sans uppercase tracking-wider">
              Category Comparison
            </span>
            <span className="text-blush font-semibold flex items-center gap-2">
              {p2}
              <span className="w-2.5 h-2.5 rounded-full bg-blush inline-block" />
            </span>
          </div>

          <div className="space-y-5">
            {categories.map((c) => {
              const p1Width = (c.p1 / maxCategoryVal) * 100;
              const p2Width = (c.p2 / maxCategoryVal) * 100;

              return (
                <div key={c.key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-cloud/80 font-medium flex items-center gap-1.5">
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                      {!c.isDirectMedia && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-cloud/60">
                          separate
                        </span>
                      )}
                    </span>
                    <span className="text-cloud/40 font-mono">
                      total: {c.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Left (P1) Bar */}
                    <div className="flex-1 flex justify-end items-center gap-2">
                      <span className="font-sans text-cloud/50 text-xs w-8 text-right font-mono">
                        {c.p1.toLocaleString()}
                      </span>
                      <div
                        className="h-3 bg-pink rounded-l-full transition-all duration-500"
                        style={{
                          width: `${p1Width}%`,
                          minWidth: c.p1 > 0 ? '4px' : '0px',
                        }}
                      />
                    </div>

                    <div className="w-2 h-2 rounded-full bg-white/20 shrink-0" />

                    {/* Right (P2) Bar */}
                    <div className="flex-1 flex items-center gap-2">
                      <div
                        className="h-3 bg-blush rounded-r-full transition-all duration-500"
                        style={{
                          width: `${p2Width}%`,
                          minWidth: c.p2 > 0 ? '4px' : '0px',
                        }}
                      />
                      <span className="font-sans text-cloud/50 text-xs w-8 font-mono">
                        {c.p2.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MediaBreakdown;
