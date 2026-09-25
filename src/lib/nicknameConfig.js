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

  // Substring matching
  const s1Lower = s1.toLowerCase();
  const s2Lower = s2.toLowerCase();
  if (s1Lower.includes('her') || s2Lower.includes('him')) {
    return {
      her: s1,
      him: s2,
      mapping: { [s1]: 'Her', [s2]: 'Him' },
    };
  }
  if (s1Lower.includes('him') || s2Lower.includes('her')) {
    return {
      her: s2,
      him: s1,
      mapping: { [s2]: 'Her', [s1]: 'Him' },
    };
  }

  // Aru (Her) & Avu (Him) heuristics
  if (s1Lower.includes('aru') || s2Lower.includes('avu')) {
    return {
      her: s1,
      him: s2,
      mapping: { [s1]: 'Her', [s2]: 'Him' },
    };
  }
  if (s1Lower.includes('avu') || s2Lower.includes('aru')) {
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
