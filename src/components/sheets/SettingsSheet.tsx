import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

export const SettingsSheet: React.FC = () => {
  const theme = useTheme();
  const { openSheet, wipeData } = useStore();

  const handleWipePress = () => {
    openSheet('confirm', {
      title: 'Konfirmasi',
      message: 'Semua ikan, kolam, dan riwayat akan dihapus. Tidak bisa dibatalkan.',
      confirmLabel: 'Ya, hapus semua',
      onConfirm: wipeData,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.noteText, { color: theme.muted }]}>
        Data tersimpan di perangkat ini. Aplikasi bekerja offline dan belum tersinkron ke server.
      </Text>

      <Button variant="red" wide onPress={handleWipePress} style={styles.wipeBtn}>
        Kosongkan semua data
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  noteText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    lineHeight: 20,
  },
  wipeBtn: {
    marginTop: 6,
  },
});
