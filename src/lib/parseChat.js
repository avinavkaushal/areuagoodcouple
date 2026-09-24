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
export function createChatMessage({ id, sender, timestamp, text, type, _rawSender, meta }) {
  const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const msg = {
    id: String(id),
    sender: sender || 'unknown',
    timestamp: ts,
    text: text || '',
    type: type || 'text',
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
        reactions: m.meta.reactions.map((r) => ({
          ...r,
          ...(r.sender ? { sender: mapping[r.sender] || r.sender } : {}),
        })),
      };
    }

    return createChatMessage({
      id: m.id,
      sender: newSender,
      timestamp: m.timestamp,
      text: m.text,
      type: m.type,
      _rawSender: raw,
      meta: updatedMeta,
    });
  });
}

/**
 * Detect platform format from text and optional filename
 * @param {string} text
 * @param {string} [fileName='']
 * @returns {{ platform: 'whatsapp' | 'telegram' | null, data?: any }}
 */
export function detectPlatform(text, fileName = '') {
  if (typeof text !== 'string') return { platform: null };

  const trimmed = text.trim();
  const lowerName = (fileName || '').toLowerCase();

  // Telegram JSON detection: filename ends with .json or content looks like JSON with top-level messages array
  if (lowerName.endsWith('.json') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.messages)) {
        return { platform: 'telegram', data: parsed };
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

/**
 * High-level parser abstraction:
 * Parses a chat File (WhatsApp .txt or Telegram .json) and normalizes output into ChatMessage[]
 *
 * @param {File|Blob} file
 * @param {Record<string, 'Her' | 'Him' | string>} [nicknameMap={}]
 * @returns {Promise<{ platform: 'whatsapp' | 'telegram', messages: ChatMessage[], senders: string[], rawSenders: string[] }>}
 */
export async function parseChatFile(file, nicknameMap = {}) {
  if (!file) {
    throw new Error('No file provided.');
  }

  let text;
  if (typeof file.text === 'function') {
    text = await file.text();
  } else {
    text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('The selected file is empty.');
  }

  const detection = detectPlatform(text, file.name || '');

  if (!detection || !detection.platform) {
    throw new Error('Unrecognized format. Please provide a valid WhatsApp .txt export or Telegram .json export.');
  }

  if (detection.platform === 'telegram') {
    return parseTelegramJson(detection.data || text, nicknameMap);
  }

  if (detection.platform === 'whatsapp') {
    return parseWhatsApp(text, nicknameMap);
  }

  throw new Error('Unrecognized format. Please provide a valid WhatsApp .txt export or Telegram .json export.');
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