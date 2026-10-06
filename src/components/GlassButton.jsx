import { useRef } from 'react';

const MAX_PULL = 8; // px the button drifts toward the pointer

/**
 * Primary liquid-glass call-to-action.
 * - Magnetic: drifts toward the pointer and springs back on leave.
 * - Specular highlight tracks the pointer (--bx / --by).
 * - Springy press via CSS (:active scale).
 */
function GlassButton({ text, onClick, className = '', icon = 'upload', disabled = false, type = 'button' }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    if (e.pointerType === 'touch') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--tx', `${(px - 0.5) * 2 * MAX_PULL}px`);
    el.style.setProperty('--ty', `${(py - 0.5) * 2 * (MAX_PULL * 0.6)}px`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tx', '0px');
    el.style.setProperty('--ty', '0px');
  };

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`lg-button group ${className}`}
    >
      {icon === 'upload' && (
        <svg
          className="w-5 h-5 shrink-0 text-blush transition-transform duration-500 group-hover:-translate-y-0.5"
          style={{ color: '#FFCEE3' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      )}
      {icon === 'sparkle' && (
        <svg className="w-5 h-5 shrink-0" style={{ color: '#FFCEE3' }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zm7 11l.9 2.6 2.6.9-2.6.9L19 20l-.9-2.6-2.6-.9 2.6-.9L19 13z" />
        </svg>
      )}
      <span className="relative select-none whitespace-nowrap">{text}</span>
    </button>
  );
}

export default GlassButton;
