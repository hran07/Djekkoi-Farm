import { useAppTheme } from '@/context/ThemeContext';
import { ThemeType } from '@/constants/theme';

export function useTheme(): ThemeType {
  return useAppTheme().theme;
}
