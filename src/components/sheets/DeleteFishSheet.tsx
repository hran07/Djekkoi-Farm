import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Fish } from '@/lib/types';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

interface DeleteFishSheetProps {
  fish: Fish;
}

export const DeleteFishSheet: React.FC<DeleteFishSheetProps> = ({ fish }) => {
  const theme = useTheme();
  const { deleteFish, closeSheet } = useStore();

  return (
    <View style={styles.container}>
      <Text style={[styles.leadText, { color: theme.ink }]}>
        Hapus data <Text style={styles.bold}>{fish.varietas}</Text> ({fish.jumlah} ekor)? Riwayat lama tetap tersimpan.
      </Text>

      <View style={styles.row}>
        <Button variant="ghost" style={styles.btn} onPress={closeSheet}>
          Batal
        </Button>
        <Button variant="red" style={styles.btn} onPress={() => deleteFish(fish.id)}>
          Ya, hapus
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  leadText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 6,
  },
  bold: {
    fontFamily: FontNames.sansBold,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
  },
});
