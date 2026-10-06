import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

const THEME_KEY = 'aguc-theme';

export function getStoredThemePreference() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function subscribeSystemTheme(callback) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia?.('(prefers-color-scheme: light)');
  if (!mq) return () => {};
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSystemThemeSnapshot() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getSystemThemeServerSnapshot() {
  return 'dark';
}

function applyTheme(resolved) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'light' ? '#EEF2FA' : '#00081F');
}

/**
 * Theme preference hook: 'system' (default) | 'light' | 'dark'.
 * Follows OS changes while in 'system' mode and persists explicit choices.
 */
export function useTheme() {
  const [preference, setPreference] = useState(getStoredThemePreference);
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  const resolved = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  const setTheme = useCallback((pref) => {
    setPreference(pref);
    try {
      if (pref === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, pref);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  return { preference, resolved, setTheme, toggle };
}
