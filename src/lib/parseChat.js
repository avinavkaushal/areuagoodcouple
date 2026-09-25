/**
 * Common normalized schema:
 * @typedef {Object} ChatMessage
 * @property {string} id - Stable id, synthesized for WhatsApp (index-based)
 * @property {'Her' | 'Him' | string} sender - Mapped via nickname config
 * @property {Date} timestamp - Real Date object
 * @property {Date} date - Alias for timestamp (for backwards compatibility)
 * @property {string} text - Plain text, emojis included inline
 * @property {'text' | 'media' | 'sticker' | 'system'} type
 * @property {string} [_rawSender] - Original unmapped sender name
 * @property {Object} [meta]
 * @property {boolean} [meta.isReply]
 * @property {boolean} [meta.isForwarded]
 * @property {Array<{ emoji: string, sender?: string }>} [meta.reactions]
 */

const DASH_LINE_RE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([apAP]\.?\s*[mM]\.?))?\s+-\s+([^:]+?):\s+(.*)$/;
const BRACKET_LINE_RE = /^\[(\d{1,2})[/-](\d{1,2})[/-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([apAP]\.?\s*[mM]\.?))?\]\s+([^:]+?):\s+(.*)$/;

function parseDateTime(d, m, y, h, min, sec, ampm) {
  let year = +y;
  if (year < 100) year += 2000;
  const month = +m - 1;
  const day = +d;
  let hour = +h;
  const minutes = +min;
  const seconds = sec ? +sec : 0;

  if (ampm) {
    const isPM = ampm.toLowerCase().includes('p');
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
  }

  return new Date(year, month, day, hour, minutes, seconds);
}

/**
 * Creates a normalized ChatMessage object with both .timestamp and .date getters
 */
export function createChatMessage({ id, sender, timestamp, text, type, _rawSender, meta, platform }) {
  const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const msg = {
    id: String(id),
    sender: sender || 'unknown',
    timestamp: ts,
    text: text || '',
    type: type || 'text',
    ...(platform ? { platform } : {}),
    ...(meta ? { meta } : {}),
    ...(_rawSender ? { _rawSender } : {}),
  };

  // Provide date property pointing to timestamp for backwards compatibility
  Object.defineProperty(msg, 'date', {
    get() {
      return this.timestamp;
    },
    set(val) {
      this.timestamp = val instanceof Date ? val : new Date(val);
    },
    enumerable: true,
    configurable: true,
  });

  // Provide reactions property pointing directly to meta.reactions (single source of truth)
  Object.defineProperty(msg, 'reactions', {
    get() {
      return this.meta?.reactions || [];
    },
    enumerable: true,
    configurable: true,
  });

  // Provide content alias pointing to text
  Object.defineProperty(msg, 'content', {
    get() {
      return this.text || null;
    },
    set(val) {
      this.text = val || '';
    },
    enumerable: true,
    configurable: true,
  });

  return msg;
}

/**
 * Flatten Telegram text or text_entities into a single plain string
 */
export function flattenTelegramText(text, textEntities) {
  if (typeof text === 'string' && text.length > 0) {
    return text;
  }
  if (Array.isArray(text)) {
    return text
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }
  if (Array.isArray(textEntities) && textEntities.length > 0) {
    return textEntities
      .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
      .join('');
  }
  if (typeof text === 'string') {
    return text;
  }
  return '';
}

/**
 * Parse Telegram JSON export (result.json from Telegram Desktop)
 * @param {object|string} json - Parsed JSON object or raw JSON string
 * @param {Record<string, 'Her' | 'Him' | string>} [nicknameMap={}]
 * @returns {{ platform: 'telegram', messages: ChatMessage[], senders: string[], rawSenders: string[] }}
 */
