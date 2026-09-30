import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeType } from '@/constants/theme';

const THEME_KEY = 'djekkoi.theme';

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeType;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (saved === 'dark') setIsDark(true);
        else if (saved === 'light') setIsDark(false);
      })
      .catch(() => {});
  }, []);

  const setDark = useCallback((dark: boolean) => {
    setIsDark(dark);
    AsyncStorage.setItem(THEME_KEY, dark ? 'dark' : 'light').catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setDark(!isDark);
  }, [isDark, setDark]);

  const theme = isDark ? ThemeColors.dark : ThemeColors.light;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
};
