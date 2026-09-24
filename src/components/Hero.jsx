import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { formatDuration, formatSinceDate } from '../lib/stats';
import heroWebm from '../assets/hero-bg.webm';
import heroMp4 from '../assets/hero-bg.mp4';
import heroPoster from '../assets/hero-bg-poster.jpg';

function Hero({ messages, senders, herName, himName, rawSenders }) {
  const lettersRef = useRef(null);
  const subRef = useRef(null);
  const videoRef = useRef(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Resolve input names: him on left, her on right (or input names in order)
  const name1 = himName || rawSenders?.[0] || (senders && senders[1]) || 'Him';
  const name2 = herName || rawSenders?.[1] || (senders && senders[0]) || 'Her';

  const firstDate = messages?.[0]?.timestamp || messages?.[0]?.date;
  const lastDate = messages?.[messages?.length - 1]?.timestamp || messages?.[messages?.length - 1]?.date;
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
      const letters = lettersRef.current?.querySelectorAll('.hero-anim-item');
      if (!letters || letters.length === 0) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(letters, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.035,
      })
        .from(subRef.current, { opacity: 0, y: 10, duration: 0.6 }, '-=0.3');
    });

    return () => ctx.revert();
  }, [name1, name2]);

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

      {/* Subtle black gradient scrim for text legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent pointer-events-none z-[1]"
      />

      {/* Hero content */}
      <div className="max-w-4xl relative z-10">
        <h1
          ref={lettersRef}
          className="font-serif font-semibold text-cloud leading-tight text-[11vw] sm:text-[6vw] md:text-[5vw] flex flex-wrap items-center gap-x-2 sm:gap-x-4 drop-shadow-md select-none"
        >
          <span className="inline-flex items-center flex-wrap">
            {name1.split('').map((ch, i) => (
              <span key={`p1-${i}`} className="hero-anim-item inline-block">
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </span>

          <span
            className="hero-anim-item inline-flex items-center justify-center text-pink mx-1 sm:mx-2 scale-90 sm:scale-100"
            aria-label="love"
          >
            <svg
              className="w-[0.72em] h-[0.72em] fill-current text-pink drop-shadow-[0_0_16px_rgba(255,133,187,0.7)] animate-pulse"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>

          <span className="inline-flex items-center flex-wrap">
            {name2.split('').map((ch, i) => (
              <span key={`p2-${i}`} className="hero-anim-item inline-block">
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </span>
        </h1>

        <div className="mt-6 sm:mt-8">
          <p ref={subRef} className="font-sans text-cloud/85 text-sm sm:text-base tracking-tight font-medium drop-shadow-sm">
            {duration}, one chat{sinceDate ? `, since ${sinceDate}` : ''}
          </p>
        </div>
      </div>
    </section>
  );
}

export default Hero;