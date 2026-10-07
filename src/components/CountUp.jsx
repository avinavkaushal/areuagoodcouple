import { useEffect, useRef } from 'react';

function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatValue(val, places, format) {
  if (format) return format(val);
  return val.toLocaleString(undefined, {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}

/**
 * Counts up smoothly from 0 to `value` the first time it scrolls into view.
 * Uses direct DOM text updates during rAF to eliminate 60-120 React re-renders/sec.
 */
function CountUp({ value, duration = 1200, decimals, className = '', format }) {
  const ref = useRef(null);
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const places = decimals ?? (numeric && !Number.isInteger(value) ? 1 : 0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!numeric) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      el.textContent = formatValue(value, places, format);
      return undefined;
    }

    if (startedRef.current) {
      el.textContent = formatValue(value, places, format);
      return undefined;
    }

    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const cur = value * easeOutExpo(t);
        if (ref.current) {
          ref.current.textContent = formatValue(cur, places, format);
        }
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else if (ref.current) {
          ref.current.textContent = formatValue(value, places, format);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startedRef.current = true;
          io.disconnect();
          run();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, duration, numeric, places, format]);

  const initialText = numeric ? formatValue(0, places, format) : value;

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {initialText}
    </span>
  );
}

export default CountUp;
