import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Fish } from '@/lib/types';
import { rp } from '@/lib/format';
import { Button } from './Button';
import { KoiArt } from './KoiArt';
import { useStore } from '@/context/StoreContext';

interface SaleCardProps {
  fish: Fish;
}

export const SaleCard: React.FC<SaleCardProps> = ({ fish }) => {
  const theme = useTheme();
  const { openSheet, toggleDisplay } = useStore();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
      ]}
    >
      <View style={[styles.imageWrap, { backgroundColor: theme.surface2 }]}>
        {fish.foto ? (
          <Image source={{ uri: fish.foto }} style={styles.image} resizeMode="cover" />
        ) : (
          <KoiArt varietas={fish.varietas} style={styles.image} />
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.ink }]}>{fish.varietas}</Text>
        <Text style={[styles.price, { color: theme.red }]}>{rp(fish.hargaJual)}</Text>

        <View style={styles.dl}>
          <View style={styles.row}>
            <Text style={[styles.dt, { color: theme.muted }]}>Jumlah</Text>
            <Text style={[styles.dd, { color: theme.ink }]}>{fish.jumlah} ekor</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.dt, { color: theme.muted }]}>Ukuran</Text>
            <Text style={[styles.dd, { color: theme.ink }]}>{fish.ukuran} cm</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.dt, { color: theme.muted }]}>Kualitas</Text>
            <Text style={[styles.dd, { color: theme.ink }]}>Grade {fish.grade}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.dt, { color: theme.muted }]}>Kondisi</Text>
            <Text style={[styles.dd, { color: theme.ink }]}>{fish.kondisi}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.dt, { color: theme.muted }]}>Jenis kelamin</Text>
            <Text style={[styles.dd, { color: theme.ink }]}>{fish.kelamin}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            variant="pri"
            size="sm"
            style={styles.actionBtn}
            onPress={() => openSheet('sellFish', fish)}
          >
            Jual
          </Button>
          <Button
            variant="ghost"
            size="sm"
            style={styles.actionBtn}
            onPress={() => toggleDisplay(fish.id)}
          >
            Sembunyikan
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 6,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 14,
    gap: 8,
  },
  title: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 20,
    lineHeight: 24,
  },
  price: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 4,
  },
  dl: {
    gap: 4,
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dt: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
  },
  dd: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
