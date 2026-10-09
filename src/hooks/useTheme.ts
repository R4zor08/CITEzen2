import { useState, useEffect, createContext, useContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type Theme = ResolvedTheme;

export interface ThemeContextType {
  theme: ResolvedTheme;
  themePreference: ThemePreference;
  preference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  isDark: boolean;
  systemTheme: ResolvedTheme;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialPreference(): ThemePreference {
  try {
    const savedPref = localStorage.getItem('citezen_theme_preference');
    if (savedPref === 'light' || savedPref === 'dark' || savedPref === 'system') {
      return savedPref;
    }
    const userExplicitlySet = localStorage.getItem('citezen_theme_user_set') === 'true';
    if (userExplicitlySet) {
      const stored = localStorage.getItem('citezen_theme');
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    }
    return 'light';
  } catch {
    return 'light';
  }
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themePreference: 'light',
  preference: 'light',
  setThemePreference: () => undefined,
  setPreference: () => undefined,
  toggleTheme: () => undefined,
  isDark: false,
  systemTheme: 'light'
});

export function useThemeProvider(): ThemeContextType {
  const [preference, setPreferenceState] = useState<ThemePreference>(getInitialPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Listen to system OS theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if ('addListener' in mediaQuery) {
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  const theme: ResolvedTheme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('citezen_theme', theme);
    } catch {}
  }, [theme]);

  const setPreference = (nextPref: ThemePreference) => {
    setPreferenceState(nextPref);
    try {
      localStorage.setItem('citezen_theme_preference', nextPref);
      localStorage.setItem('citezen_theme_user_set', 'true');
      const resolved = nextPref === 'system' ? getSystemTheme() : nextPref;
      localStorage.setItem('citezen_theme', resolved);
    } catch {}
  };

  const toggleTheme = () => {
    const next: ThemePreference = theme === 'dark' ? 'light' : 'dark';
    setPreference(next);
  };

  return {
    theme,
    themePreference: preference,
    preference,
    setThemePreference: setPreference,
    setPreference,
    toggleTheme,
    isDark: theme === 'dark',
    systemTheme
  };
}

export { ThemeContext };

export function useTheme() {
  return useContext(ThemeContext);
}