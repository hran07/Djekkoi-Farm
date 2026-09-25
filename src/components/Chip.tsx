import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onPress,
  accessibilityLabel,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active
          ? { backgroundColor: theme.ink, borderColor: theme.ink }
          : { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text
        style={[
          styles.text,
          { color: active ? theme.bg : theme.muted },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13.5,
  },
});
