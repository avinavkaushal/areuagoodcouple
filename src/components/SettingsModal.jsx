import { useState } from 'react';
import GlassButton from './GlassButton';

function SettingsModal({
  isOpen,
  onClose,
  platform,
  rawSenders,
  currentMapping,
  onSaveMapping,
  onResetChat,
}) {
  const [herSender, setHerSender] = useState(
    () => currentMapping?.her || rawSenders?.[0] || 'Her'
  );
  const [himSender, setHimSender] = useState(
    () => currentMapping?.him || rawSenders?.[1] || 'Him'
  );

  if (!isOpen) return null;

  const handleHerChange = (val) => {
    setHerSender(val);
    if (rawSenders && rawSenders.length === 2 && val === himSender) {
      const other = rawSenders.find((s) => s !== val);
      if (other) setHimSender(other);
    }
  };

  const handleHimChange = (val) => {
    setHimSender(val);
    if (rawSenders && rawSenders.length === 2 && val === herSender) {
      const other = rawSenders.find((s) => s !== val);
      if (other) setHerSender(other);
    }
  };

  const handleSave = () => {
    onSaveMapping({
      her: herSender,
      him: himSender,
      mapping: {
        [herSender]: 'Her',
        [himSender]: 'Him',
      },
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close icon button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-cloud/40 hover:text-cloud transition-colors p-1 rounded-full cursor-pointer"
          aria-label="Close settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h3 className="font-serif text-xl sm:text-2xl text-cloud font-semibold mb-1">
          Chat &amp; Nickname Settings
        </h3>
        <p className="font-sans text-xs text-cloud/60 mb-6">
          Map your chat&apos;s export names to Her &amp; Him
        </p>

        {/* Platform Badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-cloud/50 font-sans">Active Chat:</span>
          {platform === 'telegram' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-medium">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
              </svg>
              Telegram Export
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/>
              </svg>
              WhatsApp Export
            </span>
          )}
        </div>

        {/* Dropdowns */}
        {rawSenders && rawSenders.length >= 2 ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-sans text-cloud/70 mb-1.5">
                Which sender corresponds to <strong className="text-pink font-semibold">Her</strong>?
              </label>
              <select
                value={herSender}
                onChange={(e) => handleHerChange(e.target.value)}
                className="w-full bg-night/90 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-cloud focus:outline-none focus:border-pink transition-colors cursor-pointer"
              >
                {rawSenders.map((name) => (
                  <option key={name} value={name} className="bg-night text-cloud">
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-sans text-cloud/70 mb-1.5">
                Which sender corresponds to <strong className="text-pink font-semibold">Him</strong>?
              </label>
              <select
                value={himSender}
                onChange={(e) => handleHimChange(e.target.value)}
                className="w-full bg-night/90 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-cloud focus:outline-none focus:border-pink transition-colors cursor-pointer"
              >
                {rawSenders.map((name) => (
                  <option key={name} value={name} className="bg-night text-cloud">
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p className="text-xs text-cloud/50 mb-6 font-sans">
            Participant names are already configured.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <GlassButton text="Save &amp; Update Story" onClick={handleSave} />
          <button
            type="button"
            onClick={() => {
              onClose();
              onResetChat();
            }}
            className="text-xs text-cloud/50 hover:text-cloud transition-colors underline cursor-pointer py-1"
          >
            Switch / Upload Another Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