export function parseTelegramJson(json, nicknameMap = {}) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || !Array.isArray(data.messages)) {
    throw new Error('Invalid Telegram export: missing top-level messages array.');
  }

  const rawSenderSet = new Set();
  const rawMessages = data.messages;

  // First pass: identify non-service senders
  for (const m of rawMessages) {
    if (m.type !== 'service' && m.from) {
      rawSenderSet.add(m.from.trim());
    }
  }

  const rawSenders = Array.from(rawSenderSet);

  const messages = [];

  for (let i = 0; i < rawMessages.length; i++) {
    const m = rawMessages[i];
    const isService = m.type === 'service' || Boolean(m.action);

    // Determine message type
    let type = 'text';
    if (isService) {
      type = 'system';
    } else if (
      m.media_type === 'sticker' ||
      m.type === 'sticker' ||
      Boolean(m.sticker_emoji) ||
      (typeof m.file === 'string' && (m.file.endsWith('.webp') || m.file.endsWith('.tgs')))
    ) {
      type = 'sticker';
    } else if (m.media_type || m.photo || m.file || m.mime_type) {
      type = 'media';
    }

    // Determine sender & raw sender
    const rawSender = isService ? (m.actor || 'system') : (m.from ? m.from.trim() : 'unknown');
    const mappedSender = nicknameMap[rawSender] || rawSender;

    // Determine timestamp
    let timestamp;
    if (m.date_unixtimestamp) {
      timestamp = new Date(Number(m.date_unixtimestamp) * 1000);
    } else if (m.date) {
      timestamp = new Date(m.date);
    } else {
      timestamp = new Date();
    }
    if (isNaN(timestamp.getTime())) {
      timestamp = new Date();
    }

    // Determine text
    let plainText = flattenTelegramText(m.text, m.text_entities);
    if (!plainText && m.sticker_emoji) {
      plainText = m.sticker_emoji;
    }

    // Determine meta
    const isReply = Boolean(m.reply_to_message_id && m.reply_to_message_id !== 0);
    const isForwarded = Boolean(m.forwarded_from);

    let reactions = undefined;
    if (Array.isArray(m.reactions) && m.reactions.length > 0) {
      const list = [];
      for (const r of m.reactions) {
        const emoji = r.emoji;
        if (Array.isArray(r.recent) && r.recent.length > 0) {
          for (const recent of r.recent) {
            list.push({
              emoji,
              ...(recent.from ? { sender: nicknameMap[recent.from] || recent.from } : {}),
            });
          }
        } else if (emoji) {
          const count = r.count || 1;
          for (let c = 0; c < count; c++) {
            list.push({ emoji });
          }
        }
      }
      if (list.length > 0) {
        reactions = list;
      }
    }

    let meta = undefined;
    if (isReply || isForwarded || reactions) {
      meta = {
        ...(isReply ? { isReply: true } : {}),
        ...(isForwarded ? { isForwarded: true } : {}),
        ...(reactions ? { reactions } : {}),
      };
    }

    const message = createChatMessage({
      id: m.id != null ? String(m.id) : `tg-${i}`,
      sender: mappedSender,
      timestamp,
      text: plainText,
      type,
      _rawSender: rawSender,
      meta,
      platform: 'telegram',
    });

    messages.push(message);
  }

  // Determine mapped senders list (preserving 2 participants)
  const mappedSenders = rawSenders.map((name) => nicknameMap[name] || name);

  return {
    platform: 'telegram',
    messages,
    senders: mappedSenders,
    rawSenders,
  };
}

/**
 * Parse WhatsApp chat export (.txt format)
 * @param {string} text
 * @param {Record<string, 'Her' | 'Him' | string>} [nicknameMap={}]
 * @returns {{ platform: 'whatsapp', messages: ChatMessage[], senders: string[], rawSenders: string[] }}
 */
