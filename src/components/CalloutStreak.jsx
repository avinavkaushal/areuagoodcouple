import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getCalloutStats } from '../lib/stats';

gsap.registerPlugin(ScrollTrigger);

function CalloutStreak({ messages, senders }) {
  const sectionRef = useRef(null);
  const stats = useMemo(() => getCalloutStats(messages, senders), [messages, senders]);
  const [p1, p2] = stats.senders;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.streak-card', {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
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
      id="streaks"
      ref={sectionRef}
      className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-night"
    >
      <div className="relative z-10 max-w-2xl">
        <p className="font-sans text-pink/80 text-sm mb-4 sm:mb-8">first & last hello</p>

        <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug mb-10 sm:mb-14">
          greetings from dusk till dawn.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Good Morning Card */}
          <div className="streak-card glass rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-cloud">Good Morning</span>
            </div>

            <div className="pt-2">
              <span className="font-sans text-xs text-cloud/50 block">Longest Morning Streak</span>
              <div className="font-serif font-semibold text-pink text-4xl mt-1">
                {stats.morning.longestStreak} <span className="text-lg font-normal text-cloud/60">days</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-xs font-sans text-cloud/70 space-y-1">
              <div>
                Leading sender: <strong className="text-pink font-semibold">{stats.morning.leader}</strong>
              </div>
              <div className="text-cloud/50">
                {p1}: {stats.morning.counts[p1]} · {p2}: {stats.morning.counts[p2]}
              </div>
            </div>
          </div>

          {/* Good Night Card */}
          <div className="streak-card glass rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-cloud">Good Night</span>
            </div>

            <div className="pt-2">
              <span className="font-sans text-xs text-cloud/50 block">Longest Night Streak</span>
              <div className="font-serif font-semibold text-pink text-4xl mt-1">
                {stats.night.longestStreak} <span className="text-lg font-normal text-cloud/60">days</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-xs font-sans text-cloud/70 space-y-1">
              <div>
                Leading sender: <strong className="text-pink font-semibold">{stats.night.leader}</strong>
              </div>
              <div className="text-cloud/50">
                {p1}: {stats.night.counts[p1]} · {p2}: {stats.night.counts[p2]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CalloutStreak;
