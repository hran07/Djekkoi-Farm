import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, style }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.line }, style]}>
      <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.muted }]}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  title: {
    fontFamily: FontNames.sansBold,
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
});