export function parseWhatsApp(text, nicknameMap = {}) {
  if (!text || typeof text !== 'string') {
    return { platform: 'whatsapp', messages: [], senders: [], rawSenders: [] };
  }

  const lines = text.split(/\r?\n/);
  const messages = [];
  const rawSenderSet = new Set();

  for (const rawLine of lines) {
    // Strip invisible unicode directional formatting characters
    const line = rawLine.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
    let match = line.match(DASH_LINE_RE);
    if (!match) {
      match = line.match(BRACKET_LINE_RE);
    }

    if (match) {
      const [, day, month, year, hour, min, sec, ampm, senderRaw, msg] = match;
      const rawSender = senderRaw.trim();
      const date = parseDateTime(day, month, year, hour, min, sec, ampm);

      if (rawSender) {
        rawSenderSet.add(rawSender);
        const mappedSender = nicknameMap[rawSender] || rawSender;

        let type = 'text';
        if (msg.includes('<sticker omitted>') || msg.includes('sticker omitted')) {
          type = 'sticker';
        } else if (msg.includes('<Media omitted>') || msg.includes('omitted>')) {
          type = 'media';
        }

        const chatMsg = createChatMessage({
          id: `wa-${messages.length}`,
          sender: mappedSender,
          timestamp: date,
          text: msg,
          type,
          _rawSender: rawSender,
          platform: 'whatsapp',
        });

        messages.push(chatMsg);
      }
    } else if (messages.length > 0) {
      messages[messages.length - 1].text += '\n' + rawLine;
    }
  }

  const rawSenders = Array.from(rawSenderSet);
  const mappedSenders = rawSenders.map((s) => nicknameMap[s] || s);

  return {
    platform: 'whatsapp',
    messages,
    senders: mappedSenders,
    rawSenders,
  };
}

/**
 * Re-maps message senders based on a newly selected nickname mapping
 * @param {ChatMessage[]} messages
 * @param {Record<string, 'Her' | 'Him' | string>} mapping
 * @returns {ChatMessage[]}
 */
export function applyNicknameMapping(messages, mapping = {}) {
  return (messages || []).map((m) => {
    const raw = m._rawSender || m.sender;
    const newSender = mapping[raw] || mapping[m.sender] || m.sender;

    let updatedMeta = m.meta;
    if (m.meta?.reactions) {
      updatedMeta = {
        ...m.meta,
        reactions: m.meta.reactions.map((r) => {
          const rawActor = r._rawActor || r.actor || r.sender;
          const mapped = mapping[rawActor] || mapping[r.actor] || mapping[r.sender] || r.actor || r.sender;
          return {
            ...r,
            sender: mapped,
            actor: mapped,
          };
        }),
      };
    }

    const newMsg = createChatMessage({
      id: m.id,
      sender: newSender,
      timestamp: m.timestamp,
      text: m.text,
      type: m.type,
      _rawSender: raw,
      meta: updatedMeta,
      platform: m.platform,
    });
    newMsg.content = newMsg.text || null;
    return newMsg;
  });
}

export function fixMojibake(str) {
  if (typeof str !== 'string' || !str) return str;

  let hasHighByte = false;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 255) {
      // String already has genuine multi-byte Unicode code points
      return str;
    }
    if (code >= 0x80) {
      hasHighByte = true;
    }
  }

  // Pure ASCII doesn't need re-decoding
  if (!hasHighByte) {
    return str;
  }

  try {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return str;
  }
}

/**
 * Check if an Instagram message is unsent / deleted or empty ghost entry
 */
function isDeletedOrUnsent(m, decodedContent) {
  if (m.is_unsent === true) return true;
  const hasPhotos = Array.isArray(m.photos) && m.photos.length > 0;
  const hasVideos = Array.isArray(m.videos) && m.videos.length > 0;
  const hasAudio = Array.isArray(m.audio_files) && m.audio_files.length > 0;
  const hasShare = Boolean(m.share && (m.share.link || m.share.share_text));
  const hasMedia = hasPhotos || hasVideos || hasAudio || hasShare;

  const text = (decodedContent || '').trim();
  // Empty content with no media/share
  if (!hasMedia && !text) return true;
  // Instagram unsent placeholder text
  if (!hasMedia && /^(you unsent a message|unsent a message|this message was unsent)$/i.test(text)) {
    return true;
  }
  return false;
}

