const STORAGE_KEY = 'couple_nickname_config';

/**
 * Get stored nickname configuration from localStorage
 * @returns {{ mapping: Record<string, 'Her' | 'Him'> }}
 */
export function getStoredNicknameConfig() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { mapping: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mapping: {} };
    const parsed = JSON.parse(raw);
    return { mapping: parsed.mapping || {} };
  } catch {
    return { mapping: {} };
  }
}

/**
 * Save nickname configuration to localStorage
 * @param {{ mapping: Record<string, 'Her' | 'Him'> }} config
 */
export function saveStoredNicknameConfig(config) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save nickname config to localStorage', err);
  }
}

/**
 * Given two raw sender names from chat export, resolve which maps to 'Her' and 'Him'.
 * Checks stored mapping first, then heuristics, then defaults.
 *
 * @param {string[]} rawSenders
 * @param {{ mapping?: Record<string, string> }} [storedConfig]
 * @returns {{ her: string, him: string, mapping: Record<string, 'Her' | 'Him'> }}
 */
const hasWord = (s, w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`, 'i').test(s);

export function resolveSenderMapping(rawSenders = [], storedConfig = getStoredNicknameConfig()) {
  const [s1 = 'Her', s2 = 'Him'] = rawSenders;
  const storedMapping = storedConfig?.mapping || {};

  // If both senders already have valid mappings in stored config
  if (
    storedMapping[s1] &&
    storedMapping[s2] &&
    storedMapping[s1] !== storedMapping[s2] &&
    ((storedMapping[s1] === 'Her' && storedMapping[s2] === 'Him') ||
      (storedMapping[s1] === 'Him' && storedMapping[s2] === 'Her'))
  ) {
    const herSender = storedMapping[s1] === 'Her' ? s1 : s2;
    const himSender = storedMapping[s1] === 'Him' ? s1 : s2;
    return {
      her: herSender,
      him: himSender,
      mapping: { [herSender]: 'Her', [himSender]: 'Him' },
    };
  }

  // If one sender is stored, deduce the other
  if (storedMapping[s1] === 'Her') {
    return {
      her: s1,
      him: s2,
      mapping: { [s1]: 'Her', [s2]: 'Him' },
    };
  }
  if (storedMapping[s1] === 'Him') {
    return {
      her: s2,
      him: s1,
      mapping: { [s2]: 'Her', [s1]: 'Him' },
    };
  }
  if (storedMapping[s2] === 'Her') {
    return {
      her: s2,
      him: s1,
      mapping: { [s2]: 'Her', [s1]: 'Him' },
    };
  }
  if (storedMapping[s2] === 'Him') {
    return {
      her: s1,
      him: s2,
      mapping: { [s1]: 'Her', [s2]: 'Him' },
    };
  }

  // Exact name matching
  if (s1.toLowerCase() === 'her' || s2.toLowerCase() === 'him') {
    return {
      her: s1,
      him: s2,
      mapping: { [s1]: 'Her', [s2]: 'Him' },
    };
  }
  if (s1.toLowerCase() === 'him' || s2.toLowerCase() === 'her') {
    return {
      her: s2,
      him: s1,
      mapping: { [s2]: 'Her', [s1]: 'Him' },
    };
  }

  // Whole-word matching (no Heather/Himanshu/Karuna false hits)
  if (hasWord(s1, 'her') || hasWord(s2, 'him')) {
    return {
      her: s1,
      him: s2,
      mapping: { [s1]: 'Her', [s2]: 'Him' },
    };
  }
  if (hasWord(s1, 'him') || hasWord(s2, 'her')) {
    return {
      her: s2,
      him: s1,
      mapping: { [s2]: 'Her', [s1]: 'Him' },
    };
  }

  // Aru (Her) & Avu (Him) heuristics
  if (hasWord(s1, 'aru') || hasWord(s2, 'avu')) {
    return {
      her: s1,
      him: s2,
      mapping: { [s1]: 'Her', [s2]: 'Him' },
    };
  }
  if (hasWord(s1, 'avu') || hasWord(s2, 'aru')) {
    return {
      her: s2,
      him: s1,
      mapping: { [s2]: 'Her', [s1]: 'Him' },
    };
  }

  // Default: first sender is Her, second is Him
  return {
    her: s1,
    him: s2,
    mapping: { [s1]: 'Her', [s2]: 'Him' },
  };
}

/**
 * Build raw-name -> 'Her'/'Him' mappings for EVERY loaded platform after the
 * Settings modal saves. Settings only knows the primary platform's raw names,
 * so other platforms (different handles) follow the same swap decision.
 *
 * @param {Record<string, { rawSenders?: string[], messages?: any[] }>} loadedPlatforms
 * @param {{ her: string, him: string, prevHer?: string }} choice
 * @returns {{ perPlatform: Record<string, Record<string, string>>, combined: Record<string, string> }}
 */
export function buildSettingsMappings(loadedPlatforms = {}, { her, him, prevHer } = {}) {
  const swapped = Boolean(prevHer) && prevHer !== her;
  const perPlatform = {};
  const combined = {};

  for (const [key, entry] of Object.entries(loadedPlatforms || {})) {
    const raws = entry?.rawSenders || [];
    let map = {};

    if (her && him && her !== him && raws.includes(her) && raws.includes(him)) {
      map = { [her]: 'Her', [him]: 'Him' };
    } else {
      const labels = {};
      for (const m of entry?.messages || []) {
        const raw = m._rawSender || m.sender;
        if (raws.includes(raw) && labels[raw] === undefined && (m.sender === 'Her' || m.sender === 'Him')) {
          labels[raw] = m.sender;
          if (Object.keys(labels).length === raws.length) break;
        }
      }
      for (const raw of raws) {
        const cur = labels[raw];
        if (!cur) continue;
        map[raw] = swapped ? (cur === 'Her' ? 'Him' : 'Her') : cur;
      }
    }

    perPlatform[key] = map;
    Object.assign(combined, map);
  }

  if (her && him && her !== him) {
    combined[her] = 'Her';
    combined[him] = 'Him';
  }
  return { perPlatform, combined };
}
