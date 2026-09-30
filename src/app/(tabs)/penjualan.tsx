import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { SaleCard } from '@/components/SaleCard';
import { Button } from '@/components/Button';
import { Badge, BadgeType } from '@/components/Badge';
import { KoiArt } from '@/components/KoiArt';
import { EmptyState } from '@/components/EmptyState';

export default function PenjualanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, toggleDisplay } = useStore();

  const onDisplayFish = state.fish.filter((f) => f.display);
  const hiddenDisplayFish = state.fish.filter((f) => !f.display);

  const getConditionBadgeType = (kondisi: string): BadgeType => {
    if (kondisi === 'Sehat') return 'ok';
    if (kondisi === 'Sakit') return 'bad';
    return 'warn';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 110 + Math.max(insets.bottom, 12) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.ink }]}>Display penjualan</Text>
      <Text style={[styles.sub, { color: theme.muted }]}>
        Data di sini otomatis dari data ikan. Ubah harga atau ukuran di tab Ikan dan
        tampilan ini ikut berubah.
      </Text>

      {/* On Display List */}
      {onDisplayFish.length > 0 ? (
        <View style={styles.grid}>
          {onDisplayFish.map((f) => (
            <SaleCard key={f.id} fish={f} />
          ))}
        </View>
      ) : (
        <EmptyState
          title="Belum ada ikan yang ditampilkan"
          description="Tampilkan ikan dari daftar di bawah."
        />
      )}

      {/* Hidden / Belum Ditampilkan Section */}
      {hiddenDisplayFish.length > 0 && (
        <View style={styles.hiddenSection}>
          <Text style={[styles.secTitle, { color: theme.ink }]}>
            Belum ditampilkan
          </Text>

          <View style={styles.hiddenList}>
            {hiddenDisplayFish.map((f) => (
              <View
                key={f.id}
                style={[
                  styles.hiddenCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                  },
                ]}
              >
                <View style={[styles.photoWrap, { backgroundColor: theme.surface2 }]}>
                  {f.foto ? (
                    <Image source={{ uri: f.foto }} style={styles.photo} resizeMode="cover" />
                  ) : (
                    <KoiArt varietas={f.varietas} style={styles.photo} />
                  )}
                </View>

                <View style={styles.hiddenBody}>
                  <View style={styles.topRow}>
                    <Text style={[styles.varietas, { color: theme.ink }]}>
                      {f.varietas}
                    </Text>
                    <Badge
                      label={f.kondisi}
                      type={getConditionBadgeType(f.kondisi)}
                    />
                  </View>

                  <Text style={[styles.meta, { color: theme.muted }]}>
                    {f.jumlah} ekor, {f.ukuran} cm
                  </Text>

                  <Button
                    variant="default"
                    size="sm"
                    style={styles.showBtn}
                    onPress={() => toggleDisplay(f.id)}
                  >
                    Tampilkan di penjualan
                  </Button>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 26,
    lineHeight: 30,
    marginTop: 6,
    marginBottom: 4,
  },
  sub: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 20,
  },
  grid: {
    gap: 10,
  },
  hiddenSection: {
    marginTop: 22,
  },
  secTitle: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 19,
    marginBottom: 10,
  },
  hiddenList: {
    gap: 10,
  },
  hiddenCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: 12,
  },
  photoWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: 80,
    height: 80,
  },
  hiddenBody: {
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
    fontFamily: FontNames.serifBold,
    fontSize: 16,
  },
  meta: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
  },
  showBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
