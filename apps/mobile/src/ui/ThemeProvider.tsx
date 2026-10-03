import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { themes, type Theme } from './theme';
type Preference = 'system' | 'light' | 'dark';
type ThemeContextValue = {
  theme: Theme;
  scheme: 'light' | 'dark';
  preference: Preference;
  setPreference: (value: Preference) => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<Preference>('system');
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(
    () => ({ theme: themes[scheme], scheme, preference, setPreference }),
    [scheme, preference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme requires ThemeProvider');
  return value;
}
export function useThemedStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(
  factory: (theme: Theme) => T,
) {
  const { theme } = useTheme();
  return { theme, styles: useMemo(() => factory(theme), [theme, factory]) };
}
