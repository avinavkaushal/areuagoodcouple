import { FOOTER_COPY } from '../../constants/landingContent';

function SiteFooter() {
  return (
    <footer
      data-reveal="3"
      className="w-full text-center flex flex-col items-center justify-center gap-2 pt-8 pb-[max(3rem,calc(env(safe-area-inset-bottom)+2rem))] text-xs font-sans text-cloud/60"
    >
      {/* Line 1: Made with heart */}
      <p className="flex items-center justify-center gap-1.5 text-cloud/80">
        <span>made with</span>
        <svg
          className="w-3.5 h-3.5 text-pink fill-pink shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span>by {FOOTER_COPY.creator}</span>
      </p>

      {/* Line 2: Muted italic quote */}
      <p className="font-serif italic text-cloud/50 text-[11px] sm:text-xs">
        {FOOTER_COPY.quote}
      </p>

      {/* Line 3: Open source link */}
      <div>
        <a
          href={FOOTER_COPY.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cloud/60 hover:text-pink transition-colors underline font-medium focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2 rounded"
        >
          Open source on GitHub
        </a>
      </div>
    </footer>
  );
}

export default SiteFooter;
