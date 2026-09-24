const EMOJI_RE = /(\p{Extended_Pictographic})/gu;

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

export function getEmojiStats(messages) {
  const counts = {}; // { sender: { emoji: count } }
  for (const m of (messages || [])) {
    const emojis = m.text.match(EMOJI_RE) || [];
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
  const [p1 = 'Aru', p2 = 'Avu'] = senders && senders.length === 2 ? senders : ['Aru', 'Avu'];
  const order = [p1, p2];
  const bySender = { [p1]: {}, [p2]: {} };
  const total = {};

  for (const m of (messages || [])) {
    const emojis = m.text.match(EMOJI_RE) || [];
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
  if (!kw || !messages || messages.length === 0) return null;

  const hourCounts = new Array(24).fill(0);
  const hitTimestamps = [];
  let count = 0;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.text.toLowerCase().includes(kw)) {
      count++;
      const h = m.date.getHours();
      hourCounts[h]++;
      hitTimestamps.push(m.date.getTime());
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
  (messages || []).forEach(m => {
    grid[m.date.getDay()][m.date.getHours()]++;
  });
  return grid;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function getHighlights(messages) {
  if (!messages || messages.length === 0) {
    return {
      busiestDay: null,
      busiestMonth: null,
      longestStreak: 0,
      longestGapDays: 0,
    };
  }

  const dayCounts = {};
  const monthCounts = {};
  messages.forEach(m => {
    const dKey = m.date.toDateString();
    const mKey = `${m.date.getFullYear()}-${m.date.getMonth()}`;
    dayCounts[dKey] = (dayCounts[dKey] || 0) + 1;
    monthCounts[mKey] = (monthCounts[mKey] || 0) + 1;
  });

  const busiestDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const busiestMonthEntry = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];

  const uniqueDaysSorted = [...new Set(messages.map(m => m.date.toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => a - b);

  let longestStreak = 1, curStreak = 1;
  for (let i = 1; i < uniqueDaysSorted.length; i++) {
    const diff = (uniqueDaysSorted[i] - uniqueDaysSorted[i - 1]) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      curStreak++;
      longestStreak = Math.max(longestStreak, curStreak);
    } else {
      curStreak = 1;
    }
  }

  let longestGapDays = 0;
  for (let i = 1; i < uniqueDaysSorted.length; i++) {
    const diff = (uniqueDaysSorted[i] - uniqueDaysSorted[i - 1]) / (1000 * 60 * 60 * 24);
    longestGapDays = Math.max(longestGapDays, diff);
  }

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
  'voice','deleted','message','tum','tu','have','rhi','hum','ok','get','we','nahi','aur','nhi',
  'mein','don','can','tho','will','mujhe','tumhe','waha','kuch','kya','hogi','kar','liye',
  'hun','rha','meh','yeh','mei','woh','are','what','why','how','meri','teri','mera', 'https',
  'http', 'ker', 'bro', 'koi', 
]);

export function getWordCloudData(messages, topN = 40) {
  const counts = {};
  (messages || []).forEach(m => {
    const words = m.text.toLowerCase().match(/[a-z\p{sc=Devanagari}]+/gu) || [];
    words.forEach(w => {
      if (w.length < 3 || STOPWORDS.has(w)) return;
      counts[w] = (counts[w] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([text, value]) => ({ text, value }));
}

export function getMediaStats(messages, senders) {
  const [p1 = 'Aru', p2 = 'Avu'] = senders && senders.length === 2 ? senders : ['Aru', 'Avu'];
  let count1 = 0;
  let count2 = 0;
  (messages || []).forEach(m => {
    if (m.text.includes('<Media omitted>') || m.text.includes('omitted>')) {
      if (m.sender === p1) count1++;
      else if (m.sender === p2) count2++;
    }
  });
  const total = count1 + count2;
  return { [p1]: count1, [p2]: count2, count1, count2, total };
}

export function getOverviewStats(messages) {
  if (!messages || messages.length === 0) {
    return { totalMessages: 0, totalWords: 0, uniqueDays: 0, totalMedia: 0, firstDate: null, lastDate: null };
  }
  const totalMessages = messages.length;
  const totalWords = messages.reduce((sum, m) => sum + m.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const uniqueDays = new Set(messages.map(m => m.date.toDateString())).size;
  const totalMedia = messages.filter(m => m.text.includes('<Media omitted>') || m.text.includes('omitted>')).length;
  const firstDate = messages[0]?.date;
  const lastDate = messages[messages.length - 1]?.date;
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
  if (!messages || messages.length === 0) return [];
  const firstDate = messages[0].date;
  const lastDate = messages[messages.length - 1].date;

  const countsByDay = {};
  messages.forEach(m => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}-${String(m.date.getDate()).padStart(2, '0')}`;
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
  const [p1 = 'Aru', p2 = 'Avu'] = senders && senders.length === 2 ? senders : ['Aru', 'Avu'];
  const firstMsgByDay = {}; // { YYYY-MM-DD: sender }
  (messages || []).forEach(m => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}-${String(m.date.getDate()).padStart(2, '0')}`;
    if (!firstMsgByDay[key]) {
      firstMsgByDay[key] = m.sender;
    }
  });

  let count1 = 0;
  let count2 = 0;
  Object.values(firstMsgByDay).forEach(sender => {
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
  const defaultSender = senders && senders[0] ? senders[0] : 'Aru';
  if (!messages || messages.length === 0) {
    return { text: '', wordCount: 0, sender: defaultSender, date: new Date() };
  }

  let best = null;
  let maxWords = -1;

  messages.forEach(m => {
    const words = m.text.trim().split(/\s+/).filter(Boolean).length;
    if (words > maxWords) {
      maxWords = words;
      best = m;
    }
  });

  if (!best) {
    return { text: '', wordCount: 0, sender: defaultSender, date: new Date() };
  }

  const rawText = best.text.trim();
  const truncatedText = rawText.length > 200 ? rawText.slice(0, 200).trim() + '…' : rawText;

  return {
    text: truncatedText,
    wordCount: maxWords,
    sender: best.sender,
    date: best.date,
  };
}

export function getLateNightStats(messages, senders) {
  const [p1 = 'Aru', p2 = 'Avu'] = senders && senders.length === 2 ? senders : ['Aru', 'Avu'];
  let count1Total = 0;
  let count2Total = 0;
  let count1Late = 0;
  let count2Late = 0;

  (messages || []).forEach(m => {
    const h = m.date.getHours();
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
  const [p1 = 'Aru', p2 = 'Avu'] = senders && senders.length === 2 ? senders : ['Aru', 'Avu'];
  let words1 = 0;
  let msgs1 = 0;
  let words2 = 0;
  let msgs2 = 0;

  (messages || []).forEach(m => {
    const words = m.text.trim().split(/\s+/).filter(Boolean).length;
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