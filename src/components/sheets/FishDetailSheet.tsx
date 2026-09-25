import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Fish } from '@/lib/types';
import { fdate, rp } from '@/lib/format';
import { Badge, BadgeType } from '../Badge';
import { KoiArt } from '../KoiArt';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

interface FishDetailSheetProps {
  fish: Fish;
}

export const FishDetailSheet: React.FC<FishDetailSheetProps> = ({ fish }) => {
  const theme = useTheme();
  const { getPondName, openSheet, toggleDisplay } = useStore();

  const getConditionBadgeType = (kondisi: string): BadgeType => {
    if (kondisi === 'Sehat') return 'ok';
    if (kondisi === 'Sakit') return 'bad';
    return 'warn';
  };

  const margin = fish.hargaJual - fish.hargaBeli;

  const tableRows: [string, React.ReactNode][] = [
    ['Asal', fish.asal || '-'],
    ['Jumlah', `${fish.jumlah} ekor`],
    ['Jenis', fish.varietas],
    ['Ukuran', `${fish.ukuran} cm`],
    ['Grade', fish.grade],
    ['Jenis kelamin', fish.kelamin],
    [
      'Kondisi',
      <Badge
        key="kondisi-badge"
        label={fish.kondisi}
        type={getConditionBadgeType(fish.kondisi)}
      />,
    ],
    ['Kolam', getPondName(fish.kolamId)],
    ['Harga beli', rp(fish.hargaBeli)],
    ['Harga jual', rp(fish.hargaJual)],
    ['Margin per ekor', rp(margin)],
    ['Masuk sejak', fdate(fish.tgl)],
    ['Catatan', fish.catatan || '-'],
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.heroImgWrap, { backgroundColor: theme.surface2 }]}>
        {fish.foto ? (
          <Image source={{ uri: fish.foto }} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <KoiArt varietas={fish.varietas} style={styles.heroImg} />
        )}
      </View>

      <View style={[styles.kvTable, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        {tableRows.map((row, idx) => (
          <View
            key={row[0]}
            style={[
              styles.kvRow,
              {
                borderBottomColor: theme.line,
                borderBottomWidth: idx === tableRows.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Text style={[styles.dt, { color: theme.muted }]}>{row[0]}</Text>
            {typeof row[1] === 'string' ? (
              <Text style={[styles.dd, { color: theme.ink }]}>{row[1]}</Text>
            ) : (
              row[1]
            )}
          </View>
        ))}
      </View>

      <View style={styles.buttonGroup}>
        <View style={styles.row}>
          <Button
            variant="pri"
            style={styles.halfBtn}
            onPress={() => openSheet('sellFish', fish)}
          >
            Jual
          </Button>
          <Button
            variant="default"
            style={styles.halfBtn}
            onPress={() => openSheet('moveFish', fish)}
          >
            Pindah kolam
          </Button>
        </View>

        <View style={styles.row}>
          <Button
            variant="default"
            style={styles.halfBtn}
            onPress={() => openSheet('editFish', fish)}
          >
            Edit harga / ukuran
          </Button>
          <Button
            variant="default"
            style={styles.halfBtn}
            onPress={() => toggleDisplay(fish.id)}
          >
            {fish.display ? 'Sembunyikan dari penjualan' : 'Tampilkan di penjualan'}
          </Button>
        </View>

        <Button
          variant="ghost"
          wide
          style={styles.delBtn}
          onPress={() => openSheet('deleteFish', fish)}
        >
          Hapus data ikan
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  heroImgWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  kvTable: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 14,
  },
  dt: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
  },
  dd: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13.5,
    textAlign: 'right',
    flex: 1,
  },
  buttonGroup: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfBtn: {
    flex: 1,
  },
  delBtn: {
    marginTop: 2,
  },
});
