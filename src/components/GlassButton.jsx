/**
 * Primary retro pixel call-to-action.
 * - Flat fill, notched 8-bit border, hard offset shadow (see `.lg-button` in index.css).
 * - Stepped "press into the shadow" animation instead of glassy springs.
 * - Icons are drawn on a 9x9 pixel grid so they stay crisp alongside the bitmap font.
 */

// 9x9 pixel-art sprites ('#' = filled pixel)
const SPRITES = {
  upload: [
    '....#....',
    '...###...',
    '..#####..',
    '.#######.',
    '....#....',
    '....#....',
    '#...#...#',
    '#.......#',
    '#########',
  ],
  sparkle: [
    '....#....',
    '....#....',
    '...###...',
    '..#####..',
    '#########',
    '..#####..',
    '...###...',
    '....#....',
    '....#....',
  ],
};

function PixelIcon({ name }) {
  const sprite = SPRITES[name];
  if (!sprite) return null;
  const rects = [];
  sprite.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === '#') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    });
  });
  return (
    <svg className="px-icon" viewBox="0 0 9 9" fill="currentColor" aria-hidden="true">
      {rects}
    </svg>
  );
}

function GlassButton({ text, onClick, className = '', icon = 'upload', disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`lg-button ${className}`}
    >
      <PixelIcon name={icon} />
      <span className="relative select-none">{text}</span>
    </button>
  );
}

export default GlassButton;
