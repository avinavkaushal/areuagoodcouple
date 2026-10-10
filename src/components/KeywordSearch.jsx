import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { getKeywordStats } from '../lib/stats';
import CountUp from './CountUp';

function KeywordSearch({ messages }) {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [wholeWord, setWholeWord] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState(null);

  const resultRef = useRef(null);
  const workerRef = useRef(null);
  const searchIdRef = useRef(0);

  const firstDate = messages?.[0]?.timestamp || messages?.[0]?.date;
  const lastDate = messages?.[messages?.length - 1]?.timestamp || messages?.[messages?.length - 1]?.date;
  const firstTime = firstDate ? new Date(firstDate).getTime() : 0;
  const lastTime = lastDate ? new Date(lastDate).getTime() : 0;
  const span = lastTime - firstTime;

  // Initialize Web Worker with parsed messages
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    try {
      const worker = new Worker(new URL('../lib/searchWorker.js', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      const initPayload = messages.map(m => {
        const d = m.timestamp || m.date;
        return {
          text: m.text,
          date: d instanceof Date ? d.getTime() : d,
          sender: m.sender,
          type: m.type,
        };
      });
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
    setIsSearching(true);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'SEARCH',
        payload: { searchId: nextId, keyword: debouncedKeyword, wholeWord },
      });
    } else {
      const res = getKeywordStats(messages, debouncedKeyword, { wholeWord });
      setStats(res);
      setIsSearching(false);
    }
  }, [debouncedKeyword, wholeWord, messages]);

  // Animate result apparition
  useEffect(() => {
    if (stats && resultRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          resultRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', clearProps: 'transform,opacity' }
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
    <section id="search" className="relative overflow-hidden flex flex-col justify-center px-6 sm:px-14 md:px-20 py-24 sm:py-32">
      <div className="relative z-10 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <p data-reveal className="font-sans text-pink text-xs uppercase tracking-wider font-semibold">
            a word, counted
          </p>
          <button
            type="button"
            onClick={() => setWholeWord((prev) => !prev)}
            className={`text-xs font-sans px-2.5 py-1 rounded-full transition-all cursor-pointer border ${
              wholeWord
                ? 'bg-pink/20 text-pink border-pink/50 font-medium'
                : 'text-cloud/50 border-glass-divider hover:text-cloud/80 hover:border-glass-border'
            }`}
            title="Toggle whole word match vs substring match"
          >
            {wholeWord ? 'Whole word only' : 'Match parts of words'}
          </button>
        </div>

        <h2 data-reveal="2" className="sr-only">
          Search keyword history
        </h2>

        <div className="glass glass-lift rounded-3xl p-6 sm:p-9 shadow-xl">
          <p className="font-serif text-cloud text-3xl sm:text-5xl leading-snug">
            how many times did we say{' '}
            <input
              type="text"
              value={keyword}
              onChange={handleInputChange}
              placeholder="sorry"
              style={{ width: `${Math.max(keyword.length, 5)}ch` }}
              className="bg-transparent border-b-2 border-glass-divider focus:border-pink outline-none text-pink placeholder:text-cloud/30 font-serif italic px-1 transition-colors"
            />
            {' '}?
            {isSearching && (
              <span className="inline-flex items-center gap-1.5 ml-3 text-pink align-middle">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span className="text-xs font-sans text-cloud/40 font-medium">searching...</span>
              </span>
            )}
          </p>

          {stats && (
            <div ref={resultRef} className="mt-8 pt-6 border-t border-glass-divider">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                <span className="font-serif font-semibold text-pink text-5xl sm:text-7xl">
                  <CountUp value={stats.count} />
                </span>
                <span className="font-sans text-cloud/70 text-sm sm:text-base font-medium">
                  times{stats.count > 0 && stats.topHour !== null ? `, mostly around ${hourLabel(stats.topHour)}` : ''}
                  {stats.avgGapDays ? `, every ${stats.avgGapDays.toFixed(1)} days on average` : ''}
                </span>
              </div>

              {/* timeline: dot per occurrence, sampled to prevent DOM freezes */}
              {stats.count > 0 && span > 0 && stats.timelineTimestamps?.length > 0 && (
                <div className="relative mt-8 h-8 px-2">
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-[var(--glass-divider)] rounded-full" />
                  {stats.timelineTimestamps.map((ts, i) => {
                    const pct = Math.max(0, Math.min(100, ((ts - firstTime) / span) * 100));
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-pink -translate-x-1/2 -translate-y-1/2 pointer-events-none dark:shadow-[0_0_8px_var(--color-pink)] shadow-sm"
                        style={{ left: `${pct}%` }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default KeywordSearch;