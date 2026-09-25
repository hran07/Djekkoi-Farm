import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { HistoryEntry } from '@/lib/types';
import { ftime, rp } from '@/lib/format';
import { useStore } from '@/context/StoreContext';

interface HistoryItemProps {
  item: HistoryEntry;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item }) => {
  const theme = useTheme();
  const { openSheet } = useStore();

  const getEmojiIcon = (tipe: HistoryEntry['tipe']) => {
    switch (tipe) {
      case 'masuk':
        return '📥';
      case 'keluar':
        return '📤';
      case 'edit_ikan':
        return '✏️';
      case 'edit_kolam':
        return '🛠️';
      default:
        return '📝';
    }
  };

  const getTitle = () => {
    if (item.tipe === 'keluar') {
      return item.tujuan === 'terjual' ? 'Ikan keluar, terjual' : 'Ikan keluar, pindah kolam';
    }
    return item.judul;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
      ]}
    >
      <Text style={styles.icon}>{getEmojiIcon(item.tipe)}</Text>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: theme.ink }]}>{getTitle()}</Text>
          <Text style={[styles.time, { color: theme.muted }]}>{ftime(item.ts)}</Text>
        </View>

        {Boolean(item.ikan) && (
          <Text style={[styles.detailText, { color: theme.muted }]}>
            {item.ikan}
            {item.jumlah ? `, ${item.jumlah} ekor` : ''}
          </Text>
        )}

        {item.tipe === 'masuk' && Boolean(item.ke) && (
          <Text style={[styles.detailText, { color: theme.muted }]}>
            Kolam tujuan: {item.ke}
          </Text>
        )}

        {item.tipe === 'keluar' && (
          <Text style={[styles.detailText, { color: theme.muted }]}>
            Kolam asal: {item.dari || '-'}
            {item.tujuan === 'pindah' ? `. Kolam tujuan: ${item.ke || '-'}` : ''}
          </Text>
        )}

        {Boolean(item.detail) && (
          <Text style={[styles.detailText, { color: theme.muted }]}>{item.detail}</Text>
        )}

        {item.sale && (
          <View style={[styles.saleBox, { backgroundColor: theme.redSoft }]}>
            <View style={styles.saleInfo}>
              <Text style={[styles.salePrice, { color: theme.ink }]}>
                {rp(item.sale.harga * (item.jumlah || 1))}{' '}
                <Text style={styles.perUnit}>({rp(item.sale.harga)} per ekor)</Text>
              </Text>

              <Text style={[styles.saleMeta, { color: theme.ink }]}>
                {item.sale.pembeli || 'Tanpa nama'}, {item.sale.metode}
              </Text>

              {Boolean(item.sale.catatan) && (
                <Text style={[styles.saleNote, { color: theme.muted }]}>
                  {item.sale.catatan}
                </Text>
              )}
            </View>

            {Boolean(item.sale.bukti) && (
              <TouchableOpacity
                onPress={() => openSheet('proofImage', item.sale?.bukti)}
                accessibilityRole="button"
                accessibilityLabel="Lihat bukti transaksi"
              >
                <Image source={{ uri: item.sale.bukti! }} style={styles.proofThumb} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontFamily: FontNames.sansBold,
    fontSize: 14.5,
    flex: 1,
  },
  time: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12.5,
  },
  detailText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    marginTop: 2,
  },
  saleBox: {
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  saleInfo: {
    flex: 1,
  },
  salePrice: {
    fontFamily: FontNames.serifBold,
    fontSize: 14.5,
  },
  perUnit: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12.5,
  },
  saleMeta: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13,
    marginTop: 2,
  },
  saleNote: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
    marginTop: 2,
  },
  proofThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
});
