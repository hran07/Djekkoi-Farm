import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

interface ConfirmSheetProps {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  message,
  confirmLabel,
  onConfirm,
}) => {
  const theme = useTheme();
  const { closeSheet } = useStore();

  return (
    <View style={styles.container}>
      <Text style={[styles.messageText, { color: theme.ink }]}>{message}</Text>

      <View style={styles.row}>
        <Button variant="ghost" style={styles.btn} onPress={closeSheet}>
          Batal
        </Button>
        <Button
          variant="red"
          style={styles.btn}
          onPress={() => {
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  messageText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 16,
    lineHeight: 23,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
  },
});
