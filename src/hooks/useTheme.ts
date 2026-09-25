import { useColorScheme } from 'react-native';
import { ThemeColors, ThemeType } from '@/constants/theme';

export function useTheme(): ThemeType {
  const scheme = useColorScheme();
  return scheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
}