function deriveInstagramMessageType(m, decodedContent) {
  const shareLink = (m.share?.link || '').toLowerCase();
  const text = (decodedContent || '').trim();

  // 1. Reel share: share link contains /reel/ or /reels/
  if (shareLink && (shareLink.includes('/reel/') || shareLink.includes('/reels/'))) {
    return 'reel_share';
  }

  const isStoryLink = shareLink && shareLink.includes('/stories/');
  const isStoryText = /^(replied to (their|your) story|reacted to (their|your) story)/i.test(text);
  if (isStoryLink || isStoryText || m.story_share) {
    return 'story_reply';
  }

  // 3. Photos: message contains photos array, no share/reel link
  if (Array.isArray(m.photos) && m.photos.length > 0 && m.photos.some((p) => p && p.uri)) {
    return 'photo';
  }

  // 4. Videos: message contains videos array, no share/reel link
  if (Array.isArray(m.videos) && m.videos.length > 0 && m.videos.some((v) => v && v.uri)) {
    return 'video';
  }

  // 5. Fallback media
  if ((Array.isArray(m.audio_files) && m.audio_files.length > 0) || shareLink) {
    return 'media';
  }

  return 'text';
}

/**
 * Parse Instagram DM JSON export (single or multiple message_N.json files)
 * @param {object|string|Array<object|string>} jsonOrArray
 * @param {Record<string, 'Her' | 'Him' | string>} [nicknameMap={}]
 * @returns {{ platform: 'instagram', messages: ChatMessage[], senders: string[], rawSenders: string[] }}
 */
export function parseInstagramJson(jsonOrArray, nicknameMap = {}) {
  const inputs = Array.isArray(jsonOrArray) ? jsonOrArray : [jsonOrArray];
  const allRawMessages = [];
  const rawSenderSet = new Set();

  for (const input of inputs) {
    const data = typeof input === 'string' ? JSON.parse(input) : input;
    if (!data) continue;

    // Collect participants if present
    if (Array.isArray(data.participants)) {
      for (const p of data.participants) {
        if (p && p.name) {
          const fixedName = fixMojibake(p.name).trim();
          if (fixedName) rawSenderSet.add(fixedName);
        }
      }
    }

    if (Array.isArray(data.messages)) {
      allRawMessages.push(...data.messages);
    }
  }

  if (allRawMessages.length === 0) {
    throw new Error('Invalid Instagram export: no messages found.');
  }

  // Deduplicate messages across paginated files by sender + timestamp_ms + content + share.link
  const seenKeys = new Set();
  const dedupedMessages = [];

  for (const m of allRawMessages) {
    if (!m) continue;
    const rawSender = fixMojibake(m.sender_name || 'unknown').trim();
    if (rawSender && rawSender !== 'unknown') {
      rawSenderSet.add(rawSender);
    }

    const decodedContent = fixMojibake(m.content);

    // Filter out unsent / deleted messages
    if (isDeletedOrUnsent(m, decodedContent)) {
      continue;
    }

    const ts = Number(m.timestamp_ms) || 0;
    const shareLink = m.share?.link || '';
    const dedupeKey = `${rawSender}|${ts}|${decodedContent || ''}|${shareLink}`;
    if (seenKeys.has(dedupeKey)) {
      continue;
    }
    seenKeys.add(dedupeKey);

    dedupedMessages.push({
      raw: m,
      rawSender,
      decodedContent,
      timestamp_ms: ts,
    });
  }

  // Sort chronologically ascending by timestamp_ms
  dedupedMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  const rawSenders = Array.from(rawSenderSet);
  const messages = [];

  for (let i = 0; i < dedupedMessages.length; i++) {
    const { raw: m, rawSender, decodedContent, timestamp_ms } = dedupedMessages[i];
    const mappedSender = nicknameMap[rawSender] || rawSender;
    const timestamp = new Date(timestamp_ms);
    const type = deriveInstagramMessageType(m, decodedContent);

    // Parse reactions attached to message
    let reactions = undefined;
    if (Array.isArray(m.reactions) && m.reactions.length > 0) {
      reactions = m.reactions
        .map((r) => {
          const emoji = fixMojibake(r.reaction);
          const actorRaw = fixMojibake(r.actor);
          const actorMapped = actorRaw ? nicknameMap[actorRaw] || actorRaw : undefined;
          let reactionDate = undefined;
          if (r.timestamp_ms) {
            reactionDate = new Date(Number(r.timestamp_ms));
          } else if (r.timestamp) {
            const rawTs = Number(r.timestamp);
            reactionDate = new Date(rawTs > 1e11 ? rawTs : rawTs * 1000);
          }
          const hasValidDate = reactionDate && !isNaN(reactionDate.getTime());

          return {
            emoji,
            reaction: emoji,
            sender: actorMapped,
            actor: actorMapped,
            _rawActor: actorRaw,
            ...(hasValidDate ? { timestamp: reactionDate } : {}),
          };
        })
        .filter((r) => Boolean(r.emoji));
      if (reactions.length === 0) reactions = undefined;
    }

    // Filter broken photos/videos in meta
    const validPhotos = Array.isArray(m.photos)
      ? m.photos.filter((p) => p && typeof p.uri === 'string' && p.uri.trim() !== '')
      : undefined;
    const validVideos = Array.isArray(m.videos)
      ? m.videos.filter((v) => v && typeof v.uri === 'string' && v.uri.trim() !== '')
      : undefined;

    const meta = {
      ...(reactions ? { reactions } : {}),
      ...(m.share ? { share: m.share, reelLink: m.share.link } : {}),
      ...(validPhotos && validPhotos.length > 0 ? { photos: validPhotos } : {}),
      ...(validVideos && validVideos.length > 0 ? { videos: validVideos } : {}),
      ...(type === 'story_reply' ? { isStoryReply: true } : {}),
    };

    const chatMsg = createChatMessage({
      id: `ig-${timestamp_ms}-${i}`,
      sender: mappedSender,
      timestamp,
      text: decodedContent || '',
      type,
      _rawSender: rawSender,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
      platform: 'instagram',
    });

    chatMsg.content = chatMsg.text || null;

    messages.push(chatMsg);
  }

  const mappedSenders = rawSenders.map((s) => nicknameMap[s] || s);

  return {
    platform: 'instagram',
    messages,
    senders: mappedSenders,
    rawSenders,
  };
}

