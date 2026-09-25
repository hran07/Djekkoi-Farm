import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Pond } from '@/lib/types';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

interface DeletePondSheetProps {
  pond: Pond;
}

export const DeletePondSheet: React.FC<DeletePondSheetProps> = ({ pond }) => {
  const theme = useTheme();
  const { state, deletePond, closeSheet } = useStore();

  const hasFish = state.fish.some((f) => f.kolamId === pond.id);

  if (hasFish) {
    return (
      <View style={styles.container}>
        <Text style={[styles.leadText, { color: theme.ink }]}>
          Masih ada ikan di <Text style={styles.bold}>{pond.name}</Text>. Pindahkan atau jual semua ikannya dulu sebelum menghapus kolam.
        </Text>

        <Button variant="default" wide onPress={closeSheet} style={styles.btn}>
          Mengerti
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.leadText, { color: theme.ink }]}>
        Hapus <Text style={styles.bold}>{pond.name}</Text>?
      </Text>

      <View style={styles.row}>
        <Button variant="ghost" style={styles.btnHalf} onPress={closeSheet}>
          Batal
        </Button>
        <Button variant="red" style={styles.btnHalf} onPress={() => deletePond(pond.id)}>
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
    marginTop: 6,
  },
  btnHalf: {
    flex: 1,
  },
});
