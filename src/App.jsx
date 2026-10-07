import { useState, useRef, useMemo, useEffect } from 'react';
import bgWebm from './assets/output.webm';
import bgMp4 from './assets/output.mp4';
import { parseChatFile, parseChatFiles, applyNicknameMapping } from './lib/parseChat';
import {
  getStoredNicknameConfig,
  saveStoredNicknameConfig,
  resolveSenderMapping,
} from './lib/nicknameConfig';
import QuickNav from './components/QuickNav';
import Hero from './components/Hero';
import CrossPlatformStats from './components/CrossPlatformStats';
import Milestones from './components/Milestones';
import CalendarHeat from './components/CalendarHeat';
import Highlights from './components/Highlights';
import ReelStats from './components/ReelStats';
import MediaBreakdown from './components/MediaBreakdown';
import ActivityHeatmap from './components/ActivityHeatmap';
import Initiator from './components/Initiator';
import ResponseTime from './components/ResponseTime';
import LoveWords from './components/LoveWords';
import KeywordSearch from './components/KeywordSearch';
import EmojiStats from './components/EmojiStats';
import ReactionStats from './components/ReactionStats';
import WordCloud from './components/WordCloud';
import RandomMemory from './components/RandomMemory';
import CalloutStreak from './components/CalloutStreak';
import LongestMessage from './components/LongestMessage';
import Outro from './components/Outro';
import GlassButton from './components/GlassButton';
import SettingsModal from './components/SettingsModal';
import AmbientBackground from './components/AmbientBackground';
import { installInteractions } from './lib/interactions';
import SectionErrorBoundary from './components/SectionErrorBoundary';
import UploadHero from './components/landing/UploadHero';
import UploadDropzone from './components/landing/UploadDropzone';
import ExportGuideTabs from './components/landing/ExportGuideTabs';
import FaqAccordion from './components/landing/FaqAccordion';
import SiteFooter from './components/landing/SiteFooter';
import SiteHeader from './components/landing/SiteHeader';

