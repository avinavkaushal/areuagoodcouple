const EMOJI_RE = /(\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)/gu;

export function formatDuration(firstDate, lastDate) {
  if (!firstDate || !lastDate) return 'our time';
  const start = firstDate instanceof Date ? firstDate : new Date(firstDate);
  const end = lastDate instanceof Date ? lastDate : new Date(lastDate);
  const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  if (diffDays < 30) {
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  }
  if (diffDays < 365) {
    const months = Math.max(1, Math.round(diffDays / 30.4375));
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.floor(diffDays / 365.25);
  const remMonths = Math.round((diffDays % 365.25) / 30.4375);
  if (remMonths === 0 || remMonths === 12) {
    const totalYears = remMonths === 12 ? years + 1 : years;
    return totalYears === 1 ? '1 year' : `${totalYears} years`;
  }
  const yStr = years === 1 ? '1 year' : `${years} years`;
  const mStr = remMonths === 1 ? '1 month' : `${remMonths} months`;
  return `${yStr}, ${mStr}`;
}

export function formatSinceDate(firstDate) {
  if (!firstDate) return '';
  const date = firstDate instanceof Date ? firstDate : new Date(firstDate);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getNonSystemMessages(messages) {
  return (messages || []).filter((m) => m && m.type !== 'system');
}

function getMsgDate(m) {
  return m ? (m.timestamp instanceof Date ? m.timestamp : (m.date instanceof Date ? m.date : new Date(m.timestamp || m.date || 0))) : new Date();
}

export function getEmojiStats(messages) {
  const counts = {}; // { sender: { emoji: count } }
  const validMessages = messages || [];

  for (const m of validMessages) {
    const emojis = (m.text || '').match(EMOJI_RE) || [];
    if (!counts[m.sender]) counts[m.sender] = {};
    for (const e of emojis) {
      counts[m.sender][e] = (counts[m.sender][e] || 0) + 1;
    }
  }
  const result = {};
  for (const sender in counts) {
    const sorted = Object.entries(counts[sender]).sort((a, b) => b[1] - a[1]);
    result[sender] = sorted.slice(0, 5); // top 5 per person
  }
  return result;
}

export function getEmojiComparison(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const order = [p1, p2];
  const bySender = { [p1]: {}, [p2]: {} };
  const total = {};
  const validMessages = messages || [];

  for (const m of validMessages) {
    const emojis = (m.text || '').match(EMOJI_RE) || [];
    if (!bySender[m.sender]) continue;
    for (const e of emojis) {
      bySender[m.sender][e] = (bySender[m.sender][e] || 0) + 1;
      total[e] = (total[e] || 0) + 1;
    }
  }

  const topEmojis = Object.entries(total)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([e]) => e);

  const rows = topEmojis.map((e) => ({
    emoji: e,
    left: bySender[p1]?.[e] || 0,
    right: bySender[p2]?.[e] || 0,
  }));

  const maxVal = Math.max(...rows.map((r) => Math.max(r.left, r.right)), 1);

  return { order, rows, maxVal };
}

export function getKeywordStats(messages, keyword) {
  const kw = (keyword || '').trim().toLowerCase();
  const validMessages = messages || [];
  if (!kw || validMessages.length === 0) return null;

  const hourCounts = new Array(24).fill(0);
  const hitTimestamps = [];
  let count = 0;

  for (let i = 0; i < validMessages.length; i++) {
    const m = validMessages[i];
    if ((m.text || '').toLowerCase().includes(kw)) {
      count++;
      const d = getMsgDate(m);
      const h = d.getHours();
      hourCounts[h]++;
      hitTimestamps.push(d.getTime());
    }
  }

  if (count === 0) {
    return { count: 0, topHour: null, avgGapDays: null, timelineTimestamps: [] };
  }

  let topHour = 0;
  let maxHCount = -1;
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > maxHCount) {
      maxHCount = hourCounts[h];
      topHour = h;
    }
  }

  let avgGapDays = null;
  if (hitTimestamps.length > 1) {
    let totalGapMs = 0;
    for (let i = 1; i < hitTimestamps.length; i++) {
      totalGapMs += hitTimestamps[i] - hitTimestamps[i - 1];
    }
    avgGapDays = totalGapMs / (hitTimestamps.length - 1) / (1000 * 60 * 60 * 24);
  }

  let timelineTimestamps = [];
  if (hitTimestamps.length <= 500) {
    timelineTimestamps = hitTimestamps;
  } else {
    const step = (hitTimestamps.length - 1) / 499;
    for (let i = 0; i < 500; i++) {
      timelineTimestamps.push(hitTimestamps[Math.round(i * step)]);
    }
  }

  return { count, topHour, avgGapDays, timelineTimestamps };
}

