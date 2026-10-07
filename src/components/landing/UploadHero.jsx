function UploadHero() {
  return (
    <div className="text-center mb-8 animate-fade-in">
      {/* Privacy pill */}
      <span className="glass-chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-sans font-semibold text-cloud/80 mb-5">
        <svg
          className="w-3.5 h-3.5 text-pink shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden="true"
        >
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 118 0v4" strokeLinecap="round" />
        </svg>
        100% private · nothing leaves your device
      </span>

      {/* Main hero title */}
      <h1 className="font-serif text-[2.6rem] leading-[1.05] sm:text-6xl font-semibold tracking-tight text-cloud">
        Your love story,
        <br />
        <span className="italic font-normal text-pink">in messages.</span>
      </h1>
    </div>
  );
}

export default UploadHero;
