let messagesData = [];

self.onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    // Pre-cache messages with lowercase text and precalculated timestamp/hour, ignoring system messages
    messagesData = (payload || [])
      .filter((m) => m && m.type !== 'system')
      .map((m) => {
        const rawDate = m.timestamp || m.date;
        const ts =
          typeof rawDate === 'string' || typeof rawDate === 'number'
            ? new Date(rawDate).getTime()
            : rawDate instanceof Date
            ? rawDate.getTime()
            : 0;
        const hour = new Date(ts).getHours();
        return {
          textLower: (m.text || '').toLowerCase(),
          ts,
          hour,
          sender: m.sender,
        };
      });
    self.postMessage({ type: 'INIT_DONE' });
  } else if (type === 'SEARCH') {
    const { searchId, keyword } = payload;
    const kw = (keyword || '').trim().toLowerCase();

    if (!kw) {
      self.postMessage({
        type: 'SEARCH_RESULT',
        searchId,
        result: null,
      });
      return;
    }

    const hourCounts = new Array(24).fill(0);
    const hitTimestamps = [];
    let count = 0;

    for (let i = 0; i < messagesData.length; i++) {
      const item = messagesData[i];
      if (item.textLower.includes(kw)) {
        count++;
        hourCounts[item.hour]++;
        hitTimestamps.push(item.ts);
      }
    }

    let topHour = null;
    if (count > 0) {
      let maxHCount = -1;
      for (let h = 0; h < 24; h++) {
        if (hourCounts[h] > maxHCount) {
          maxHCount = hourCounts[h];
          topHour = h;
        }
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

    // Sample timeline down to max 500 points for smooth DOM rendering
    let timelineTimestamps = [];
    if (hitTimestamps.length <= 500) {
      timelineTimestamps = hitTimestamps;
    } else {
      const step = (hitTimestamps.length - 1) / 499;
      for (let i = 0; i < 500; i++) {
        timelineTimestamps.push(hitTimestamps[Math.round(i * step)]);
      }
    }

    self.postMessage({
      type: 'SEARCH_RESULT',
      searchId,
      result: {
        count,
        topHour,
        avgGapDays,
        timelineTimestamps,
      },
    });
  }
};