export function getHeatmapData(messages) {
  // grid[day][hour] = count, day 0=Sun..6=Sat
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  const validMessages = messages || [];

  validMessages.forEach((m) => {
    const d = getMsgDate(m);
    grid[d.getDay()][d.getHours()]++;
  });
  return grid;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Reusable streak helper: longest run of consecutive calendar days where matchFn(m) is true
export function getLongestStreak(messages, matchFn) {
  const validMessages = messages || [];
  if (validMessages.length === 0) return 0;
  const dayTimestamps = new Set();

  for (let i = 0; i < validMessages.length; i++) {
    const m = validMessages[i];
    if (!matchFn || matchFn(m)) {
      const d = getMsgDate(m);
      const dayTs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      dayTimestamps.add(dayTs);
    }
  }

  if (dayTimestamps.size === 0) return 0;

  const sortedDays = Array.from(dayTimestamps).sort((a, b) => a - b);
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const diff = Math.round((sortedDays[i] - sortedDays[i - 1]) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

export function getHighlights(messages) {
  const validMessages = messages || [];
  if (validMessages.length === 0) {
    return {
      busiestDay: null,
      busiestMonth: null,
      longestStreak: 0,
      longestGapDays: 0,
    };
  }

  const dayCounts = {};
  const monthCounts = {};
  validMessages.forEach((m) => {
    const d = getMsgDate(m);
    const dKey = d.toDateString();
    const mKey = `${d.getFullYear()}-${d.getMonth()}`;
    dayCounts[dKey] = (dayCounts[dKey] || 0) + 1;
    monthCounts[mKey] = (monthCounts[mKey] || 0) + 1;
  });

  const busiestDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const busiestMonthEntry = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];

  const uniqueDaysSorted = [...new Set(validMessages.map((m) => getMsgDate(m).toDateString()))]
    .map((d) => new Date(d))
    .sort((a, b) => a - b);

  let longestGapDays = 0;
  for (let i = 1; i < uniqueDaysSorted.length; i++) {
    const diff = (uniqueDaysSorted[i] - uniqueDaysSorted[i - 1]) / (1000 * 60 * 60 * 24);
    longestGapDays = Math.max(longestGapDays, diff);
  }

  const longestStreak = getLongestStreak(validMessages);
  const [year, month] = busiestMonthEntry ? busiestMonthEntry[0].split('-').map(Number) : [null, null];

  return {
    busiestDay: busiestDayEntry
      ? { label: new Date(busiestDayEntry[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }), count: busiestDayEntry[1] }
      : null,
    busiestMonth: busiestMonthEntry
      ? { label: `${MONTH_NAMES[month]} ${year}`, count: busiestMonthEntry[1] }
      : null,
    longestStreak,
    longestGapDays: Math.round(longestGapDays),
  };
}

const STOPWORDS = new Set([
  'the','a','an','is','to','and','of','in','it','you','i','for','on','with','this','that',
  'hai','ho','ka','ki','ke','h','na','se','ko','bhi','toh','hi','ye','main','tha','thi',
  'nahi','kya','to','me','my','your','are','was','be','but','so','just','not','de','do','media','omitted',
  'voice','deleted','message','tum','tu','have','rhi','hum','get','we','nahi','aur','nhi',
  'mein','don','can','tho','will','mujhe','tumhe','waha','kuch','kya','hogi','kar','liye',
  'hun','rha','meh','yeh','mei','woh','are','what','why','how','meri','teri','mera', "http", 
  "link","https", 'sent', 'attachment', 'reacted', 'link', 
]);

export function getWordCloudData(messages, topN = 40) {
  const counts = {};
  const validMessages = messages || [];

  validMessages.forEach((m) => {
    const words = (m.text || '').toLowerCase().match(/[a-z\p{sc=Devanagari}]+/gu) || [];
    words.forEach((w) => {
      if (w.length < 3 || STOPWORDS.has(w)) return;
      counts[w] = (counts[w] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([text, value]) => ({ text, value }));
}

export function isMediaMessage(m) {
  if (!m) return false;
  return (
    m.type === 'media' ||
    m.type === 'sticker' ||
    m.type === 'photo' ||
    m.type === 'video' ||
    m.type === 'reel_share' ||
    Boolean(m.text && (m.text.includes('<Media omitted>') || m.text.includes('omitted>')))
  );
}

export function getMediaStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  let count1 = 0;
  let count2 = 0;
  const validMessages = messages || [];

  validMessages.forEach((m) => {
    if (isMediaMessage(m)) {
      if (m.sender === p1) count1++;
      else if (m.sender === p2) count2++;
    }
  });
  const total = count1 + count2;
  return { [p1]: count1, [p2]: count2, count1, count2, total };
}

export function getOverviewStats(messages) {
  const validMessages = messages || [];
  if (validMessages.length === 0) {
    return { totalMessages: 0, totalWords: 0, uniqueDays: 0, totalMedia: 0, firstDate: null, lastDate: null };
  }
  const totalMessages = validMessages.length;
  const totalWords = validMessages.reduce((sum, m) => sum + (m.text || '').trim().split(/\s+/).filter(Boolean).length, 0);
  const uniqueDays = new Set(validMessages.map((m) => getMsgDate(m).toDateString())).size;
  const totalMedia = validMessages.filter(isMediaMessage).length;
  const firstDate = getMsgDate(validMessages[0]);
  const lastDate = getMsgDate(validMessages[validMessages.length - 1]);
  return { totalMessages, totalWords, uniqueDays, totalMedia, firstDate, lastDate };
}

export function getPeakSlot(grid) {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  let best = { day: 0, hour: 0, count: 0 };
  grid.forEach((row, d) => {
    row.forEach((count, h) => {
      if (count > best.count) best = { day: d, hour: h, count };
    });
  });
  const period = best.hour < 12 ? 'am' : 'pm';
  const h12 = best.hour % 12 === 0 ? 12 : best.hour % 12;
  return { dayName: DAYS[best.day], hourLabel: `${h12}${period}`, count: best.count };
}

export function getCalendarHeat(messages) {
  const validMessages = messages || [];
  if (validMessages.length === 0) return [];
  const firstDate = getMsgDate(validMessages[0]);
  const lastDate = getMsgDate(validMessages[validMessages.length - 1]);

  const countsByDay = {};
  validMessages.forEach((m) => {
    const d = getMsgDate(m);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    countsByDay[key] = (countsByDay[key] || 0) + 1;
  });

  const result = [];
  const cur = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
  const end = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    result.push({
      date: new Date(cur),
      count: countsByDay[key] || 0,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

export function getInitiatorStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const firstMsgByDay = {}; // { YYYY-MM-DD: sender }
  const validMessages = messages || [];

  validMessages.forEach((m) => {
    const d = getMsgDate(m);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!firstMsgByDay[key]) {
      firstMsgByDay[key] = m.sender;
    }
  });

  let count1 = 0;
  let count2 = 0;
  Object.values(firstMsgByDay).forEach((sender) => {
    if (sender === p1) count1++;
    else if (sender === p2) count2++;
  });

  const total = count1 + count2;
  const p1Pct = total > 0 ? Math.round((count1 / total) * 100) : 0;
  const p2Pct = total > 0 ? 100 - p1Pct : 0;

  return {
    p1: { name: p1, count: count1, pct: p1Pct },
    p2: { name: p2, count: count2, pct: p2Pct },
  };
}

export function getLongestMessage(messages, senders) {
  const defaultSender = senders && senders[0] ? senders[0] : 'unknown';
  const validMessages = (messages || []).filter((m) => !isMediaMessage(m));
  if (validMessages.length === 0) {
    return { text: '', wordCount: 0, sender: defaultSender, date: new Date() };
  }

  let best = null;
  let maxWords = -1;

  validMessages.forEach((m) => {
    const words = (m.text || '').trim().split(/\s+/).filter(Boolean).length;
    if (words > maxWords) {
      maxWords = words;
      best = m;
    }
  });

  if (!best) {
    return { text: '', wordCount: 0, sender: defaultSender, date: new Date() };
  }

  const rawText = (best.text || '').trim();
  const truncatedText = rawText.length > 200 ? rawText.slice(0, 200).trim() + '…' : rawText;

  return {
    text: truncatedText,
    wordCount: maxWords,
    sender: best.sender,
    date: getMsgDate(best),
  };
}

export function getLateNightStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  let count1Total = 0;
  let count2Total = 0;
  let count1Late = 0;
  let count2Late = 0;
  const validMessages = messages || [];

  validMessages.forEach((m) => {
    const d = getMsgDate(m);
    const h = d.getHours();
    const isLate = h >= 0 && h < 4;
    if (m.sender === p1) {
      count1Total++;
      if (isLate) count1Late++;
    } else if (m.sender === p2) {
      count2Total++;
      if (isLate) count2Late++;
    }
  });

  const p1Pct = count1Total > 0 ? Math.round((count1Late / count1Total) * 100) : 0;
  const p2Pct = count2Total > 0 ? Math.round((count2Late / count2Total) * 100) : 0;

  return {
    p1: { name: p1, count: count1Late, pct: p1Pct },
    p2: { name: p2, count: count2Late, pct: p2Pct },
  };
}

export function getVerbosityStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  let words1 = 0;
  let msgs1 = 0;
  let words2 = 0;
  let msgs2 = 0;
  const validMessages = (messages || []).filter((m) => !isMediaMessage(m));

  validMessages.forEach((m) => {
    const words = (m.text || '').trim().split(/\s+/).filter(Boolean).length;
    if (m.sender === p1) {
      words1 += words;
      msgs1++;
    } else if (m.sender === p2) {
      words2 += words;
      msgs2++;
    }
  });

  const avg1 = msgs1 > 0 ? +(words1 / msgs1).toFixed(1) : 0;
  const avg2 = msgs2 > 0 ? +(words2 / msgs2).toFixed(1) : 0;

  return {
    p1: { name: p1, avg: avg1 },
    p2: { name: p2, avg: avg2 },
  };
}

// ---------------------------------------------------------------------------
// FEATURE BATCH 2 STAT COMPUTATIONS
// ---------------------------------------------------------------------------

// Format milliseconds into human-friendly duration
export function formatResponseTime(ms) {
  if (ms == null || isNaN(ms) || ms < 0) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `~${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) {
    return remMins > 0 ? `~${hrs}h ${remMins}m` : `~${hrs}h`;
  }
  const days = Math.round(mins / 1440);
  return `~${days} day${days === 1 ? '' : 's'}`;
}

// 1. Response Time
export function getResponseTimeStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const data = {
    [p1]: { sumMs: 0, count: 0, longestGapMs: 0, longestGapDate: null },
    [p2]: { sumMs: 0, count: 0, longestGapMs: 0, longestGapDate: null },
  };

  const MAX_REPLY_GAP = 12 * 60 * 60 * 1000; // 12 hours
  const validMessages = messages || [];

  if (validMessages.length > 1) {
    for (let i = 1; i < validMessages.length; i++) {
      const prev = validMessages[i - 1];
      const curr = validMessages[i];
      if (curr.sender !== prev.sender) {
        const replier = curr.sender;
        if (data[replier]) {
          const currTime = getMsgDate(curr).getTime();
          const prevTime = getMsgDate(prev).getTime();
          const gapMs = Math.max(0, currTime - prevTime);
          if (gapMs <= MAX_REPLY_GAP) {
            data[replier].sumMs += gapMs;
            data[replier].count++;
          }
          if (gapMs > data[replier].longestGapMs) {
            data[replier].longestGapMs = gapMs;
            data[replier].longestGapDate = getMsgDate(curr);
          }
        }
      }
    }
  }

  const p1Avg = data[p1].count > 0 ? Math.round(data[p1].sumMs / data[p1].count) : 0;
  const p2Avg = data[p2].count > 0 ? Math.round(data[p2].sumMs / data[p2].count) : 0;

  return {
    [p1]: {
      name: p1,
      avgReplyMs: p1Avg,
      formattedAvg: formatResponseTime(p1Avg),
      longestGapMs: data[p1].longestGapMs,
      formattedLongestGap: formatResponseTime(data[p1].longestGapMs),
      longestGapDate: data[p1].longestGapDate,
      replyCount: data[p1].count,
    },
    [p2]: {
      name: p2,
      avgReplyMs: p2Avg,
      formattedAvg: formatResponseTime(p2Avg),
      longestGapMs: data[p2].longestGapMs,
      formattedLongestGap: formatResponseTime(data[p2].longestGapMs),
      longestGapDate: data[p2].longestGapDate,
      replyCount: data[p2].count,
    },
    order: [p1, p2],
    fasterSender: p1Avg > 0 && p2Avg > 0 ? (p1Avg <= p2Avg ? p1 : p2) : (p1Avg > 0 ? p1 : p2),
  };
}

// 2. Milestone Counter
export function getMilestoneStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const validMessages = messages || [];
  const totalMessages = validMessages.length;
  let totalWords = 0;
  const msgsBySender = { [p1]: 0, [p2]: 0 };
  const wordsBySender = { [p1]: 0, [p2]: 0 };
  const dayCounts = {};

  for (let i = 0; i < validMessages.length; i++) {
    const m = validMessages[i];
    const words = (m.text || '').trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;
    if (msgsBySender[m.sender] !== undefined) {
      msgsBySender[m.sender]++;
      wordsBySender[m.sender] += words;
    }
    const dKey = getMsgDate(m).toDateString();
    dayCounts[dKey] = (dayCounts[dKey] || 0) + 1;
  }

  const firstDate = validMessages[0] ? getMsgDate(validMessages[0]) : null;
  const lastDate = validMessages[validMessages.length - 1] ? getMsgDate(validMessages[validMessages.length - 1]) : null;
  const daySpan = firstDate && lastDate
    ? Math.max(1, Math.round((new Date(lastDate) - new Date(firstDate)) / (1000 * 60 * 60 * 24)))
    : 1;

  const avgMessagesPerDay = totalMessages > 0 ? +(totalMessages / daySpan).toFixed(1) : 0;

  const busiestDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const busiestDay = busiestDayEntry
    ? {
        date: new Date(busiestDayEntry[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        count: busiestDayEntry[1],
      }
    : null;

  const longestDailyStreak = getLongestStreak(validMessages);

  return {
    totalMessages,
    totalWords,
    daySpan,
    avgMessagesPerDay,
    busiestDay,
    longestDailyStreak,
    senders: [p1, p2],
    p1: { name: p1, messages: msgsBySender[p1], words: wordsBySender[p1] },
    p2: { name: p2, messages: msgsBySender[p2], words: wordsBySender[p2] },
  };
}

// 3. Love Word Tracker
export const LOVE_WORDS = ["love", "miss you", "miss u", "pyaar", "jaan", "baby", "babe", "cutie", "❤️", "😘", "darling", "shona", "bae", "miss uh",
  "sweetheart", "ily", "bubu", "babe", "dudu", "cutie", "jaanu"
];

export function getLoveWordStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const wordCounts = {};
  LOVE_WORDS.forEach((w) => {
    wordCounts[w] = { [p1]: 0, [p2]: 0, total: 0 };
  });

  const totals = { [p1]: 0, [p2]: 0, overall: 0 };
  const monthlyCounts = {};
  const validMessages = messages || [];

  for (let i = 0; i < validMessages.length; i++) {
    const m = validMessages[i];
    const textLower = (m.text || '').toLowerCase();
    let matchedAnyInMsg = false;

    for (let j = 0; j < LOVE_WORDS.length; j++) {
      const lw = LOVE_WORDS[j];
      const lwLower = lw.toLowerCase();
      let pos = 0;
      let count = 0;
      while ((pos = textLower.indexOf(lwLower, pos)) !== -1) {
        count++;
        pos += lwLower.length;
      }

      if (count > 0) {
        matchedAnyInMsg = true;
        if (wordCounts[lw][m.sender] !== undefined) {
          wordCounts[lw][m.sender] += count;
        }
        wordCounts[lw].total += count;
        if (totals[m.sender] !== undefined) {
          totals[m.sender] += count;
        }
        totals.overall += count;
      }
    }

    if (matchedAnyInMsg) {
      const d = getMsgDate(m);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyCounts[mKey] = (monthlyCounts[mKey] || 0) + 1;
    }
  }

  const leaderboard = Object.entries(wordCounts)
    .map(([word, counts]) => ({
      word,
      total: counts.total,
      [p1]: counts[p1],
      [p2]: counts[p2],
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const topWord = leaderboard[0] || null;
  const loveComparison = wordCounts['love'] || { [p1]: 0, [p2]: 0, total: 0 };
  const whoSaysLoveMore = loveComparison[p1] >= loveComparison[p2] ? p1 : p2;
  const whoSaysMoreOverall = totals[p1] >= totals[p2] ? p1 : p2;

  const monthlyTrend = Object.entries(monthlyCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return {
        key,
        label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count,
      };
    });

  return {
    senders: [p1, p2],
    totals,
    leaderboard,
    topWord,
    whoSaysLoveMore,
    whoSaysMoreOverall,
    loveComparison,
    monthlyTrend,
  };
}

// 4. Random Memory Picker
export function getRandomMemory(messages) {
  const validMessages = messages || [];
  if (validMessages.length === 0) return null;

  const candidates = [];
  for (let i = 0; i < validMessages.length; i++) {
    const m = validMessages[i];
    const t = (m.text || '').trim();
    const isMedia = m.type === 'media' || m.type === 'sticker' || t.includes('<Media omitted>') || t.includes('omitted>');
    if (t.length > 5 && !isMedia) {
      candidates.push(i);
    }
  }

  if (candidates.length === 0) return null;

  const randIdx = candidates[Math.floor(Math.random() * candidates.length)];
  const primaryMsg = validMessages[randIdx];
  const primaryDate = getMsgDate(primaryMsg);

  const windowMsgs = [primaryMsg];
  if (randIdx > 0) {
    const prev = validMessages[randIdx - 1];
    const prevDate = getMsgDate(prev);
    const prevIsMedia = prev.type === 'media' || prev.type === 'sticker' || (prev.text && prev.text.includes('omitted>'));
    if (!prevIsMedia && Math.abs(primaryDate.getTime() - prevDate.getTime()) < 15 * 60 * 1000) {
      windowMsgs.unshift(prev);
    }
  }
  if (randIdx < validMessages.length - 1 && windowMsgs.length < 3) {
    const next = validMessages[randIdx + 1];
    const nextDate = getMsgDate(next);
    const nextIsMedia = next.type === 'media' || next.type === 'sticker' || (next.text && next.text.includes('omitted>'));
    if (!nextIsMedia && Math.abs(nextDate.getTime() - primaryDate.getTime()) < 15 * 60 * 1000) {
      windowMsgs.push(next);
    }
  }

  return {
    id: `${randIdx}-${Date.now()}-${Math.random()}`,
    date: primaryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: primaryDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    messages: windowMsgs,
    primarySender: primaryMsg.sender,
  };
}

// 5. Call-out Streak
export const MORNING_PHRASES = ["good morning", "gm", "morning!"];
export const NIGHT_PHRASES = ["good night", "gn", "night night", "nite"];

function matchesAnyPhrase(text, phrases) {
  const lower = (text || '').toLowerCase();
  for (let i = 0; i < phrases.length; i++) {
    if (lower.includes(phrases[i])) return true;
  }
  return false;
}

export function getCalloutStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const morningCounts = { [p1]: 0, [p2]: 0, total: 0 };
  const nightCounts = { [p1]: 0, [p2]: 0, total: 0 };
  const validMessages = messages || [];

  for (let i = 0; i < validMessages.length; i++) {
    const m = validMessages[i];
    if (matchesAnyPhrase(m.text, MORNING_PHRASES)) {
      if (morningCounts[m.sender] !== undefined) morningCounts[m.sender]++;
      morningCounts.total++;
    }
    if (matchesAnyPhrase(m.text, NIGHT_PHRASES)) {
      if (nightCounts[m.sender] !== undefined) nightCounts[m.sender]++;
      nightCounts.total++;
    }
  }

  const morningLeader = morningCounts[p1] >= morningCounts[p2] ? p1 : p2;
  const nightLeader = nightCounts[p1] >= nightCounts[p2] ? p1 : p2;

  const longestMorningStreak = getLongestStreak(validMessages, (m) => matchesAnyPhrase(m.text, MORNING_PHRASES));
  const longestNightStreak = getLongestStreak(validMessages, (m) => matchesAnyPhrase(m.text, NIGHT_PHRASES));

  return {
    senders: [p1, p2],
    morning: {
      counts: morningCounts,
      leader: morningLeader,
      longestStreak: longestMorningStreak,
    },
    night: {
      counts: nightCounts,
      leader: nightLeader,
      longestStreak: longestNightStreak,
    },
  };
}

// ---------------------------------------------------------------------------
// INSTAGRAM REEL & MEDIA BREAKDOWN STATS
// ---------------------------------------------------------------------------

/**
 * Calculates Reel statistics:
 * 1. Reel count per person and comparison
 * 2. Ping-pong streak: longest alternating streak between Aru & Avu
 * 3. Most active reel month and day
 *
 * @param {ChatMessage[]} messages
 * @param {string[]} senders
 */
export function getReelStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const validMessages = messages || [];
  const reelMessages = validMessages.filter((m) => m.type === 'reel_share');

  // 1. Reel count per person
  let count1 = 0;
  let count2 = 0;
  const monthlyCounts = {};
  const dailyCounts = {};

  reelMessages.forEach((m) => {
    if (m.sender === p1) count1++;
    else if (m.sender === p2) count2++;

    const d = getMsgDate(m);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dKey = d.toDateString();

    monthlyCounts[mKey] = (monthlyCounts[mKey] || 0) + 1;
    dailyCounts[dKey] = (dailyCounts[dKey] || 0) + 1;
  });

  const totalReels = count1 + count2;
  const p1Pct = totalReels > 0 ? Math.round((count1 / totalReels) * 100) : 0;
  const p2Pct = totalReels > 0 ? 100 - p1Pct : 0;
  const leader = count1 >= count2 ? p1 : p2;

  // 2. Reel ping-pong streak:
  // Longest run of reels sent back-and-forth alternately (Aru -> Avu -> Aru -> Avu...)
  // with no reel from the same person twice in a row breaking the streak.
  let maxStreak = 0;
  let maxStartDate = null;
  let maxEndDate = null;

  if (reelMessages.length === 1) {
    maxStreak = 1;
    maxStartDate = getMsgDate(reelMessages[0]);
    maxEndDate = getMsgDate(reelMessages[0]);
  } else if (reelMessages.length > 1) {
    let currentStreak = 1;
    let currentStart = reelMessages[0];
    maxStreak = 1;
    maxStartDate = getMsgDate(reelMessages[0]);
    maxEndDate = getMsgDate(reelMessages[0]);

    for (let i = 1; i < reelMessages.length; i++) {
      const prevMsg = reelMessages[i - 1];
      const currMsg = reelMessages[i];

      if (currMsg.sender !== prevMsg.sender) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          maxStartDate = getMsgDate(currentStart);
          maxEndDate = getMsgDate(currMsg);
        }
      } else {
        currentStreak = 1;
        currentStart = currMsg;
      }
    }
  }

  // 3. Most active reel period
  const busiestMonthEntry = Object.entries(monthlyCounts).sort((a, b) => b[1] - a[1])[0];
  const busiestDayEntry = Object.entries(dailyCounts).sort((a, b) => b[1] - a[1])[0];

  const busiestMonth = busiestMonthEntry
    ? (() => {
        const [year, month] = busiestMonthEntry[0].split('-').map(Number);
        return {
          label: `${MONTH_NAMES[month - 1]} ${year}`,
          count: busiestMonthEntry[1],
        };
      })()
    : null;

  const busiestDay = busiestDayEntry
    ? {
        label: new Date(busiestDayEntry[0]).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        count: busiestDayEntry[1],
      }
    : null;

  const monthlyTrend = Object.entries(monthlyCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return {
        key,
        label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count,
      };
    });

  return {
    senders: [p1, p2],
    totalReels,
    p1: { name: p1, count: count1, pct: p1Pct },
    p2: { name: p2, count: count2, pct: p2Pct },
    leader,
    streak: {
      length: maxStreak,
      startDate: maxStartDate,
      endDate: maxEndDate,
      formattedStartDate: maxStartDate
        ? maxStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null,
      formattedEndDate: maxEndDate
        ? maxEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null,
    },
    busiestMonth,
    busiestDay,
    monthlyTrend,
  };
}

/**
 * Calculates Instagram Media Breakdown:
 * Categories:
 * - 'photo': individual photos (counts batch items, skips broken references)
 * - 'video': individual videos (counts batch items, skips broken references)
 * - 'reel_share': reel shares
 * - 'story_reply': story replies (tracked separately; EXCLUDED from totalMediaShared)
 *
 * Decision: Story replies are reactions to external content, not media exchanged directly.
 * Therefore totalMediaShared = photos + videos + reel_share.
 *
 * @param {ChatMessage[]} messages
 * @param {string[]} senders
 */
export function getMediaBreakdownStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const validMessages = messages || [];

  const initPerson = (name) => ({
    name,
    photos: 0,
    videos: 0,
    reels: 0,
    storyReplies: 0,
    totalMediaShared: 0,
  });

  const bySender = {
    [p1]: initPerson(p1),
    [p2]: initPerson(p2),
  };

  for (const m of validMessages) {
    const s = bySender[m.sender];
    if (!s) continue;

    if (m.type === 'reel_share') {
      s.reels++;
      s.totalMediaShared++;
    } else if (m.type === 'photo') {
      // Count individual photos in batch, skipping missing/broken URIs
      const count = Array.isArray(m.meta?.photos)
        ? m.meta.photos.filter((p) => p && typeof p.uri === 'string' && p.uri.trim() !== '').length || 1
        : 1;
      s.photos += count;
      s.totalMediaShared += count;
    } else if (m.type === 'video') {
      // Count individual videos in batch, skipping missing/broken URIs
      const count = Array.isArray(m.meta?.videos)
        ? m.meta.videos.filter((v) => v && typeof v.uri === 'string' && v.uri.trim() !== '').length || 1
        : 1;
      s.videos += count;
      s.totalMediaShared += count;
    } else if (m.type === 'story_reply') {
      // Explicitly tracked separately, NOT added to totalMediaShared
      s.storyReplies++;
    }
  }

  const totals = {
    photos: bySender[p1].photos + bySender[p2].photos,
    videos: bySender[p1].videos + bySender[p2].videos,
    reels: bySender[p1].reels + bySender[p2].reels,
    storyReplies: bySender[p1].storyReplies + bySender[p2].storyReplies,
    totalMediaShared: bySender[p1].totalMediaShared + bySender[p2].totalMediaShared,
  };

  const leader = bySender[p1].totalMediaShared >= bySender[p2].totalMediaShared ? p1 : p2;

  return {
    senders: [p1, p2],
    [p1]: bySender[p1],
    [p2]: bySender[p2],
    totals,
    leader,
  };
}

/**
 * Calculates Instagram Reaction statistics:
 * 1. Total reactions sent per person
 * 2. Most-used reaction emoji per person (sent to the other person) + comparison rows
 * 3. Reaction rate: percentage of person X's messages that received a reaction from person Y
 *    (Formula: (messages sent by X receiving >= 1 reaction from Y) / (total messages sent by X))
 *    Strictly excludes self-reactions and deduplicates multiple reactions on the same message per actor.
 * 4. Fastest reaction time (conditional):
 *    If reaction timestamps are present in export, compute fastest and average reaction latency.
 *    If absent, set hasReactionTimestamps: false and note that Instagram exports omit reaction timestamps.
 *
 * @param {ChatMessage[]} messages
 * @param {string[]} senders
 */
export function getReactionStats(messages, senders) {
  const [p1 = 'unknown', p2 = 'unknown'] = senders && senders.length === 2 ? senders : ['unknown', 'unknown'];
  const validMessages = messages || [];

  let reactionsSent1 = 0;
  let reactionsSent2 = 0;

  // Track emoji frequencies when reacting to the OTHER person
  // bySenderToOther[p1][emoji] = count of times p1 reacted with emoji to p2's messages
  const bySenderToOther = { [p1]: {}, [p2]: {} };
  const totalByEmoji = {};

  // For reaction rate:
  // totalSent[person] = total messages sent by that person
  // receivedReactionFromOther[person] = count of messages sent by that person that received >= 1 reaction from the other
  let totalSent1 = 0;
  let totalSent2 = 0;
  let reactedSent1 = 0;
  let reactedSent2 = 0;

  // For reaction latency (conditional):
  let latencyCount1 = 0;
  let latencySumMs1 = 0;
  let fastestMs1 = Infinity;

  let latencyCount2 = 0;
  let latencySumMs2 = 0;
  let fastestMs2 = Infinity;

  let anyReactionHasTimestamp = false;

  for (const m of validMessages) {
    if (m.sender === p1) totalSent1++;
    else if (m.sender === p2) totalSent2++;

    const rawReactions = m.reactions || m.meta?.reactions || [];
    if (!rawReactions || rawReactions.length === 0) continue;

    // Deduplicate reactions per actor on this message (keep latest one per person per message)
    const latestByActor = new Map();
    for (const r of rawReactions) {
      const actor = r.actor || r.sender;
      if (!actor) continue;
      latestByActor.set(actor, r);
    }

    const dedupedReactions = Array.from(latestByActor.values());

    let p1ReactedToThisMsg = false;
    let p2ReactedToThisMsg = false;

    for (const r of dedupedReactions) {
      const actor = r.actor || r.sender;
      const emoji = r.emoji || r.reaction;
      if (!emoji) continue;

      if (actor === p1) reactionsSent1++;
      else if (actor === p2) reactionsSent2++;

      // When actor reacts to the OTHER person's message:
      if (m.sender !== actor) {
        if (actor === p1 && m.sender === p2) {
          bySenderToOther[p1][emoji] = (bySenderToOther[p1][emoji] || 0) + 1;
          totalByEmoji[emoji] = (totalByEmoji[emoji] || 0) + 1;
          p1ReactedToThisMsg = true;

          // Latency check
          if (r.timestamp instanceof Date && m.timestamp instanceof Date) {
            anyReactionHasTimestamp = true;
            const diffMs = r.timestamp.getTime() - m.timestamp.getTime();
            if (diffMs >= 0 && diffMs < 14 * 24 * 60 * 60 * 1000) {
              latencySumMs1 += diffMs;
              latencyCount1++;
              if (diffMs < fastestMs1) fastestMs1 = diffMs;
            }
          }
        } else if (actor === p2 && m.sender === p1) {
          bySenderToOther[p2][emoji] = (bySenderToOther[p2][emoji] || 0) + 1;
          totalByEmoji[emoji] = (totalByEmoji[emoji] || 0) + 1;
          p2ReactedToThisMsg = true;

          // Latency check
          if (r.timestamp instanceof Date && m.timestamp instanceof Date) {
            anyReactionHasTimestamp = true;
            const diffMs = r.timestamp.getTime() - m.timestamp.getTime();
            if (diffMs >= 0 && diffMs < 14 * 24 * 60 * 60 * 1000) {
              latencySumMs2 += diffMs;
              latencyCount2++;
              if (diffMs < fastestMs2) fastestMs2 = diffMs;
            }
          }
        }
      }
    }

    // Reaction rate engagement tracking (strictly excluding self-reactions):
    if (m.sender === p1 && p2ReactedToThisMsg) {
      reactedSent1++;
    }
    if (m.sender === p2 && p1ReactedToThisMsg) {
      reactedSent2++;
    }
  }

  const totalReactionsSent = reactionsSent1 + reactionsSent2;
  const p1SentPct = totalReactionsSent > 0 ? Math.round((reactionsSent1 / totalReactionsSent) * 100) : 0;
  const p2SentPct = totalReactionsSent > 0 ? 100 - p1SentPct : 0;
  const reactionsSentLeader = reactionsSent1 >= reactionsSent2 ? p1 : p2;

  // Reaction rates:
  const p1ReactionRate = totalSent1 > 0 ? +((reactedSent1 / totalSent1) * 100).toFixed(1) : 0;
  const p2ReactionRate = totalSent2 > 0 ? +((reactedSent2 / totalSent2) * 100).toFixed(1) : 0;
  const reactionRateLeader = p1ReactionRate >= p2ReactionRate ? p1 : p2;

  // Most used reaction emoji per person
  const sortedP1Emojis = Object.entries(bySenderToOther[p1]).sort((a, b) => b[1] - a[1]);
  const sortedP2Emojis = Object.entries(bySenderToOther[p2]).sort((a, b) => b[1] - a[1]);

  const p1TopEmoji = sortedP1Emojis[0] ? { emoji: sortedP1Emojis[0][0], count: sortedP1Emojis[0][1] } : null;
  const p2TopEmoji = sortedP2Emojis[0] ? { emoji: sortedP2Emojis[0][0], count: sortedP2Emojis[0][1] } : null;

  // Emoji comparison rows for visualization matching EmojiStats.jsx
  const topReactionEmojis = Object.entries(totalByEmoji)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([e]) => e);

  const comparisonRows = topReactionEmojis.map((e) => ({
    emoji: e,
    left: bySenderToOther[p1]?.[e] || 0,
    right: bySenderToOther[p2]?.[e] || 0,
  }));

  const maxVal = Math.max(...comparisonRows.map((r) => Math.max(r.left, r.right)), 1);

  // Reaction times (conditional)
  const p1AvgLatency = latencyCount1 > 0 ? Math.round(latencySumMs1 / latencyCount1) : null;
  const p2AvgLatency = latencyCount2 > 0 ? Math.round(latencySumMs2 / latencyCount2) : null;
  const p1Fastest = fastestMs1 !== Infinity ? fastestMs1 : null;
  const p2Fastest = fastestMs2 !== Infinity ? fastestMs2 : null;

  return {
    senders: [p1, p2],
    totalReactionsSent,
    reactionsSent: {
      [p1]: { count: reactionsSent1, pct: p1SentPct },
      [p2]: { count: reactionsSent2, pct: p2SentPct },
      leader: reactionsSentLeader,
    },
    reactionRates: {
      [p1]: {
        rate: p1ReactionRate,
        messagesReacted: reactedSent1,
        totalMessages: totalSent1,
      },
      [p2]: {
        rate: p2ReactionRate,
        messagesReacted: reactedSent2,
        totalMessages: totalSent2,
      },
      leader: reactionRateLeader,
    },
    topEmoji: {
      [p1]: p1TopEmoji,
      [p2]: p2TopEmoji,
    },
    comparison: {
      order: [p1, p2],
      rows: comparisonRows,
      maxVal,
    },
    timing: {
      hasReactionTimestamps: anyReactionHasTimestamp,
      [p1]: {
        avgMs: p1AvgLatency,
        formattedAvg: p1AvgLatency != null ? formatResponseTime(p1AvgLatency) : null,
        fastestMs: p1Fastest,
        formattedFastest: p1Fastest != null ? formatResponseTime(p1Fastest) : null,
      },
      [p2]: {
        avgMs: p2AvgLatency,
        formattedAvg: p2AvgLatency != null ? formatResponseTime(p2AvgLatency) : null,
        fastestMs: p2Fastest,
        formattedFastest: p2Fastest != null ? formatResponseTime(p2Fastest) : null,
      },
    },
  };
}

/**
 * Cross-Platform Unification Statistics (Phase 4)
 * Combines messages from multiple platforms (WhatsApp, Telegram, Instagram)
 * into a single unified relationship view.
 *
 * @param {ChatMessage[]} messages - Unified chronological message array
 * @param {Record<string, { platform: string, messages: ChatMessage[], rawSenders?: string[] }>} [loadedPlatforms]
 * @returns {Object}
 */
export function getCrossPlatformStats(messages, loadedPlatforms = {}) {
  const validMessages = messages || [];

  const platformCounts = {
    whatsapp: 0,
    telegram: 0,
    instagram: 0,
  };

  const platformDates = {
    whatsapp: { first: null, last: null },
    telegram: { first: null, last: null },
    instagram: { first: null, last: null },
  };

  for (const m of validMessages) {
    const p = m.platform || 'whatsapp';
    if (platformCounts[p] == null) {
      platformCounts[p] = 0;
      platformDates[p] = { first: null, last: null };
    }
    platformCounts[p]++;

    const d = getMsgDate(m);
    if (!platformDates[p].first || d < platformDates[p].first) {
      platformDates[p].first = d;
    }
    if (!platformDates[p].last || d > platformDates[p].last) {
      platformDates[p].last = d;
    }
  }

  if (loadedPlatforms && typeof loadedPlatforms === 'object') {
    for (const key of Object.keys(loadedPlatforms)) {
      if (platformCounts[key] == null) {
        platformCounts[key] = 0;
        platformDates[key] = { first: null, last: null };
      }
    }
  }

  const activePlatforms = Object.keys(platformCounts).filter((p) => platformCounts[p] > 0);
  const isMultiPlatform = activePlatforms.length > 1;
  const totalMessages = validMessages.length;

  const platformBreakdown = activePlatforms
    .map((p) => {
      const count = platformCounts[p];
      const pct = totalMessages > 0 ? Math.round((count / totalMessages) * 1000) / 10 : 0;
      const dates = platformDates[p] || {};
      return {
        platform: p,
        name: p === 'whatsapp' ? 'WhatsApp' : p === 'telegram' ? 'Telegram' : p === 'instagram' ? 'Instagram' : p,
        count,
        pct,
        firstDate: dates.first,
        lastDate: dates.last,
        color: p === 'whatsapp' ? '#25D366' : p === 'telegram' ? '#2AABEE' : '#8A2BE2',
      };
    })
    .sort((a, b) => b.count - a.count);

  // 1. Absolute first message ever across all loaded platforms
  let earliestMsg = null;
  let earliestTime = Infinity;

  for (const m of validMessages) {
    const t = getMsgDate(m).getTime();
    if (t < earliestTime) {
      earliestTime = t;
      earliestMsg = m;
    }
  }

  let firstMessage = null;
  if (earliestMsg) {
    const d = getMsgDate(earliestMsg);
    firstMessage = {
      id: earliestMsg.id,
      sender: earliestMsg.sender,
      platform: earliestMsg.platform || 'whatsapp',
      platformName:
        earliestMsg.platform === 'instagram'
          ? 'Instagram'
          : earliestMsg.platform === 'telegram'
          ? 'Telegram'
          : 'WhatsApp',
      text: earliestMsg.text || '',
      timestamp: d,
      formattedDate: d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      formattedTime: d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  }

  // 2. Busiest single day combined across all platforms
  const dayMap = {};
  for (const m of validMessages) {
    const d = getMsgDate(m);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!dayMap[key]) {
      dayMap[key] = {
        dateKey: key,
        date: d,
        total: 0,
        whatsapp: 0,
        telegram: 0,
        instagram: 0,
      };
    }
    const p = m.platform || 'whatsapp';
    dayMap[key].total++;
    if (dayMap[key][p] != null) {
      dayMap[key][p]++;
    } else {
      dayMap[key][p] = 1;
    }
  }

  let maxDayTotal = 0;
  let busiestDayObj = null;
  for (const key of Object.keys(dayMap)) {
    if (dayMap[key].total > maxDayTotal) {
      maxDayTotal = dayMap[key].total;
      busiestDayObj = dayMap[key];
    }
  }

  let busiestDay = null;
  if (busiestDayObj) {
    const bTotal = busiestDayObj.total;
    busiestDay = {
      dateKey: busiestDayObj.dateKey,
      total: bTotal,
      formattedDate: busiestDayObj.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      weekday: busiestDayObj.date.toLocaleDateString('en-US', { weekday: 'long' }),
      breakdown: {
        whatsapp: busiestDayObj.whatsapp || 0,
        telegram: busiestDayObj.telegram || 0,
        instagram: busiestDayObj.instagram || 0,
      },
      shares: {
        whatsapp: bTotal > 0 ? Math.round(((busiestDayObj.whatsapp || 0) / bTotal) * 100) : 0,
        telegram: bTotal > 0 ? Math.round(((busiestDayObj.telegram || 0) / bTotal) * 100) : 0,
        instagram: bTotal > 0 ? Math.round(((busiestDayObj.instagram || 0) / bTotal) * 100) : 0,
      },
    };
  }

  // 3. Platform migration chart (monthly bins)
  const monthMap = {};
  for (const m of validMessages) {
    const d = getMsgDate(m);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) {
      monthMap[key] = {
        monthKey: key,
        date: new Date(d.getFullYear(), d.getMonth(), 1),
        total: 0,
        whatsapp: 0,
        telegram: 0,
        instagram: 0,
      };
    }
    const p = m.platform || 'whatsapp';
    monthMap[key].total++;
    if (monthMap[key][p] != null) {
      monthMap[key][p]++;
    } else {
      monthMap[key][p] = 1;
    }
  }

  const sortedMonthKeys = Object.keys(monthMap).sort();
  const migrationTimeline = sortedMonthKeys.map((key) => {
    const item = monthMap[key];
    const total = item.total;
    return {
      monthKey: key,
      label: item.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      fullLabel: item.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      total,
      whatsapp: item.whatsapp || 0,
      telegram: item.telegram || 0,
      instagram: item.instagram || 0,
      shares: {
        whatsapp: total > 0 ? Math.round(((item.whatsapp || 0) / total) * 100) : 0,
        telegram: total > 0 ? Math.round(((item.telegram || 0) / total) * 100) : 0,
        instagram: total > 0 ? Math.round(((item.instagram || 0) / total) * 100) : 0,
      },
      dominantPlatform:
        (item.whatsapp || 0) >= (item.telegram || 0) && (item.whatsapp || 0) >= (item.instagram || 0)
          ? 'whatsapp'
          : (item.telegram || 0) >= (item.instagram || 0)
          ? 'telegram'
          : 'instagram',
    };
  });

  const maxMonthTotal = Math.max(...migrationTimeline.map((m) => m.total), 1);

  let migrationNarrative = '';
  if (migrationTimeline.length > 0) {
    if (!isMultiPlatform) {
      const p = activePlatforms[0] || 'whatsapp';
      const name = p === 'whatsapp' ? 'WhatsApp' : p === 'telegram' ? 'Telegram' : 'Instagram';
      migrationNarrative = `Currently showing your entire conversation history on ${name}.`;
    } else {
      const firstMonth = migrationTimeline[0];
      const lastMonth = migrationTimeline[migrationTimeline.length - 1];
      const pName = (p) => (p === 'whatsapp' ? 'WhatsApp' : p === 'telegram' ? 'Telegram' : 'Instagram');
      if (firstMonth.dominantPlatform === lastMonth.dominantPlatform) {
        migrationNarrative = `Your primary home has been ${pName(firstMonth.dominantPlatform)}, with rich conversations spanning across platforms.`;
      } else {
        migrationNarrative = `Your conversation journey started on ${pName(firstMonth.dominantPlatform)} in ${firstMonth.label}, and steadily expanded onto ${pName(lastMonth.dominantPlatform)}.`;
      }
    }
  }

  return {
    isMultiPlatform,
    activePlatforms,
    totalMessages,
    platformBreakdown,
    firstMessage,
    busiestDay,
    migrationTimeline,
    maxMonthTotal,
    migrationNarrative,
  };
}