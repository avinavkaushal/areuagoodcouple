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

export function parseChat(text) {
  if (!text || typeof text !== 'string') {
    return { messages: [], senders: [] };
  }

  const lines = text.split(/\r?\n/);
  const messages = [];
  const senderSet = new Set();

  for (const rawLine of lines) {
    // Strip invisible unicode directional formatting characters
    const line = rawLine.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
    let match = line.match(DASH_LINE_RE);
    if (!match) {
      match = line.match(BRACKET_LINE_RE);
    }

    if (match) {
      const [, day, month, year, hour, min, sec, ampm, senderRaw, msg] = match;
      const sender = senderRaw.trim();
      const date = parseDateTime(day, month, year, hour, min, sec, ampm);

      if (sender) {
        senderSet.add(sender);
        messages.push({
          date,
          sender,
          text: msg
        });
      }
    } else if (messages.length > 0) {
      messages[messages.length - 1].text += '\n' + rawLine;
    }
  }

  return {
    messages,
    senders: Array.from(senderSet)
  };
}