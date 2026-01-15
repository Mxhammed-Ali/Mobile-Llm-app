import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as _useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

type ColorScheme = 'light' | 'dark';

const THEME_KEY = 'user_theme_preference';
const SYSTEM_KEY = 'user_theme_system';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isSystemTheme: boolean;
  setSystemTheme: (useSystem: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  setColorScheme: () => {},
  isSystemTheme: true,
  setSystemTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = _useColorScheme();
  const [userTheme, setUserTheme] = useState<ColorScheme | 'system'>('system');
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      const savedSys = await AsyncStorage.getItem(SYSTEM_KEY);
      if (saved && saved !== 'system') {
        setUserTheme(saved as ColorScheme);
        setIsSystemTheme(false);
      } else if (savedSys === 'false') {
        setIsSystemTheme(false);
      }
    })();
  }, []);

  const setColorScheme = (scheme: ColorScheme) => {
    setUserTheme(scheme);
    setIsSystemTheme(false);
    AsyncStorage.setItem(THEME_KEY, scheme);
    AsyncStorage.setItem(SYSTEM_KEY, 'false');
  };

  const setSystemTheme = (useSystem: boolean) => {
    setIsSystemTheme(useSystem);
    if (useSystem) {
      setUserTheme('system');
      AsyncStorage.setItem(SYSTEM_KEY, 'true');
      AsyncStorage.setItem(THEME_KEY, 'system');
    } else {
      AsyncStorage.setItem(SYSTEM_KEY, 'false');
    }
  };

  const scheme: ColorScheme = isSystemTheme
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : (userTheme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : userTheme as ColorScheme);

  return (
    <ThemeContext.Provider value={{ colorScheme: scheme, setColorScheme, isSystemTheme, setSystemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);