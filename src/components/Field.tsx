import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, required = false, error, style, children }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: theme.muted }]}>
        {label}
        {required && <Text style={{ color: theme.red }}> *</Text>}
      </Text>
      {children}
      {Boolean(error) && <Text style={[styles.error, { color: theme.red }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13,
    marginBottom: 4,
  },
  error: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
    marginTop: 2,
  },
});
