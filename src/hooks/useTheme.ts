import { useState, useEffect, createContext, useContext } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => undefined,
  isDark: false
});

export function useThemeProvider() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
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
  });

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

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('citezen_theme', next);
        localStorage.setItem('citezen_theme_user_set', 'true');
      } catch {}
      return next;
    });
  };

  return { theme, toggleTheme, isDark: theme === 'dark' };
}

export { ThemeContext };

export function useTheme() {
  return useContext(ThemeContext);
}