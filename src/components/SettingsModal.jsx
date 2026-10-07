import { useEffect, useState } from 'react';
import GlassButton from './GlassButton';

function SettingsModal({
  isOpen,
  onClose,
  platform,
  loadedPlatforms = {},
  onAddPlatform,
  onRemovePlatform,
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

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

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

  const platformKeys = Object.keys(loadedPlatforms || {});
  const hasLoadedPlatforms = platformKeys.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
      style={{ background: 'var(--scrim)', WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md glass glass-strong rounded-t-[32px] sm:rounded-[32px] px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 relative select-none max-h-[88vh] overflow-y-auto no-scrollbar animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet grabber (mobile) */}
        <div className="sm:hidden mx-auto mb-4 h-1.5 w-10 rounded-full" style={{ backgroundColor: 'var(--modal-grabber)' }} aria-hidden="true" />

        {/* Close icon button */}
        <button
          type="button"
          onClick={onClose}
          className="lg-icon-btn absolute top-4 right-4 sm:top-5 sm:right-5"
          aria-label="Close settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h3 id="settings-title" className="font-serif text-2xl text-cloud font-semibold mb-1 pr-10">
          Settings
        </h3>
        <p className="font-sans text-xs text-cloud/60 mb-6">
          Connected platforms and nicknames
        </p>

        {/* Connected Platforms List */}
        <div className="mb-6 p-4 rounded-2xl bg-track border border-glass-divider space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold">
              Connected Platforms
            </span>
            {onAddPlatform && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddPlatform();
                }}
                className="text-[11px] text-pink hover:text-blush underline cursor-pointer font-medium"
              >
                + Add Another
              </button>
            )}
          </div>

          <div className="space-y-2">
            {hasLoadedPlatforms ? (
              platformKeys.map((pKey) => {
                const pData = loadedPlatforms[pKey];
                const msgCount = (pData?.messages || []).filter((m) => m.type !== 'system').length;
                return (
                  <div
                    key={pKey}
                    className="flex items-center justify-between p-2.5 rounded-xl glass-chip"
                  >
                    <div className="flex items-center gap-2">
                      {pKey === 'instagram' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-ig-pink shrink-0" />
                      ) : pKey === 'telegram' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-tg-pink shrink-0" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-wa-pink shrink-0" />
                      )}
                      <span className="text-xs font-medium text-cloud capitalize">
                        {pKey === 'instagram' ? 'Instagram' : pKey === 'telegram' ? 'Telegram' : 'WhatsApp'}
                      </span>
                      <span className="text-[11px] text-cloud/50">({msgCount.toLocaleString()} msgs)</span>
                    </div>

                    {platformKeys.length > 1 && onRemovePlatform && (
                      <button
                        type="button"
                        onClick={() => onRemovePlatform(pKey)}
                        className="text-[11px] text-red-400/70 hover:text-red-300 px-2 py-0.5 rounded hover:bg-red-500/10 cursor-pointer"
                        title={`Remove ${pKey}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-cloud/60 capitalize">
                Active: {platform || 'WhatsApp'}
              </div>
            )}
          </div>
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
                className="w-full glass-field px-3.5 py-2.5 text-sm cursor-pointer"
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
                className="w-full glass-field px-3.5 py-2.5 text-sm cursor-pointer"
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
          <GlassButton text="Save &amp; Update Story" onClick={handleSave} icon="sparkle" />
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
