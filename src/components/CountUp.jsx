import { useEffect, useRef, useState } from 'react';

function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Counts up from 0 to `value` the first time it scrolls into view.
 * Renders the final value immediately under reduced motion or for non-numbers.
 */
function CountUp({ value, duration = 1400, decimals, className = '', format }) {
  const ref = useRef(null);
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const places = decimals ?? (numeric && !Number.isInteger(value) ? 1 : 0);
  const [display, setDisplay] = useState(numeric ? 0 : value);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!numeric) return undefined;
    const el = ref.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce || !('IntersectionObserver' in window)) {
      setDisplay(value);
      return undefined;
    }

    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        setDisplay(value * easeOutExpo(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    if (startedRef.current) {
      setDisplay(value);
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startedRef.current = true;
          io.disconnect();
          run();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, duration, numeric]);

  let text = display;
  if (numeric) {
    const n = Number(display);
    text = format
      ? format(n)
      : n.toLocaleString(undefined, { minimumFractionDigits: places, maximumFractionDigits: places });
  }

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {text}
    </span>
  );
}

export default CountUp;
