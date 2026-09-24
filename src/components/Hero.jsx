import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { formatDuration, formatSinceDate } from '../lib/stats';
import heroWebm from '../assets/hero-bg.webm';
import heroMp4 from '../assets/hero-bg.mp4';
import heroPoster from '../assets/hero-bg-poster.jpg';

function Hero({ messages, senders }) {
  const lettersRef = useRef(null);
  const subRef = useRef(null);
  const heartRef = useRef(null);
  const videoRef = useRef(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const word = `${p1}${p2}`;

  const firstDate = messages?.[0]?.date;
  const lastDate = messages?.[messages?.length - 1]?.date;
  const duration = formatDuration(firstDate, lastDate);
  const sinceDate = formatSinceDate(firstDate);

  // Subscribe to prefers-reduced-motion media query changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Ensure reliable autoplay across Safari, Chrome, and iOS
  useEffect(() => {
    if (prefersReducedMotion) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('Hero video autoplay error:', err);
        });
      }
    };

    playVideo();
    video.addEventListener('loadeddata', playVideo);
    video.addEventListener('canplay', playVideo);

    return () => {
      video.removeEventListener('loadeddata', playVideo);
      video.removeEventListener('canplay', playVideo);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const letters = lettersRef.current?.querySelectorAll('span');
      if (!letters || letters.length === 0) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(letters, {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.05,
      })
        .from(subRef.current, { opacity: 0, y: 10, duration: 0.6 }, '-=0.3')
        .from(heartRef.current, { opacity: 0, scale: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.2');
    });

    return () => ctx.revert();
  }, [word]);

  return (
    <section className="relative overflow-hidden bg-black isolate py-24 sm:py-32 flex flex-col justify-center px-8 sm:px-16 min-h-[75vh] sm:min-h-[85vh]">
      {/* Background Video / Static Poster for reduced motion */}
      {prefersReducedMotion ? (
        <img
          src={heroPoster}
          alt=""
          aria-hidden="true"
          style={{ objectPosition: '82% center' }}
          className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={heroPoster}
          preload="auto"
          style={{ objectPosition: '82% center' }}
          className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none"
        >
          <source src={heroWebm} type="video/webm" />
          <source src={heroMp4} type="video/mp4" />
        </video>
      )}

      {/* Subtle black gradient scrim for text legibility (stronger on left, clear on center/right) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent pointer-events-none z-[1]"
      />

      {/* Decorative ambient watermark heart */}
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-pink/[0.04] text-[22vw] sm:text-[18vw] leading-none font-semibold z-0"
      >
        ♥
      </div>

      {/* Hero content */}
      <div className="max-w-3xl relative z-10">
        <h1
          ref={lettersRef}
          className="font-serif font-semibold text-cloud leading-none text-[18vw] sm:text-[9vw] flex flex-wrap drop-shadow-md"
        >
          {word.split('').map((ch, i) => (
            <span key={i} className="inline-block">{ch === ' ' ? '\u00A0' : ch}</span>
          ))}
        </h1>

        <div className="flex items-center gap-3 mt-6 sm:mt-8">
          <svg ref={heartRef} width="22" height="20" viewBox="0 0 22 20" fill="none">
            <path
              d="M11 19C11 19 1 12.5 1 6.5C1 3 3.5 1 6.5 1C8.5 1 10 2 11 3.5C12 2 13.5 1 15.5 1C18.5 1 21 3 21 6.5C21 12.5 11 19 11 19Z"
              stroke="#FF85BB"
              strokeWidth="1.5"
            />
          </svg>
          <p ref={subRef} className="font-sans text-cloud/85 text-sm sm:text-base tracking-tight font-medium drop-shadow-sm">
            {duration}, one chat{sinceDate ? `, since ${sinceDate}` : ''}
          </p>
        </div>
      </div>
    </section>
  );
}

export default Hero;