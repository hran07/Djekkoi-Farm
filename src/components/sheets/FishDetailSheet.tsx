import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Fish, MarketplaceProduct } from '@/lib/types';
import { fdate, rp } from '@/lib/format';
import { Badge, BadgeType } from '../Badge';
import { KoiArt } from '../KoiArt';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';

interface FishDetailSheetProps {
  fish: Fish;
}

export const FishDetailSheet: React.FC<FishDetailSheetProps> = ({ fish }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { getPondName, openSheet, toggleDisplay, closeSheet, showToast } = useStore();

  const isOwner = !fish.userId || fish.userId === user?.uid;
  const mktProduct = fish as MarketplaceProduct;

  const getConditionBadgeType = (kondisi: string): BadgeType => {
    if (kondisi === 'Sehat') return 'ok';
    if (kondisi === 'Sakit') return 'bad';
    return 'warn';
  };

  const margin = fish.hargaJual - fish.hargaBeli;

  const tableRows: { label: string; value: React.ReactNode }[] = [
    { label: 'Asal', value: fish.asal || '-' },
    { label: 'Jumlah', value: `${fish.jumlah} ekor` },
    { label: 'Jenis', value: fish.varietas },
    { label: 'Ukuran', value: `${fish.ukuran} cm` },
    { label: 'Grade', value: fish.grade },
    { label: 'Jenis kelamin', value: fish.kelamin },
    {
      label: 'Kondisi',
      value: (
        <Badge
          key="kondisi-badge"
          label={fish.kondisi}
          type={getConditionBadgeType(fish.kondisi)}
        />
      ),
    },
    { label: 'Kolam', value: mktProduct.kolamName || getPondName(fish.kolamId) },
    ...(isOwner
      ? [
          { label: 'Harga beli', value: rp(fish.hargaBeli) },
          { label: 'Harga jual', value: rp(fish.hargaJual) },
          { label: 'Margin per ekor', value: rp(margin) },
        ]
      : [
          { label: 'Harga jual', value: rp(fish.hargaJual) },
          { label: 'Peternak / Penjual', value: mktProduct.sellerName || 'Peternak Djekkoi' },
          { label: 'Email Kontak', value: mktProduct.sellerEmail || '-' },
        ]),
    {
      label: 'Marketplace',
      value: (
        <Badge
          key="mkt-badge"
          label={fish.display ? 'Dijual di Marketplace' : 'Tidak Terhubung'}
          type={fish.display ? 'ok' : 'default'}
        />
      ),
    },
    { label: 'Masuk sejak', value: fdate(fish.tgl) },
    { label: 'Catatan', value: fish.catatan || '-' },
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
            key={row.label}
            style={[
              styles.kvRow,
              {
                borderBottomColor: theme.line,
                borderBottomWidth: idx === tableRows.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Text style={[styles.dt, { color: theme.muted }]}>{row.label}</Text>
            {typeof row.value === 'string' ? (
              <Text style={[styles.dd, { color: theme.ink }]}>{row.value}</Text>
            ) : (
              row.value
            )}
          </View>
        ))}
      </View>

      <View style={styles.buttonGroup}>
        {isOwner ? (
          <>
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
          </>
        ) : (
          <View style={styles.buttonGroup}>
            <Button
              variant="pri"
              wide
              onPress={() => {
                showToast(
                  `Kontak peternak: ${mktProduct.sellerEmail || mktProduct.sellerName || 'Peternak Djekkoi'}`
                );
              }}
            >
              Hubungi Penjual ({mktProduct.sellerName || 'Peternak'})
            </Button>
            <Button variant="default" wide onPress={closeSheet}>
              Tutup
            </Button>
          </View>
        )}
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
