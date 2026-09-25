import { useState, useRef, useMemo } from 'react';
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

  const fileInputRef = useRef(null);
  const addPlatformInputRef = useRef(null);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-night text-cloud px-6 py-12 select-none">
        <div className="w-full max-w-lg flex flex-col items-center">
          {/* Main Drop / Upload / Confirmation Card */}
          <div
            onClick={() => !pendingChat && !isParsing && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full glass rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-300 border-2 ${
              pendingChat
                ? 'border-white/20 shadow-2xl cursor-default'
                : isDragging
                ? 'border-pink bg-pink/20 scale-[1.02] shadow-2xl ring-4 ring-pink/20 cursor-pointer'
                : 'border-white/15 hover:border-pink/60 shadow-xl cursor-pointer group'
            }`}
          >
            {pendingChat ? (
              // ----------------- PENDING CONFIRMATION & MAPPING STEP -----------------
              <div className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                {pendingChat.isBatch ? (
                  // Multi-Platform Batch Mapping View
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/20 text-cloud text-xs font-semibold mb-5 shadow-sm">
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
                      messages found. Assign names for each app below so your story recognizes both of you:
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
                            ? 'text-purple-300'
                            : p.platform === 'telegram'
                            ? 'text-sky-300'
                            : 'text-emerald-300';
                        return (
                          <div
                            key={p.platform}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-5 text-left"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`font-sans text-xs uppercase tracking-wider font-semibold ${pColor}`}>
                                {pName} Names
                              </span>
                              <span className="text-[11px] text-cloud/50">
                                {p.messages.filter((m) => m.type !== 'system').length.toLocaleString()} messages
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {/* Her dropdown */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-sans text-cloud/70">
                                  Which {pName} name is <strong className="text-pink font-bold">Her</strong>?
                                </label>
                                <select
                                  value={p.her}
                                  onChange={(e) => handleBatchHerChange(p.platform, e.target.value)}
                                  className="w-full bg-night border border-white/20 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-pink transition-colors cursor-pointer"
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
                                  Which {pName} name is <strong className="text-pink font-bold">Him</strong>?
                                </label>
                                <select
                                  value={p.him}
                                  onChange={(e) => handleBatchHimChange(p.platform, e.target.value)}
                                  className="w-full bg-night border border-white/20 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-pink transition-colors cursor-pointer"
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
                      <GlassButton text="Confirm &amp; Unify Chats ✨" onClick={handleConfirmPending} />
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
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-5 shadow-sm">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        <span>Detected: Instagram DM export</span>
                      </div>
                    ) : pendingChat.platform === 'telegram' ? (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-semibold mb-5 shadow-sm">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                        </svg>
                        <span>Detected: Telegram export</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold mb-5 shadow-sm">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
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
                        {pendingChat.messages.filter((m) => m.type !== 'system').length.toLocaleString()}
                      </strong>{' '}
                      messages found
                    </p>

                    {/* Nickname Mapping Dropdowns */}
                    <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 text-left">
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
                            Which {pendingChat.platform === 'telegram' ? 'Telegram' : 'chat'} name is{' '}
                            <strong className="text-pink font-bold">Her</strong>?
                          </label>
                          <select
                            value={pendingChat.her}
                            onChange={(e) => handlePendingHerChange(e.target.value)}
                            className="w-full bg-night border border-white/20 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-pink transition-colors cursor-pointer"
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
                            Which {pendingChat.platform === 'telegram' ? 'Telegram' : 'chat'} name is{' '}
                            <strong className="text-pink font-bold">Him</strong>?
                          </label>
                          <select
                            value={pendingChat.him}
                            onChange={(e) => handlePendingHimChange(e.target.value)}
                            className="w-full bg-night border border-white/20 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-pink transition-colors cursor-pointer"
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
                      <GlassButton text="Confirm &amp; Explore ✨" onClick={handleConfirmPending} />

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
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-pink mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  {isParsing ? (
                    <svg className="w-8 h-8 text-pink animate-spin" viewBox="0 0 24 24" fill="none">
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
                    <svg className="w-8 h-8 text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                <p className="font-sans text-cloud/60 text-sm mb-6 max-w-sm">
                  Drag &amp; drop your WhatsApp{' '}
                  <code className="text-pink bg-white/10 px-1.5 py-0.5 rounded font-mono font-semibold">
                    .txt
                  </code>
                  , Telegram{' '}
                  <code className="text-sky-300 bg-white/10 px-1.5 py-0.5 rounded font-mono font-semibold">
                    .json
                  </code>
                  , or Instagram{' '}
                  <code className="text-purple-300 bg-white/10 px-1.5 py-0.5 rounded font-mono font-semibold">
                    message_*.json
                  </code>{' '}
                  files here, or click to browse.
                </p>

                {/* Hidden native file input accepting .txt and .json with multiple */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.json,text/plain,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Primary Action Button */}
                <div className="mt-2 mb-4" onClick={(e) => e.stopPropagation()}>
                  <GlassButton
                    text={isParsing ? 'Parsing Chat...' : 'Choose Chat Export File(s)'}
                    onClick={() => fileInputRef.current?.click()}
                  />
                </div>

                {/* Format note */}
                <span className="font-sans text-xs text-cloud/50 font-medium mt-2">
                  Supports WhatsApp <strong className="text-cloud font-bold">.txt</strong> &middot; Telegram Desktop{' '}
                  <strong className="text-cloud font-bold">.json</strong> &middot; Instagram DM{' '}
                  <strong className="text-cloud font-bold">.json</strong>
                </span>

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

          {/* Quick Help Guide */}
          {!pendingChat && (
            <div className="mt-8 text-center max-w-md space-y-2">
              <p className="font-sans text-cloud/50 text-xs leading-relaxed">
                <strong className="text-cloud/80">WhatsApp:</strong> Open chat → tap{' '}
                <strong className="text-cloud/80">More (⋮)</strong> →{' '}
                <strong className="text-cloud/80">Export chat</strong> → choose{' '}
                <strong className="text-cloud/80">Without Media</strong>.
              </p>
              <p className="font-sans text-cloud/50 text-xs leading-relaxed">
                <strong className="text-cloud/80">Telegram:</strong> In Telegram Desktop → open chat →{' '}
                <strong className="text-cloud/80">Export chat history</strong> → format:{' '}
                <strong className="text-cloud/80">Machine-readable JSON</strong>.
              </p>
              <p className="font-sans text-cloud/50 text-xs leading-relaxed">
                <strong className="text-cloud/80">Instagram:</strong> Settings → Your activity →{' '}
                <strong className="text-cloud/80">Download your information</strong> → format:{' '}
                <strong className="text-cloud/80">JSON</strong> → select one or all{' '}
                <code className="text-purple-300 font-mono">message_N.json</code> files.
              </p>
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
    <div className="bg-night text-cloud relative">
      <QuickNav messages={unifiedMessages} onOpenSettings={() => setIsSettingsOpen(true)} />

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night/80 backdrop-blur-md animate-fade-in"
          onClick={() => setPendingAdditionalChat(null)}
        >
          <div
            className="w-full max-w-md glass border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPendingAdditionalChat(null)}
              className="absolute top-5 right-5 text-cloud/40 hover:text-cloud transition-colors p-1 rounded-full cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <span className="font-sans text-xs uppercase tracking-wider text-pink font-semibold block mb-1">
              Link {pendingAdditionalChat.platform === 'instagram' ? 'Instagram' : pendingAdditionalChat.platform === 'telegram' ? 'Telegram' : 'WhatsApp'}
            </span>

            <h3 className="font-serif text-xl sm:text-2xl text-cloud font-semibold mb-2">
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
                  className="w-full bg-night/90 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-cloud focus:outline-none focus:border-pink transition-colors cursor-pointer"
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
                  className="w-full bg-night/90 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-cloud focus:outline-none focus:border-pink transition-colors cursor-pointer"
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
              <GlassButton text="Link &amp; Merge Platform ✨" onClick={handleConfirmAdditionalPlatform} />
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

      <Hero
        messages={unifiedMessages}
        senders={senders}
        herName={currentHerSender}
        himName={currentHimSender}
        rawSenders={rawSenders}
      />
      <CrossPlatformStats
        messages={unifiedMessages}
        loadedPlatforms={loadedPlatforms}
        onAddPlatform={() => addPlatformInputRef.current?.click()}
      />
      <Milestones messages={unifiedMessages} senders={senders} />
      <CalendarHeat messages={unifiedMessages} senders={senders} />
      <Highlights messages={unifiedMessages} senders={senders} />
      <ReelStats messages={unifiedMessages} senders={senders} />
      <MediaBreakdown messages={unifiedMessages} senders={senders} />
      <ActivityHeatmap messages={unifiedMessages} senders={senders} />
      <Initiator messages={unifiedMessages} senders={senders} />
      <ResponseTime messages={unifiedMessages} senders={senders} />
      <LoveWords messages={unifiedMessages} senders={senders} />
      <KeywordSearch messages={unifiedMessages} senders={senders} />
      <EmojiStats messages={unifiedMessages} senders={senders} />
      <ReactionStats messages={unifiedMessages} senders={senders} />
      <div id="word-cloud">
        <WordCloud messages={unifiedMessages} senders={senders} />
      </div>
      <RandomMemory messages={unifiedMessages} senders={senders} />
      <CalloutStreak messages={unifiedMessages} senders={senders} />
      <LongestMessage messages={unifiedMessages} senders={senders} />
      <Outro messages={unifiedMessages} senders={senders} />
    </div>
  );
}

export default App;