import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Fish } from '@/lib/types';
import { rp } from '@/lib/format';
import { Badge, BadgeType } from './Badge';
import { KoiArt } from './KoiArt';
import { useStore } from '@/context/StoreContext';

interface FishCardProps {
  fish: Fish;
  onPress?: () => void;
}

export const FishCard: React.FC<FishCardProps> = ({ fish, onPress }) => {
  const theme = useTheme();
  const { openSheet, getPondName } = useStore();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      openSheet('fishDetail', fish);
    }
  };

  const getConditionBadgeType = (kondisi: string): BadgeType => {
    if (kondisi === 'Sehat') return 'ok';
    if (kondisi === 'Sakit') return 'bad';
    return 'warn';
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Ikan ${fish.varietas}, ${fish.jumlah} ekor`}
    >
      <View style={[styles.photoWrap, { backgroundColor: theme.surface2 }]}>
        {fish.foto ? (
          <Image source={{ uri: fish.foto }} style={styles.photo} resizeMode="cover" />
        ) : (
          <KoiArt varietas={fish.varietas} style={styles.photo} />
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.varietas, { color: theme.ink }]} numberOfLines={1}>
            {fish.varietas}
          </Text>
          <Badge label={fish.kondisi} type={getConditionBadgeType(fish.kondisi)} />
        </View>

        <Text style={[styles.meta, { color: theme.muted }]}>
          {fish.ukuran} cm, Grade {fish.grade}, {fish.kelamin}
        </Text>

        <Text style={[styles.meta, { color: theme.muted }]}>
          {fish.jumlah} ekor di {getPondName(fish.kolamId)}
        </Text>

        <Text style={[styles.price, { color: theme.red }]}>
          {rp(fish.hargaJual)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'stretch',
    marginVertical: 5,
  },
  photoWrap: {
    width: 92,
    height: 92,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: 92,
    height: 92,
    borderRadius: 12,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  varietas: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 18,
    lineHeight: 22,
    flex: 1,
  },
  meta: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
    marginTop: 1,
  },
  price: {
    fontFamily: FontNames.sansBold,
    fontSize: 14.5,
    marginTop: 4,
  },
});
