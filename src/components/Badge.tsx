import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';

export type BadgeType = 'ok' | 'warn' | 'bad' | 'acc' | 'default';

interface BadgeProps {
  label: string;
  type?: BadgeType;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'default', style }) => {
  const theme = useTheme();

  const getBadgeColors = () => {
    switch (type) {
      case 'ok':
        return { bg: theme.okSoft, text: theme.ok };
      case 'warn':
        return { bg: theme.goldSoft, text: theme.gold };
      case 'bad':
        return { bg: theme.badSoft, text: theme.bad };
      case 'acc':
        return { bg: theme.accentSoft, text: theme.accent };
      default:
        return { bg: theme.surface2, text: theme.ink };
    }
  };

  const { bg, text } = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FontNames.sansBold,
    fontSize: 12,
  },
});
