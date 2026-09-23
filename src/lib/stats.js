const EMOJI_RE = /(\p{Extended_Pictographic})/gu;

export function getEmojiStats(messages) {
  const counts = {}; // { sender: { emoji: count } }
  for (const m of messages) {
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

export function getEmojiComparison(messages, topN = 8) {
  const order = ['Her', 'Him']; // fixed, so bars stay consistent side
  const bySender = { Her: {}, Him: {} };
  const total = {};

  for (const m of messages) {
    const emojis = m.text.match(EMOJI_RE) || [];
    if (!bySender[m.sender]) continue;
    for (const e of emojis) {
      bySender[m.sender][e] = (bySender[m.sender][e] || 0) + 1;
      total[e] = (total[e] || 0) + 1;
    }
  }

  const topEmojis = Object.entries(total)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([e]) => e);

  const rows = topEmojis.map((e) => ({
    emoji: e,
    left: bySender[order[0]][e] || 0,
    right: bySender[order[1]][e] || 0,
  }));

  const maxVal = Math.max(...rows.map((r) => Math.max(r.left, r.right)), 1);

  return { order, rows, maxVal };
}

export function getKeywordStats(messages, keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return null;
  const hits = messages.filter(m => m.text.toLowerCase().includes(kw));
  const count = hits.length;

  const hourCounts = Array(24).fill(0);
  hits.forEach(m => hourCounts[m.date.getHours()]++);
  const topHour = hourCounts.indexOf(Math.max(...hourCounts));

  const gaps = [];
  for (let i = 1; i < hits.length; i++) {
    gaps.push((hits[i].date - hits[i - 1].date) / (1000 * 60 * 60 * 24)); // days
  }
  const avgGapDays = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;

  const timeline = hits.map(m => ({ date: m.date, sender: m.sender }));

  return { count, topHour, avgGapDays, timeline, hits };
}

export function getHeatmapData(messages) {
  // grid[day][hour] = count, day 0=Sun..6=Sat
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  messages.forEach(m => {
    grid[m.date.getDay()][m.date.getHours()]++;
  });
  return grid;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function getHighlights(messages) {
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
    if (diff === 1) { curStreak++; longestStreak = Math.max(longestStreak, curStreak); }
    else curStreak = 1;
  }

  let longestGapDays = 0;
  for (let i = 1; i < uniqueDaysSorted.length; i++) {
    longestGapDays = Math.max(longestGapDays, (uniqueDaysSorted[i] - uniqueDaysSorted[i - 1]) / (1000 * 60 * 60 * 24));
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
  'hun','rha','meh','yeh','mei','woh','are','what','why','how','meri','teri','mera',
]);

export function getWordCloudData(messages, topN = 40) {
  const counts = {};
  messages.forEach(m => {
    const words = m.text.toLowerCase().match(/[a-z\p{sc=Devanagari}]+/gu) || [];
    words.forEach(w => {
      if (w.length < 3 || STOPWORDS.has(w)) return;
      counts[w] = (counts[w] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([text, value]) => ({ text, value }));
}

export function getMediaStats(messages) {
  let her = 0;
  let him = 0;
  messages.forEach(m => {
    if (m.text.includes('<Media omitted>')) {
      if (m.sender === 'Her') her++;
      else if (m.sender === 'Him') him++;
    }
  });
  const total = her + him;
  return { her, him, total };
}

export function getOverviewStats(messages) {
  const totalMessages = messages.length;
  const totalWords = messages.reduce((sum, m) => sum + m.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const uniqueDays = new Set(messages.map(m => m.date.toDateString())).size;
  const mediaStats = getMediaStats(messages);
  const firstDate = messages[0]?.date;
  const lastDate = messages[messages.length - 1]?.date;
  return { totalMessages, totalWords, uniqueDays, totalMedia: mediaStats.total, firstDate, lastDate };
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

export function getInitiatorStats(messages) {
  const firstMsgByDay = {}; // { YYYY-MM-DD: sender }
  messages.forEach(m => {
    const key = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}-${String(m.date.getDate()).padStart(2, '0')}`;
    if (!firstMsgByDay[key]) {
      firstMsgByDay[key] = m.sender;
    }
  });

  let her = 0;
  let him = 0;
  Object.values(firstMsgByDay).forEach(sender => {
    if (sender === 'Her') her++;
    else if (sender === 'Him') him++;
  });

  const total = her + him;
  const herPct = total > 0 ? Math.round((her / total) * 100) : 0;
  const himPct = total > 0 ? 100 - herPct : 0;

  return { her, him, herPct, himPct };
}

export function getLongestMessage(messages) {
  if (!messages || messages.length === 0) {
    return { text: '', wordCount: 0, sender: 'Her', date: new Date() };
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
    return { text: '', wordCount: 0, sender: 'Her', date: new Date() };
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

export function getLateNightStats(messages) {
  let herTotal = 0;
  let himTotal = 0;
  let herLate = 0;
  let himLate = 0;

  messages.forEach(m => {
    const h = m.date.getHours();
    const isLate = h >= 0 && h < 4;
    if (m.sender === 'Her') {
      herTotal++;
      if (isLate) herLate++;
    } else if (m.sender === 'Him') {
      himTotal++;
      if (isLate) himLate++;
    }
  });

  const herPct = herTotal > 0 ? Math.round((herLate / herTotal) * 100) : 0;
  const himPct = himTotal > 0 ? Math.round((himLate / himTotal) * 100) : 0;

  return {
    her: { count: herLate, pct: herPct },
    him: { count: himLate, pct: himPct },
  };
}

export function getVerbosityStats(messages) {
  let herWords = 0;
  let herMsgs = 0;
  let himWords = 0;
  let himMsgs = 0;

  messages.forEach(m => {
    const words = m.text.trim().split(/\s+/).filter(Boolean).length;
    if (m.sender === 'Her') {
      herWords += words;
      herMsgs++;
    } else if (m.sender === 'Him') {
      himWords += words;
      himMsgs++;
    }
  });

  const herAvg = herMsgs > 0 ? +(herWords / herMsgs).toFixed(1) : 0;
  const himAvg = himMsgs > 0 ? +(himWords / himMsgs).toFixed(1) : 0;

  return { her: herAvg, him: himAvg };
}