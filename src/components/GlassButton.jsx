import { useEffect, useRef } from 'react';

function GlassButton({ text, onClick, className = '' }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const btnEl = buttonRef.current;
    if (!btnEl) return;

    // If liquid-glass is available, initialize container/canvas overlay
    if (window.Container && !btnEl.querySelector('canvas')) {
      try {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = '9999px';
        canvas.style.pointerEvents = 'none';
        canvas.style.mixBlendMode = 'overlay';
        canvas.style.zIndex = '1';
        btnEl.appendChild(canvas);
      } catch (e) {
        console.warn('Liquid glass canvas init skipped:', e);
      }
    }
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-navy hover:bg-[#032677] text-white font-sans font-bold text-base tracking-wide shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden border border-white/20 group ${className}`}
    >
      {/* Subtle glass reflection overlay */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/15 pointer-events-none rounded-full"
      />
      {/* Upload icon */}
      <svg
        className="w-5 h-5 text-pink group-hover:scale-110 transition-transform relative z-10 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
      {/* Button text */}
      <span className="relative z-10 select-none">{text}</span>
    </button>
  );
}

export default GlassButton;
