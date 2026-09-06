import { useSyncExternalStore, useEffect } from 'react';

const KEY = 'rt-theme';
const listeners = new Set<() => void>();

export type Theme = 'light' | 'dark';

export function current(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // private browsing mode fallback
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#171615' : '#f3f2f2');

  for (const fn of listeners) fn();
}

export function toggle() {
  apply(current() === 'dark' ? 'light' : 'dark');
}

/** Applied before initial render or on mount */
export function restore() {
  const saved = (() => {
    try {
      return localStorage.getItem(KEY) as Theme | null;
    } catch {
      return null;
    }
  })();
  apply(saved ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark'));
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    current,
    () => 'dark',
  );
}

export function useThemeHotkey() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyL') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