/**
 * Detect platform format from text and optional filename
 * @param {string} text
 * @param {string} [fileName='']
 * @returns {{ platform: 'whatsapp' | 'telegram' | 'instagram' | null, data?: any }}
 */
export function detectPlatform(text, fileName = '') {
  if (typeof text !== 'string') return { platform: null };

  const trimmed = text.trim();
  const lowerName = (fileName || '').toLowerCase();

  // JSON detection
  if (lowerName.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const isArray = Array.isArray(parsed);
      const obj = isArray ? parsed[0] : parsed;

      if (obj && typeof obj === 'object') {
        // Instagram detection:
        // Has participants array or messages with sender_name or timestamp_ms
        if (
          Array.isArray(obj.participants) ||
          (Array.isArray(obj.messages) &&
            obj.messages.some((m) => m && ('sender_name' in m || 'timestamp_ms' in m)))
        ) {
          return { platform: 'instagram', data: parsed };
        }

        // Telegram detection:
        // Has top-level messages array (or type: personal_chat / id)
        if (Array.isArray(obj.messages)) {
          return { platform: 'telegram', data: parsed };
        }
      }
    } catch {
      // not valid JSON, fall through to check WhatsApp
    }
  }

  // WhatsApp detection: check first 100 lines for WhatsApp export patterns
  const lines = trimmed.split(/\r?\n/).slice(0, 100);
  for (const rawLine of lines) {
    const line = rawLine.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
    if (DASH_LINE_RE.test(line) || BRACKET_LINE_RE.test(line)) {
      return { platform: 'whatsapp' };
    }
  }

  return { platform: null };
}

