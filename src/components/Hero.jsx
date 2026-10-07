import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { formatDuration, formatSinceDate } from '../lib/stats';
import heroWebm from '../assets/hero-bg.webm';
import heroMp4 from '../assets/hero-bg.mp4';
import heroPoster from '../assets/hero-bg-poster.jpg';

function splitName(name) {
  const trimmed = String(name || '').trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { first: trimmed, rest: '' };
  }
  return {
    first: trimmed.slice(0, spaceIndex),
    rest: trimmed.slice(spaceIndex), // includes the leading space
  };
}

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
  const name1 = String(himName || rawSenders?.[0] || (senders && senders[1]) || 'Him');
  const name2 = String(herName || rawSenders?.[1] || (senders && senders[0]) || 'Her');
  const name1Parts = splitName(name1);
  const name2Parts = splitName(name2);

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

    // Fallback: force looping if native `loop` doesn't restart playback
    const restart = () => {
      video.currentTime = 0;
      playVideo();
    };

    playVideo();
    video.addEventListener('loadeddata', playVideo);
    video.addEventListener('canplay', playVideo);
    video.addEventListener('ended', restart);

    return () => {
      video.removeEventListener('loadeddata', playVideo);
      video.removeEventListener('canplay', playVideo);
      video.removeEventListener('ended', restart);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const letters = lettersRef.current?.querySelectorAll('.hero-anim-item');
      if (!letters || letters.length === 0) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(letters, {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.025,
        clearProps: 'transform,opacity',
      });
      if (subRef.current) {
        tl.from(subRef.current, { opacity: 0, y: 12, duration: 0.55, clearProps: 'transform,opacity' }, '-=0.25');
      }
    });

    return () => ctx.revert();
  }, [name1, name2]);

  return (
    <section className="relative overflow-hidden isolate py-28 sm:py-36 flex flex-col justify-center px-6 sm:px-14 md:px-20 min-h-[78vh] sm:min-h-[88vh]">
      {/* Background Video / Static Poster for reduced motion */}
      {prefersReducedMotion ? (
        <img
          src={heroPoster}
          alt=""
          aria-hidden="true"
          style={{ objectPosition: '82% center', opacity: 0.85 }}
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
          style={{ objectPosition: '82% center', opacity: 0.85 }}
          className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none"
        >
          <source src={heroMp4} type="video/mp4" />
          <source src={heroWebm} type="video/webm" />
        </video>
      )}

      {/* Ink scrim for seamless transition into the canvas */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-[1] bg-gradient-to-r from-night/95 via-night/65 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night to-transparent pointer-events-none z-[1]"
      />

      {/* Hero content */}
      <div className="max-w-4xl relative z-10">
        <h1
          ref={lettersRef}
          className="font-serif font-semibold text-cloud leading-[1.08] text-[12vw] sm:text-[6.5vw] md:text-[5.2vw] flex flex-wrap items-center gap-x-2 sm:gap-x-4 select-none drop-shadow-sm"
        >
          <span className="inline-flex items-center flex-wrap">
            {name1Parts.first.split('').map((ch, i) => (
              <span key={`p1-f-${i}`} className="hero-anim-item inline-block">
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
            {name1Parts.rest && (
              <span className="hidden sm:inline-flex items-center">
                {name1Parts.rest.split('').map((ch, i) => (
                  <span key={`p1-r-${i}`} className="hero-anim-item inline-block">
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                ))}
              </span>
            )}
          </span>

          <span className="hero-anim-item inline-block text-pink mx-1.5 sm:mx-3 font-serif font-normal select-none dark:drop-shadow-[0_0_20px_rgba(255,133,187,0.4)]">
            &amp;
          </span>

          <span className="inline-flex items-center flex-wrap">
            {name2Parts.first.split('').map((ch, i) => (
              <span key={`p2-f-${i}`} className="hero-anim-item inline-block">
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
            {name2Parts.rest && (
              <span className="hidden sm:inline-flex items-center">
                {name2Parts.rest.split('').map((ch, i) => (
                  <span key={`p2-r-${i}`} className="hero-anim-item inline-block">
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                ))}
              </span>
            )}
          </span>
        </h1>

        <div className="mt-7 sm:mt-9">
          <div
            ref={subRef}
            className="glass-chip glass-refract rounded-full px-4 sm:px-5 py-2 inline-flex items-center gap-2.5 text-xs sm:text-sm font-sans text-cloud/90 font-medium shadow-md"
          >
            <span className="w-2 h-2 rounded-full bg-pink animate-pulse shrink-0" aria-hidden="true" />
            <span>
              {duration}, one chat{sinceDate ? `, since ${sinceDate}` : ''}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;