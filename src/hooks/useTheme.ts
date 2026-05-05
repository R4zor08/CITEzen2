import { useState, useEffect, createContext, useContext } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => undefined,
  isDark: true
});

export function useThemeProvider() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('citezen_theme');
    return stored as Theme || 'dark';
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
    localStorage.setItem('citezen_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme, isDark: theme === 'dark' };
}

export { ThemeContext };

export function useTheme() {
  return useContext(ThemeContext);
}