async function readFileText(file) {
  if (typeof file.text === 'function') {
    return await file.text();
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parses multiple chat files (e.g. paginated Instagram message_1.json, message_2.json)
 * @param {File[]|FileList} files
 * @param {Record<string, 'Her' | 'Him' | string>} [nicknameMap={}]
 * @returns {Promise<{ platform: 'whatsapp' | 'telegram' | 'instagram', messages: ChatMessage[], senders: string[], rawSenders: string[] }>}
 */
export async function parseChatFiles(files, nicknameMap = {}) {
  const fileArray = Array.from(files || []).filter(Boolean);
  if (fileArray.length === 0) {
    throw new Error('No files provided.');
  }

  if (fileArray.length === 1) {
    return parseChatFile(fileArray[0], nicknameMap);
  }

  // Multiple files: read all and parse
  const contents = await Promise.all(
    fileArray.map(async (file) => {
      const text = await readFileText(file);
      const detection = detectPlatform(text, file.name);
      return { file, text, detection };
    })
  );

  const instagramPayloads = [];
  const telegramItems = [];
  const whatsappItems = [];

  for (const item of contents) {
    if (item.detection && item.detection.platform === 'instagram') {
      instagramPayloads.push(item.detection.data || JSON.parse(item.text));
    } else if (item.detection && item.detection.platform === 'telegram') {
      telegramItems.push(item);
    } else if (item.detection && item.detection.platform === 'whatsapp') {
      whatsappItems.push(item);
    }
  }

  const detectedPlatformNames = [
    instagramPayloads.length > 0 ? 'instagram' : null,
    telegramItems.length > 0 ? 'telegram' : null,
    whatsappItems.length > 0 ? 'whatsapp' : null,
  ].filter(Boolean);

  // If only Instagram files are present
  if (detectedPlatformNames.length === 1 && detectedPlatformNames[0] === 'instagram') {
    return parseInstagramJson(instagramPayloads, nicknameMap);
  }

  // If only Telegram files
  if (detectedPlatformNames.length === 1 && detectedPlatformNames[0] === 'telegram') {
    return parseTelegramJson(telegramItems[0].detection?.data || telegramItems[0].text, nicknameMap);
  }

  // If only WhatsApp files
  if (detectedPlatformNames.length === 1 && detectedPlatformNames[0] === 'whatsapp') {
    return parseWhatsApp(whatsappItems[0].text, nicknameMap);
  }

  // If mixed platforms were dropped together
  if (detectedPlatformNames.length > 1) {
    const platforms = [];
    if (whatsappItems.length > 0) {
      platforms.push(parseWhatsApp(whatsappItems[0].text, nicknameMap));
    }
    if (telegramItems.length > 0) {
      platforms.push(parseTelegramJson(telegramItems[0].detection?.data || telegramItems[0].text, nicknameMap));
    }
    if (instagramPayloads.length > 0) {
      platforms.push(parseInstagramJson(instagramPayloads, nicknameMap));
    }
    return {
      multiPlatform: true,
      platforms,
    };
  }

  // If unrecognized, fallback to first file
  return parseChatFile(fileArray[0], nicknameMap);
}

/**
 *
 * @param {File|Blob|File[]|FileList} fileOrFiles
 * @param {Record<string, 'Her' | 'Him' | string>} [nicknameMap={}]
 * @returns {Promise<{ platform: 'whatsapp' | 'telegram' | 'instagram', messages: ChatMessage[], senders: string[], rawSenders: string[] }>}
 */
export async function parseChatFile(fileOrFiles, nicknameMap = {}) {
  if (!fileOrFiles) {
    throw new Error('No file provided.');
  }

  if (Array.isArray(fileOrFiles) || (typeof FileList !== 'undefined' && fileOrFiles instanceof FileList)) {
    const list = Array.from(fileOrFiles);
    if (list.length > 1) {
      return parseChatFiles(list, nicknameMap);
    }
    fileOrFiles = list[0];
  }

  const file = fileOrFiles;
  const text = await readFileText(file);

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('The selected file is empty.');
  }

  const detection = detectPlatform(text, file.name || '');

  if (!detection || !detection.platform) {
    throw new Error(
      'Unrecognized format. Please provide a valid WhatsApp .txt export, Telegram .json export, or Instagram .json export.'
    );
  }

  if (detection.platform === 'instagram') {
    return parseInstagramJson(detection.data || text, nicknameMap);
  }

  if (detection.platform === 'telegram') {
    return parseTelegramJson(detection.data || text, nicknameMap);
  }

  if (detection.platform === 'whatsapp') {
    return parseWhatsApp(text, nicknameMap);
  }

  throw new Error(
    'Unrecognized format. Please provide a valid WhatsApp .txt export, Telegram .json export, or Instagram .json export.'
  );
}

/**
 * Backwards-compatible export for existing callers
 */
export function parseChat(text, nicknameMap = {}) {
  const result = parseWhatsApp(text, nicknameMap);
  return {
    messages: result.messages,
    senders: result.senders,
    rawSenders: result.rawSenders,
  };
}