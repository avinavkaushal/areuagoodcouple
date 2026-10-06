/**
 * Fixed ambient canvas behind the whole app: deep ink base, three slowly
 * drifting colour orbs (scroll-parallaxed via --scroll), and a fine grain.
 * Also hosts the SVG filter used for Chromium-only liquid refraction.
 */
function AmbientBackground() {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <div className="ambient__orb ambient__orb--1" />
        <div className="ambient__orb ambient__orb--2" />
        <div className="ambient__orb ambient__orb--3" />
        <div className="ambient__grain" />
      </div>

      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="lg-refract" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="38" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </>
  );
}

export default AmbientBackground;
