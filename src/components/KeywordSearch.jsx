import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { getKeywordStats } from '../lib/stats';

function KeywordSearch({ messages }) {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState(null);

  const resultRef = useRef(null);
  const workerRef = useRef(null);
  const searchIdRef = useRef(0);

  const firstDate = messages?.[0]?.date;
  const lastDate = messages?.[messages?.length - 1]?.date;
  const firstTime = firstDate ? new Date(firstDate).getTime() : 0;
  const lastTime = lastDate ? new Date(lastDate).getTime() : 0;
  const span = lastTime - firstTime;

  // Initialize Web Worker with parsed messages
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    try {
      const worker = new Worker(new URL('../lib/searchWorker.js', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      const initPayload = messages.map(m => ({
        text: m.text,
        date: m.date instanceof Date ? m.date.getTime() : m.date,
        sender: m.sender,
      }));
      worker.postMessage({ type: 'INIT', payload: initPayload });

      worker.onmessage = (e) => {
        const { type, searchId, result } = e.data;
        if (type === 'SEARCH_RESULT' && searchId === searchIdRef.current) {
          setStats(result);
          setIsSearching(false);
        }
      };

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch {
      // In environments where Worker might be unavailable, fallback to main thread
      workerRef.current = null;
    }
  }, [messages]);

  // Handle typing with immediate state clear on empty input
  const handleInputChange = (e) => {
    const val = e.target.value;
    setKeyword(val);
    if (!val.trim()) {
      setDebouncedKeyword('');
      setStats(null);
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  };

  // Debounce the keyword input (350ms)
  useEffect(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const timer = setTimeout(() => {
      setDebouncedKeyword(trimmed);
    }, 350);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Execute search via Web Worker (or fallback)
  useEffect(() => {
    if (!debouncedKeyword) return;

    const nextId = ++searchIdRef.current;

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'SEARCH',
        payload: { searchId: nextId, keyword: debouncedKeyword },
      });
    } else {
      // Linear pass fallback on parsed messages
      const res = getKeywordStats(messages, debouncedKeyword);
      setStats(res);
      setIsSearching(false);
    }
  }, [debouncedKeyword, messages]);

  // Animate result apparition
  useEffect(() => {
    if (stats && resultRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          resultRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      });
      return () => ctx.revert();
    }
  }, [stats]);

  const hourLabel = (h) => {
    if (h === null || h === undefined) return '—';
    const period = h < 12 ? 'am' : 'pm';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${period}`;
  };

  return (
    <section className="relative overflow-hidden flex flex-col justify-center px-8 sm:px-16 py-24 sm:py-32 bg-blush">
      <div
        aria-hidden="true"
        className="absolute -right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-serif text-navy/[0.04] text-[24vw] sm:text-[18vw] leading-none font-semibold"
      >
        ?
      </div>

      <div className="relative z-10">
        <p className="font-sans text-navy/50 text-sm mb-4 sm:mb-8">a word, counted</p>

        <div className="max-w-2xl glass rounded-3xl p-6 sm:p-8">
          <p className="font-serif text-navy text-3xl sm:text-5xl leading-snug">
            how many times did we say{' '}
            <input
              type="text"
              value={keyword}
              onChange={handleInputChange}
              placeholder="sorry"
              style={{ width: `${Math.max(keyword.length, 5)}ch` }}
              className="bg-transparent border-b-2 border-navy/30 focus:border-pink outline-none text-pink placeholder:text-navy/20 font-serif italic px-1"
            />
            {' '}?
            {isSearching && (
              <span className="inline-flex items-center gap-1.5 ml-3 text-pink align-middle">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span className="text-xs font-sans text-navy/40 font-medium">searching...</span>
              </span>
            )}
          </p>
        </div>

        {stats && (
          <div ref={resultRef} className="mt-12 sm:mt-16 max-w-2xl">
            <div className="flex items-baseline gap-4">
              <span className="font-serif font-semibold text-navy text-6xl sm:text-7xl">
                {stats.count.toLocaleString()}
              </span>
              <span className="font-sans text-navy/60 text-sm">
                times{stats.count > 0 && stats.topHour !== null ? `, mostly around ${hourLabel(stats.topHour)}` : ''}
                {stats.avgGapDays ? `, every ${stats.avgGapDays.toFixed(1)} days on average` : ''}
              </span>
            </div>

            {/* timeline: dot per occurrence, sampled to prevent DOM freezes */}
            {stats.count > 0 && span > 0 && stats.timelineTimestamps?.length > 0 && (
              <div className="relative mt-8 h-8">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-navy/15" />
                {stats.timelineTimestamps.map((ts, i) => {
                  const pct = Math.max(0, Math.min(100, ((ts - firstTime) / span) * 100));
                  return (
                    <div
                      key={i}
                      className="absolute top-1/2 w-2 h-2 rounded-full bg-pink -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ left: `${pct}%` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default KeywordSearch;