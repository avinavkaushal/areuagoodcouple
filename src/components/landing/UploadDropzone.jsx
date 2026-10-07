import GlassButton from '../GlassButton';
import PlatformChips from './PlatformChips';

function UploadDropzone({
  pendingChat,
  isParsing,
  isDragging,
  errorMessage,
  fileInputRef,
  handleFileChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleResetChat,
  handleConfirmPending,
  handlePendingHerChange,
  handlePendingHimChange,
  handleBatchHerChange,
  handleBatchHimChange,
  onSelectPlatformTab,
}) {
  return (
    <div
      onClick={() => !pendingChat && !isParsing && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full glass glass-strong rounded-[32px] p-7 sm:p-10 flex flex-col items-center text-center transition-all duration-500 ${
        pendingChat
          ? 'cursor-default animate-pop-in'
          : isDragging
          ? 'scale-[1.03] cursor-copy ring-2 ring-pink/70 shadow-[0_0_80px_-10px_var(--color-pink)]'
          : 'cursor-pointer group glass-lift'
      }`}
      style={{ transitionTimingFunction: 'var(--ease-spring)' }}
    >
      {/* Hidden native file input accepting .txt and .json with multiple */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.json,text/plain,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      {pendingChat ? (
        // ----------------- PENDING CONFIRMATION & MAPPING STEP -----------------
        <div
          className="w-full flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {pendingChat.isBatch ? (
            // Multi-Platform Batch Mapping View
            <>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-chip text-cloud text-xs font-semibold mb-5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-pink animate-pulse" />
                <span>
                  Detected:{' '}
                  {pendingChat.platforms
                    .map((p) =>
                      p.platform === 'instagram'
                        ? 'Instagram'
                        : p.platform === 'telegram'
                        ? 'Telegram'
                        : 'WhatsApp'
                    )
                    .join(' & ')}{' '}
                  exports
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl text-cloud font-semibold mb-2 leading-tight">
                Ready to unify your chats
              </h2>

              <p className="font-sans text-cloud/60 text-xs sm:text-sm mb-6 max-w-sm">
                <strong className="text-cloud font-semibold">
                  {pendingChat.totalMessages.toLocaleString()}
                </strong>{' '}
                messages found. Assign names for each app below so your story
                recognizes both of you:
              </p>

              {/* Mapping box for each platform */}
              <div className="w-full space-y-4 mb-6">
                {pendingChat.platforms.map((p) => {
                  const pName =
                    p.platform === 'instagram'
                      ? 'Instagram'
                      : p.platform === 'telegram'
                      ? 'Telegram'
                      : 'WhatsApp';
                  const pColor =
                    p.platform === 'instagram'
                      ? 'text-ig-pink'
                      : p.platform === 'telegram'
                      ? 'text-tg-pink'
                      : 'text-wa-pink';
                  return (
                    <div
                      key={p.platform}
                      className="w-full glass-chip rounded-2xl p-4 sm:p-5 text-left border border-glass-divider"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`font-sans text-xs uppercase tracking-wider font-semibold ${pColor}`}
                        >
                          {pName} Names
                        </span>
                        <span className="text-[11px] text-cloud/50">
                          {p.messages
                            .filter((m) => m.type !== 'system')
                            .length.toLocaleString()}{' '}
                          messages
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Her dropdown */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-sans text-cloud/70">
                            Which {pName} name is{' '}
                            <strong className="text-pink font-bold">Her</strong>?
                          </label>
                          <select
                            value={p.her}
                            onChange={(e) =>
                              handleBatchHerChange(p.platform, e.target.value)
                            }
                            className="w-full glass-field px-3.5 py-2.5 text-sm cursor-pointer"
                          >
                            {p.rawSenders.map((s) => (
                              <option key={s} value={s} className="bg-night text-cloud">
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Him dropdown */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-sans text-cloud/70">
                            Which {pName} name is{' '}
                            <strong className="text-pink font-bold">Him</strong>?
                          </label>
                          <select
                            value={p.him}
                            onChange={(e) =>
                              handleBatchHimChange(p.platform, e.target.value)
                            }
                            className="w-full glass-field px-3.5 py-2.5 text-sm cursor-pointer"
                          >
                            {p.rawSenders.map((s) => (
                              <option key={s} value={s} className="bg-night text-cloud">
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="w-full flex flex-col items-center gap-3">
                <GlassButton
                  text="Confirm &amp; Unify Chats"
                  onClick={handleConfirmPending}
                  icon="sparkle"
                />
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="text-xs text-cloud/50 hover:text-cloud transition-colors underline cursor-pointer"
                >
                  Choose different files
                </button>
              </div>
            </>
          ) : (
            // Single Platform Mapping View
            <>
              {/* Detected Platform Badge */}
              {pendingChat.platform === 'instagram' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ig-pink/15 border border-ig-pink/40 text-ig-pink text-xs font-semibold mb-5 shadow-sm">
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Detected: Instagram DM export</span>
                </div>
              ) : pendingChat.platform === 'telegram' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tg-pink/15 border border-tg-pink/40 text-tg-pink text-xs font-semibold mb-5 shadow-sm">
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                  </svg>
                  <span>Detected: Telegram export</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-wa-pink/15 border border-wa-pink/40 text-wa-pink text-xs font-semibold mb-5 shadow-sm">
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                  </svg>
                  <span>Detected: WhatsApp export</span>
                </div>
              )}

              <h2 className="font-serif text-2xl sm:text-3xl text-cloud font-semibold mb-2 leading-tight">
                Ready to analyze chat
              </h2>

              <p className="font-sans text-cloud/60 text-xs sm:text-sm mb-6 max-w-sm">
                {pendingChat.fileName} &middot;{' '}
                <strong className="text-cloud font-semibold">
                  {pendingChat.messages
                    .filter((m) => m.type !== 'system')
                    .length.toLocaleString()}
                </strong>{' '}
                messages found
              </p>

              {/* Nickname Mapping Dropdowns */}
              <div className="w-full glass-chip rounded-2xl p-4 sm:p-5 mb-6 text-left border border-glass-divider">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold">
                    Map to Her &amp; Him
                  </span>
                  <span className="text-[11px] text-cloud/50">Assign names</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Her dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans text-cloud/70">
                      Which {pendingChat.platform === 'telegram' ? 'Telegram' : 'chat'}{' '}
                      name is <strong className="text-pink font-bold">Her</strong>?
                    </label>
                    <select
                      value={pendingChat.her}
                      onChange={(e) => handlePendingHerChange(e.target.value)}
                      className="w-full glass-field px-3.5 py-2.5 text-sm cursor-pointer"
                    >
                      {pendingChat.rawSenders.map((s) => (
                        <option key={s} value={s} className="bg-night text-cloud">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Him dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-sans text-cloud/70">
                      Which {pendingChat.platform === 'telegram' ? 'Telegram' : 'chat'}{' '}
                      name is <strong className="text-pink font-bold">Him</strong>?
                    </label>
                    <select
                      value={pendingChat.him}
                      onChange={(e) => handlePendingHimChange(e.target.value)}
                      className="w-full glass-field px-3.5 py-2.5 text-sm cursor-pointer"
                    >
                      {pendingChat.rawSenders.map((s) => (
                        <option key={s} value={s} className="bg-night text-cloud">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="w-full flex flex-col items-center gap-3">
                <GlassButton
                  text="Confirm &amp; Explore"
                  onClick={handleConfirmPending}
                  icon="sparkle"
                />

                <button
                  type="button"
                  onClick={handleResetChat}
                  className="text-xs text-cloud/50 hover:text-cloud transition-colors underline cursor-pointer"
                >
                  Choose a different file
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        // ----------------- DEFAULT INITIAL DROPZONE -----------------
        <>
          {/* Upload Icon Badge */}
          <div className="w-16 h-16 rounded-2xl glass-chip flex items-center justify-center text-pink mb-6 shadow-sm group-hover:scale-110 transition-transform">
            {isParsing ? (
              <svg
                className="w-8 h-8 text-pink animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-pink"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>

          {/* Headline */}
          <h2 className="font-serif text-2xl sm:text-3xl text-cloud font-semibold mb-2 leading-tight">
            {isParsing ? 'Reading your chat export...' : 'Drop your chat export here'}
          </h2>

          {/* ONE short line: "or tap below to browse your files" on mobile, "or click to browse" on desktop */}
          <p className="font-sans text-cloud/60 text-xs sm:text-sm mb-6 max-w-sm">
            <span className="sm:hidden">or tap below to browse your files</span>
            <span className="hidden sm:inline">or click to browse</span>
          </p>

          {/* Primary Action Button */}
          <div className="mt-2 mb-4" onClick={(e) => e.stopPropagation()}>
            <GlassButton
              text={isParsing ? 'Parsing Chat...' : 'CHOOSE CHAT EXPORT FILE(S)'}
              onClick={() => fileInputRef.current?.click()}
            />
          </div>

          {/* Platform Chips Row (the ONLY place platforms are listed on this card) */}
          <PlatformChips onSelectPlatform={onSelectPlatformTab} />

          {/* Error Message Alert */}
          {errorMessage && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-6 w-full p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-sans text-left flex items-start gap-3 animate-fade-in shadow-sm"
            >
              <svg
                className="w-4 h-4 shrink-0 mt-0.5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UploadDropzone;
