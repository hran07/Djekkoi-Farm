import { FontNames } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  inModal?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ inModal = false }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { toastMessage, activeSheet } = useStore();

  if (!toastMessage) return null;

  // If a modal sheet is open, only render the toast inside the modal container
  if (!inModal && activeSheet) return null;
  if (inModal && !activeSheet) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: theme.ink,
          bottom: 72 + Math.max(insets.bottom, 12),
        },
      ]}
      pointerEvents="none"
      accessibilityRole="alert"
    >
      <Text style={[styles.text, { color: theme.bg }]}>{toastMessage}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 99,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  text: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 14,
    textAlign: 'center',
  },
});