function App() {
  const [messages, setMessages] = useState(null);
  const [senders, setSenders] = useState(null);
  const [rawSenders, setRawSenders] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [loadedPlatforms, setLoadedPlatforms] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [pendingChat, setPendingChat] = useState(null);
  const [pendingAdditionalChat, setPendingAdditionalChat] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [exportGuideTab, setExportGuideTab] = useState('whatsapp');

  const fileInputRef = useRef(null);
  const addPlatformInputRef = useRef(null);
  const uploadVideoRef = useRef(null);

  const handleSelectPlatformTab = (platformId) => {
    setExportGuideTab(platformId);
    requestAnimationFrame(() => {
      const el = document.getElementById('export-guide');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  // Global reactive layer: scroll parallax, section reveals
  useEffect(() => installInteractions(), []);

  useEffect(() => {
    if (messages) return;
    const video = uploadVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
    };

    playVideo();
    video.addEventListener('loadeddata', playVideo);
    video.addEventListener('canplay', playVideo);

    return () => {
      video.removeEventListener('loadeddata', playVideo);
      video.removeEventListener('canplay', playVideo);
    };
  }, [messages]);

  // Unified chronological message list merging all loaded platforms
  const unifiedMessages = useMemo(() => {
    const platformEntries = Object.values(loadedPlatforms || {});
    if (platformEntries.length === 0) {
      return messages || null;
    }
    const merged = [];
    for (const entry of platformEntries) {
      if (Array.isArray(entry.messages)) {
        merged.push(...entry.messages);
      }
    }
    merged.sort((a, b) => {
      const ta = a.timestamp?.getTime() || a.date?.getTime() || 0;
      const tb = b.timestamp?.getTime() || b.date?.getTime() || 0;
      return ta - tb;
    });
    return merged;
  }, [loadedPlatforms, messages]);

  // Pre-filter valid non-system messages once for all downstream feature stats
  const validMessages = useMemo(
    () => (unifiedMessages || []).filter((m) => m && m.type !== 'system'),
    [unifiedMessages]
  );

  async function validateAndProcessFiles(fileList) {
    setErrorMessage(null);
    setPendingChat(null);
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) return;

    const areSupported = files.every((file) => {
      const lowerName = (file.name || '').toLowerCase();
      return (
        lowerName.endsWith('.txt') ||
        lowerName.endsWith('.json') ||
        file.type === 'text/plain' ||
        file.type === 'application/json'
      );
    });

    if (!areSupported) {
      setErrorMessage(
        'Invalid file format. Please upload a WhatsApp chat export (.txt), Telegram export (.json), or Instagram DM export (.json).'
      );
      return;
    }

    setIsParsing(true);

    try {
      const storedConfig = getStoredNicknameConfig();
      const parsed =
        files.length > 1
          ? await parseChatFiles(files, storedConfig.mapping || {})
          : await parseChatFile(files[0], storedConfig.mapping || {});

      // Batch upload with multiple platforms dropped together: ask user to map names for each platform
      if (parsed.multiPlatform && Array.isArray(parsed.platforms)) {
        for (const item of parsed.platforms) {
          const itemRawSenders = item.rawSenders || [];
          if (itemRawSenders.length !== 2) {
            setErrorMessage(
              `Chat export for ${item.platform} must have 2 participants. Found ${itemRawSenders.length}: ${itemRawSenders.join(', ')}`
            );
            setIsParsing(false);
            return;
          }
        }

        const batchPlatforms = parsed.platforms.map((p) => {
          const rSenders = p.rawSenders || [];
          const resolved = resolveSenderMapping(rSenders, storedConfig);
          return {
            platform: p.platform,
            messages: p.messages,
            rawSenders: rSenders,
            her: resolved.her,
            him: resolved.him,
          };
        });

        const totalMsgs = parsed.platforms.reduce(
          (acc, p) => acc + (p.messages || []).filter((m) => m.type !== 'system').length,
          0
        );

        setPendingChat({
          isBatch: true,
          platforms: batchPlatforms,
          totalMessages: totalMsgs,
          fileName: parsed.platforms
            .map((p) => (p.platform === 'instagram' ? 'Instagram' : p.platform === 'telegram' ? 'Telegram' : 'WhatsApp'))
            .join(' + '),
        });
        setIsParsing(false);
        return;
      }

      if (!parsed.messages || parsed.messages.length === 0) {
        setErrorMessage(
          'No chat messages could be parsed. Please make sure this is a valid WhatsApp, Telegram, or Instagram export.'
        );
        setIsParsing(false);
        return;
      }

      const detectedRawSenders = parsed.rawSenders || [];
      if (detectedRawSenders.length !== 2) {
        setErrorMessage(
          `This tool works with 2-person chats only. Found ${detectedRawSenders.length} participant(s)${
            detectedRawSenders.length > 0 ? `: ${detectedRawSenders.join(', ')}` : '.'
          }`
        );
        setIsParsing(false);
        return;
      }

      // Resolve initial Her/Him mapping
      const resolved = resolveSenderMapping(detectedRawSenders, storedConfig);

      const displayName =
        files.length > 1 ? `${files.length} Instagram export files` : files[0].name;

      setPendingChat({
        platform: parsed.platform,
        messages: parsed.messages,
        rawSenders: detectedRawSenders,
        fileName: displayName,
        her: resolved.her,
        him: resolved.him,
      });
    } catch (err) {
      setErrorMessage(
        err?.message ||
          'Failed to read and parse this file. Please ensure it is a valid WhatsApp, Telegram, or Instagram export.'
      );
    } finally {
      setIsParsing(false);
    }
  }

  // Handle linking another platform export
  async function validateAndProcessAdditionalFiles(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) return;

    try {
      const storedConfig = getStoredNicknameConfig();
      const parsed =
        files.length > 1
          ? await parseChatFiles(files, storedConfig.mapping || {})
          : await parseChatFile(files[0], storedConfig.mapping || {});

      const detectedRawSenders = parsed.rawSenders || [];
      if (detectedRawSenders.length !== 2) {
        alert(
          `This tool works with 2-person chats only. Found ${detectedRawSenders.length} participant(s).`
        );
        return;
      }

      const resolved = resolveSenderMapping(detectedRawSenders, storedConfig);
      const displayName =
        files.length > 1 ? `${files.length} ${parsed.platform} files` : files[0].name;

      // If senders are already unambiguously known in saved mapping, link directly
      if (
        storedConfig.mapping?.[detectedRawSenders[0]] &&
        storedConfig.mapping?.[detectedRawSenders[1]]
      ) {
        const mapping = {
          [detectedRawSenders[0]]: storedConfig.mapping[detectedRawSenders[0]],
          [detectedRawSenders[1]]: storedConfig.mapping[detectedRawSenders[1]],
        };
        const finalMsgs = applyNicknameMapping(parsed.messages, mapping);
        setLoadedPlatforms((prev) => ({
          ...prev,
          [parsed.platform]: {
            platform: parsed.platform,
            messages: finalMsgs,
            rawSenders: detectedRawSenders,
            fileName: displayName,
          },
        }));
      } else {
        setPendingAdditionalChat({
          platform: parsed.platform,
          messages: parsed.messages,
          rawSenders: detectedRawSenders,
          fileName: displayName,
          her: resolved.her,
          him: resolved.him,
        });
      }
    } catch (err) {
      alert(err?.message || 'Failed to read and parse this export.');
    }
  }

  function handleFileChange(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFiles(files);
    }
  }

  function handleAddPlatformFileChange(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessAdditionalFiles(files);
    }
    // reset input so same file can be re-selected if needed
    e.target.value = '';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFiles(files);
    }
  }

  // Pending screen mapping change handlers
  const handlePendingHerChange = (val) => {
    if (!pendingChat) return;
    let nextHim = pendingChat.him;
    if (val === pendingChat.him && pendingChat.rawSenders.length === 2) {
      nextHim = pendingChat.rawSenders.find((s) => s !== val) || pendingChat.him;
    }
    setPendingChat((prev) => ({
      ...prev,
      her: val,
      him: nextHim,
    }));
  };

  const handlePendingHimChange = (val) => {
    if (!pendingChat) return;
    let nextHer = pendingChat.her;
    if (val === pendingChat.her && pendingChat.rawSenders.length === 2) {
      nextHer = pendingChat.rawSenders.find((s) => s !== val) || pendingChat.her;
    }
    setPendingChat((prev) => ({
      ...prev,
      her: nextHer,
      him: val,
    }));
  };

  const handleBatchHerChange = (platformKey, val) => {
    setPendingChat((prev) => {
      if (!prev || !prev.platforms) return prev;
      return {
        ...prev,
        platforms: prev.platforms.map((p) => {
          if (p.platform !== platformKey) return p;
          let nextHim = p.him;
          if (val === p.him && p.rawSenders.length === 2) {
            nextHim = p.rawSenders.find((s) => s !== val) || p.him;
          }
          return { ...p, her: val, him: nextHim };
        }),
      };
    });
  };

  const handleBatchHimChange = (platformKey, val) => {
    setPendingChat((prev) => {
      if (!prev || !prev.platforms) return prev;
      return {
        ...prev,
        platforms: prev.platforms.map((p) => {
          if (p.platform !== platformKey) return p;
          let nextHer = p.her;
          if (val === p.her && p.rawSenders.length === 2) {
            nextHer = p.rawSenders.find((s) => s !== val) || p.her;
          }
          return { ...p, her: nextHer, him: val };
        }),
      };
    });
  };

  const handleConfirmPending = () => {
    if (!pendingChat) return;

    const currentConfig = getStoredNicknameConfig();
    const updatedMapping = { ...(currentConfig.mapping || {}) };

    if (pendingChat.isBatch && Array.isArray(pendingChat.platforms)) {
      const newLoaded = {};
      let primaryHer = null;
      let primaryHim = null;

      for (const p of pendingChat.platforms) {
        updatedMapping[p.her] = 'Her';
        updatedMapping[p.him] = 'Him';

        if (!primaryHer) primaryHer = p.her;
        if (!primaryHim) primaryHim = p.him;

        const pMapping = {
          [p.her]: 'Her',
          [p.him]: 'Him',
        };
        const mappedMsgs = applyNicknameMapping(p.messages, pMapping);
        newLoaded[p.platform] = {
          platform: p.platform,
          messages: mappedMsgs,
          rawSenders: p.rawSenders,
          fileName: `${p.platform} export`,
        };
      }

      saveStoredNicknameConfig({
        ...currentConfig,
        mapping: updatedMapping,
      });

      setLoadedPlatforms(newLoaded);
      setPlatform('unified');
      setRawSenders([primaryHer, primaryHim]);
      setSenders(['Her', 'Him']);

      const allMerged = Object.values(newLoaded)
        .flatMap((x) => x.messages)
        .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
      setMessages(allMerged);
      setPendingChat(null);
      return;
    }

    // Single platform upload
    const mapping = {
      [pendingChat.her]: 'Her',
      [pendingChat.him]: 'Him',
    };

    saveStoredNicknameConfig({
      ...currentConfig,
      mapping: {
        ...updatedMapping,
        ...mapping,
      },
    });

    const finalMessages = applyNicknameMapping(pendingChat.messages, mapping);

    setLoadedPlatforms({
      [pendingChat.platform]: {
        platform: pendingChat.platform,
        messages: finalMessages,
        rawSenders: pendingChat.rawSenders,
        fileName: pendingChat.fileName,
      },
    });

    setPlatform(pendingChat.platform);
    setRawSenders(pendingChat.rawSenders);
    setSenders(['Her', 'Him']);
    setMessages(finalMessages);
    setPendingChat(null);
  };

  const handleConfirmAdditionalPlatform = () => {
    if (!pendingAdditionalChat) return;

    const mapping = {
      [pendingAdditionalChat.her]: 'Her',
      [pendingAdditionalChat.him]: 'Him',
    };

    const currentConfig = getStoredNicknameConfig();
    saveStoredNicknameConfig({
      ...currentConfig,
      mapping: {
        ...(currentConfig.mapping || {}),
        ...mapping,
      },
    });

    const finalMessages = applyNicknameMapping(pendingAdditionalChat.messages, mapping);

    setLoadedPlatforms((prev) => ({
      ...prev,
      [pendingAdditionalChat.platform]: {
        platform: pendingAdditionalChat.platform,
        messages: finalMessages,
        rawSenders: pendingAdditionalChat.rawSenders,
        fileName: pendingAdditionalChat.fileName,
      },
    }));

    setPendingAdditionalChat(null);
  };

  const handleRemovePlatform = (platformKey) => {
    setLoadedPlatforms((prev) => {
      const next = { ...prev };
      delete next[platformKey];
      const remainingKeys = Object.keys(next);
      if (remainingKeys.length === 0) {
        handleResetChat();
      } else {
        setPlatform(remainingKeys[0]);
        setRawSenders(next[remainingKeys[0]].rawSenders);
      }
      return next;
    });
  };

  const handleResetChat = () => {
    setMessages(null);
    setSenders(null);
    setRawSenders(null);
    setPlatform(null);
    setLoadedPlatforms({});
    setPendingChat(null);
    setPendingAdditionalChat(null);
    setErrorMessage(null);
  };

  // Re-map messages when settings are modified inside dashboard
  const handleSaveSettingsMapping = ({ mapping }) => {
    saveStoredNicknameConfig({ mapping });
    setLoadedPlatforms((prev) => {
      const next = {};
      for (const key of Object.keys(prev)) {
        const item = prev[key];
        next[key] = {
          ...item,
          messages: applyNicknameMapping(item.messages, mapping),
        };
      }
      return next;
    });
    if (messages) {
      const updatedMessages = applyNicknameMapping(messages, mapping);
      setMessages(updatedMessages);
      setSenders(['Her', 'Him']);
    }
  };

  if (!messages) {
    return (
      <div className="min-h-[100svh] flex flex-col items-center text-cloud px-5 sm:px-6 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(5.5rem+env(safe-area-inset-top,0px))] pb-12 select-none relative">
        <AmbientBackground />

        {/* Looping background video */}
        <video
          ref={uploadVideoRef}
          autoPlay
          muted
          loop
          playsInline
          style={{ opacity: 0.70 }}
          className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none motion-reduce:hidden"
        >
          <source src={bgWebm} type="video/webm" />
          <source src={bgMp4} type="video/mp4" />
        </video>

        {/* Gradient overlay between video and card content for legibility */}
        <div className="fixed inset-0 bg-gradient-to-b from-night/90 via-night/65 to-night/95 pointer-events-none z-0" />

        {/* Sticky Glass Site Header */}
        <SiteHeader onReset={handleResetChat} />

        <div className="w-full max-w-[560px] flex flex-col items-center relative z-10">
          {!pendingChat && <UploadHero />}

          {/* Main Drop / Upload / Confirmation Card */}
          <UploadDropzone
            pendingChat={pendingChat}
            isParsing={isParsing}
            isDragging={isDragging}
            errorMessage={errorMessage}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleResetChat={handleResetChat}
            handleConfirmPending={handleConfirmPending}
            handlePendingHerChange={handlePendingHerChange}
            handlePendingHimChange={handlePendingHimChange}
            handleBatchHerChange={handleBatchHerChange}
            handleBatchHimChange={handleBatchHimChange}
            onSelectPlatformTab={handleSelectPlatformTab}
          />

          {!pendingChat && (
            <div className="w-full space-y-6 sm:space-y-8 mt-6 sm:mt-8">
              <ExportGuideTabs
                activeTab={exportGuideTab}
                onSelectTab={setExportGuideTab}
              />
              <FaqAccordion />
              <SiteFooter />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Current active mapping for settings modal
  const currentStoredConfig = getStoredNicknameConfig();
  const currentHerSender = (rawSenders?.[0] && currentStoredConfig.mapping?.[rawSenders[0]] === 'Her')
    ? rawSenders[0]
    : (rawSenders?.[1] && currentStoredConfig.mapping?.[rawSenders[1]] === 'Her')
    ? rawSenders[1]
    : Object.entries(currentStoredConfig.mapping || {}).find(([, v]) => v === 'Her')?.[0]
    || rawSenders?.[0]
    || 'Her';

  const currentHimSender = (rawSenders?.[1] && currentStoredConfig.mapping?.[rawSenders[1]] === 'Him')
    ? rawSenders[1]
    : (rawSenders?.[0] && currentStoredConfig.mapping?.[rawSenders[0]] === 'Him')
    ? rawSenders[0]
    : Object.entries(currentStoredConfig.mapping || {}).find(([, v]) => v === 'Him')?.[0]
    || rawSenders?.[1]
    || 'Him';


  return (
    <div className="text-cloud relative min-h-screen pb-28 md:pb-12">
      <AmbientBackground />

      <QuickNav messages={validMessages} onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        platform={platform}
        loadedPlatforms={loadedPlatforms}
        onAddPlatform={() => addPlatformInputRef.current?.click()}
        onRemovePlatform={handleRemovePlatform}
        rawSenders={rawSenders}
        currentMapping={{ her: currentHerSender, him: currentHimSender }}
        onSaveMapping={handleSaveSettingsMapping}
        onResetChat={handleResetChat}
      />

      {/* Hidden file input for linking additional platforms */}
      <input
        ref={addPlatformInputRef}
        type="file"
        multiple
        accept=".txt,.json,text/plain,application/json"
        onChange={handleAddPlatformFileChange}
        className="hidden"
      />

      {/* Modal for mapping new platform participants when adding a platform */}
      {pendingAdditionalChat && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
          style={{ background: 'var(--scrim)', WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)' }}
          onClick={() => setPendingAdditionalChat(null)}
        >
          <div
            className="w-full sm:max-w-md glass glass-strong rounded-t-[32px] sm:rounded-[32px] px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 relative select-none animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet grabber (mobile) */}
            <div className="sm:hidden mx-auto mb-4 h-1.5 w-10 rounded-full" style={{ backgroundColor: 'var(--modal-grabber)' }} aria-hidden="true" />

            <button
              type="button"
              onClick={() => setPendingAdditionalChat(null)}
              className="lg-icon-btn absolute top-4 right-4 sm:top-5 sm:right-5"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold block mb-1">
              Link {pendingAdditionalChat.platform === 'instagram' ? 'Instagram' : pendingAdditionalChat.platform === 'telegram' ? 'Telegram' : 'WhatsApp'}
            </span>

            <h3 className="font-serif text-2xl text-cloud font-semibold mb-2">
              Assign Chat Names
            </h3>

            <p className="font-sans text-xs text-cloud/60 mb-5">
              Found {pendingAdditionalChat.messages.length.toLocaleString()} messages in{' '}
              {pendingAdditionalChat.fileName}. Match names to Her &amp; Him to merge into your unified story.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-sans text-cloud/70 mb-1.5">
                  Which name is <strong className="text-pink font-semibold">Her</strong>?
                </label>
                <select
                  value={pendingAdditionalChat.her}
                  onChange={(e) => {
                    const val = e.target.value;
                    let nextHim = pendingAdditionalChat.him;
                    if (val === pendingAdditionalChat.him && pendingAdditionalChat.rawSenders.length === 2) {
                      nextHim =
                        pendingAdditionalChat.rawSenders.find((s) => s !== val) ||
                        pendingAdditionalChat.him;
                    }
                    setPendingAdditionalChat((prev) => ({ ...prev, her: val, him: nextHim }));
                  }}
                  className="w-full glass-field px-3.5 py-2.5 text-sm cursor-pointer"
                >
                  {pendingAdditionalChat.rawSenders.map((s) => (
                    <option key={s} value={s} className="bg-night text-cloud">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans text-cloud/70 mb-1.5">
                  Which name is <strong className="text-pink font-semibold">Him</strong>?
                </label>
                <select
                  value={pendingAdditionalChat.him}
                  onChange={(e) => {
                    const val = e.target.value;
                    let nextHer = pendingAdditionalChat.her;
                    if (val === pendingAdditionalChat.her && pendingAdditionalChat.rawSenders.length === 2) {
                      nextHer =
                        pendingAdditionalChat.rawSenders.find((s) => s !== val) ||
                        pendingAdditionalChat.her;
                    }
                    setPendingAdditionalChat((prev) => ({ ...prev, her: nextHer, him: val }));
                  }}
                  className="w-full glass-field px-3.5 py-2.5 text-sm cursor-pointer"
                >
                  {pendingAdditionalChat.rawSenders.map((s) => (
                    <option key={s} value={s} className="bg-night text-cloud">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <GlassButton text="Link &amp; Merge Platform" onClick={handleConfirmAdditionalPlatform} icon="sparkle" />
              <button
                type="button"
                onClick={() => setPendingAdditionalChat(null)}
                className="text-xs text-cloud/50 hover:text-cloud transition-colors underline cursor-pointer py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionErrorBoundary name="Hero">
        <Hero
          messages={validMessages}
          senders={senders}
          herName={currentHerSender}
          himName={currentHimSender}
          rawSenders={rawSenders}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="CrossPlatformStats">
        <CrossPlatformStats
          messages={validMessages}
          loadedPlatforms={loadedPlatforms}
          onAddPlatform={() => addPlatformInputRef.current?.click()}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="Milestones">
        <Milestones messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="CalendarHeat">
        <CalendarHeat messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="Highlights">
        <Highlights messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="ReelStats">
        <ReelStats messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="MediaBreakdown">
        <MediaBreakdown messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="ActivityHeatmap">
        <ActivityHeatmap messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="Initiator">
        <Initiator messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="ResponseTime">
        <ResponseTime messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="LoveWords">
        <LoveWords messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="KeywordSearch">
        <KeywordSearch messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="EmojiStats">
        <EmojiStats messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="ReactionStats">
        <ReactionStats messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="WordCloud">
        <div id="word-cloud">
          <WordCloud messages={validMessages} senders={senders} />
        </div>
      </SectionErrorBoundary>
      <SectionErrorBoundary name="RandomMemory">
        <RandomMemory messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="CalloutStreak">
        <CalloutStreak messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="LongestMessage">
        <LongestMessage messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
      <SectionErrorBoundary name="Outro">
        <Outro messages={validMessages} senders={senders} />
      </SectionErrorBoundary>
    </div>
  );
}

export default App;