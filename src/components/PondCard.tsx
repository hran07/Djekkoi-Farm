import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Pond } from '@/lib/types';
import { Badge } from './Badge';
import { useStore } from '@/context/StoreContext';
import { sum } from '@/lib/format';

interface PondCardProps {
  pond: Pond;
  onPress: () => void;
}

export const PondCard: React.FC<PondCardProps> = ({ pond, onPress }) => {
  const theme = useTheme();
  const { state } = useStore();

  const pondFish = state.fish.filter((f) => f.kolamId === pond.id);
  const totalEkor = sum(pondFish, (f) => f.jumlah);
  const topFish = pondFish.slice(0, 6);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Kolam ${pond.name}, berisi ${totalEkor} ekor`}
    >
      <View style={styles.headerRow}>
        <View style={styles.infoBox}>
          <Text style={[styles.name, { color: theme.ink }]}>{pond.name}</Text>
          <Text style={[styles.lokasi, { color: theme.muted }]}>
            {pond.lokasi || 'Lokasi belum diisi'}
          </Text>
        </View>

        <View style={styles.countBox}>
          <Text style={[styles.num, { color: theme.ink }]}>{totalEkor}</Text>
          <Text style={[styles.unit, { color: theme.muted }]}>ekor</Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {topFish.length > 0 ? (
          topFish.map((f) => (
            <Badge key={f.id} label={`${f.varietas} ${f.jumlah}`} type="acc" style={styles.badgeMargin} />
          ))
        ) : (
          <Badge label="Kosong" type="default" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginVertical: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoBox: {
    flex: 1,
  },
  name: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 21,
    lineHeight: 25,
  },
  lokasi: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    marginTop: 2,
    marginBottom: 8,
  },
  countBox: {
    alignItems: 'flex-end',
  },
  num: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 28,
    lineHeight: 30,
  },
  unit: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badgeMargin: {
    marginBottom: 2,
  },
});
