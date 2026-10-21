import { Badge, BadgeType } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { KoiArt } from '@/components/KoiArt';
import { FontNames } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useNetwork } from '@/hooks/useNetwork';
import { useTheme } from '@/hooks/useTheme';
import { rp, sum } from '@/lib/format';
import { Fish } from '@/lib/types';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'size_desc';

export default function MarketplaceScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { state, openSheet, toggleDisplay, getPondName, showToast } = useStore();
  const {
    isOnline,
    isChecking,
    isSimulatedOffline,
    toggleSimulatedOffline,
    checkConnection,
  } = useNetwork();

  const [query, setQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter hanya ikan yang terhubung ke penjualan (display === true)
  const connectedProducts = useMemo(() => {
    return state.fish.filter((f) => f.display === true);
  }, [state.fish]);

  // Statistik produk di marketplace
  const totalItems = connectedProducts.length;
  const totalFishCount = useMemo(
    () => sum(connectedProducts, (f) => f.jumlah),
    [connectedProducts]
  );
  const totalMarketValue = useMemo(
    () => sum(connectedProducts, (f) => f.hargaJual * f.jumlah),
    [connectedProducts]
  );

  // Filter pencarian dan grade, serta pengurutan
  const filteredProducts = useMemo(() => {
    let result = connectedProducts.filter((f) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        `${f.varietas} ${f.asal} ${f.catatan} ${f.grade} ${getPondName(f.kolamId)}`
          .toLowerCase()
          .includes(q);

      const matchesGrade =
        selectedGrade === 'all' ||
        f.grade.toLowerCase() === selectedGrade.toLowerCase();

      return matchesQuery && matchesGrade;
    });

    result.sort((a, b) => {
      if (sortOption === 'price_asc') return a.hargaJual - b.hargaJual;
      if (sortOption === 'price_desc') return b.hargaJual - a.hargaJual;
      if (sortOption === 'size_desc') return b.ukuran - a.ukuran;
      // newest default
      return new Date(b.tgl).getTime() - new Date(a.tgl).getTime();
    });

    return result;
  }, [connectedProducts, query, selectedGrade, sortOption, getPondName]);

  const handleManualCheckConnection = async () => {
    const online = await checkConnection();
    if (online) {
      showToast('Koneksi internet aktif! Marketplace siap diakses.');
    } else {
      showToast('Belum ada koneksi internet. Periksa Wi-Fi atau data seluler Anda.');
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await checkConnection();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, [checkConnection]);

  const getConditionBadgeType = (kondisi: string): BadgeType => {
    if (kondisi === 'Sehat') return 'ok';
    if (kondisi === 'Sakit') return 'bad';
    return 'warn';
  };

  // ──────────────────────────────────────────────
  // TAMPILAN OFFLINE (Blokir akses saat offline)
  // ──────────────────────────────────────────────
  if (!isOnline) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView
          contentContainerStyle={[
            styles.offlineContent,
            {
              paddingTop: Math.max(insets.top, 24) + 20,
              paddingBottom: 100 + Math.max(insets.bottom, 12),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Offline Illustration Card */}
          <View
            style={[
              styles.offlineCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <View style={[styles.offlineIconWrap, { backgroundColor: theme.badSoft }]}>
              <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"
                  stroke={theme.bad}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            <View style={[styles.offlineBadge, { backgroundColor: theme.badSoft }]}>
              <View style={[styles.pulseDot, { backgroundColor: theme.bad }]} />
              <Text style={[styles.offlineBadgeText, { color: theme.bad }]}>
                Aplikasi Offline
              </Text>
            </View>

            <Text style={[styles.offlineTitle, { color: theme.ink }]}>
              Akses Marketplace Terputus
            </Text>

            <Text style={[styles.offlineDesc, { color: theme.muted }]}>
              Fitur Marketplace membutuhkan koneksi internet aktif untuk melihat,
              menghubungkan, dan menyinkronkan produk ikan koi yang Anda jual.
            </Text>

            {isSimulatedOffline && (
              <View
                style={[
                  styles.simulatedBox,
                  { backgroundColor: theme.goldSoft, borderColor: theme.gold },
                ]}
              >
                <Text style={[styles.simulatedText, { color: theme.gold }]}>
                  ⚠️ Mode Uji: Simulasi Offline Aktif
                </Text>
              </View>
            )}

            <View style={styles.offlineActionCol}>
              <Button
                variant="pri"
                wide
                onPress={handleManualCheckConnection}
                disabled={isChecking}
              >
                {isChecking ? (
                  <View style={styles.checkingRow}>
                    <ActivityIndicator size="small" color={theme.onAccent} />
                    <Text style={[styles.checkingText, { color: theme.onAccent }]}>
                      Memeriksa koneksi...
                    </Text>
                  </View>
                ) : (
                  'Periksa Koneksi Internet'
                )}
              </Button>

              <Button
                variant={isSimulatedOffline ? 'red' : 'default'}
                wide
                onPress={toggleSimulatedOffline}
              >
                {isSimulatedOffline ? 'Matikan Simulasi Offline' : 'Uji Simulasi Offline'}
              </Button>
            </View>
          </View>

          {/* Edukasi Tambahan */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.surface2, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.infoTitle, { color: theme.ink }]}>
              Mengapa Marketplace butuh internet?
            </Text>
            <Text style={[styles.infoText, { color: theme.muted }]}>
              • Sinkronisasi katalog ikan real-time ke pembeli.{'\n'}
              • Pembaruan harga dan ketersediaan stok ikan.{'\n'}
              • Transaksi aman dan verifikasi identitas farm.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ──────────────────────────────────────────────
  // TAMPILAN ONLINE (Marketplace Aktif)
  // ──────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 110 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
      >
        {/* ── Top Header ─── */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.ink }]}>Marketplace</Text>
            <Text style={[styles.sub, { color: theme.muted }]}>
              Ikan aktif yang dipilih untuk dijual dari farm Anda.
            </Text>
          </View>

          {/* Status Online Pill */}
          <View
            style={[
              styles.onlinePill,
              { backgroundColor: theme.okSoft, borderColor: theme.ok },
            ]}
          >
            <View style={[styles.pulseDot, { backgroundColor: theme.ok }]} />
            <Text style={[styles.onlinePillText, { color: theme.ok }]}>Online</Text>
          </View>
        </View>

        {/* ── Quick Simulator Toggle Strip ─── */}
        <View
          style={[
            styles.simStrip,
            { backgroundColor: theme.surface2, borderColor: theme.line },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.simStripTitle, { color: theme.ink }]}>
              Koneksi Internet: Aktif
            </Text>
            <Text style={[styles.simStripSub, { color: theme.muted }]}>
              Anda dapat menguji respon offline kapan saja.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.simToggleBtn,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
            onPress={toggleSimulatedOffline}
            accessibilityRole="button"
            accessibilityLabel="Uji mode offline"
          >
            <Text style={[styles.simToggleText, { color: theme.accent }]}>
              Tes Offline
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── KPI Stats Cards ─── */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.accent }]}>
              {totalItems}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>
              Jenis Dijual
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.ink }]}>
              {totalFishCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>
              Total Ekor
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text
              style={[styles.statValue, { color: theme.red, fontSize: 15 }]}
              numberOfLines={1}
            >
              {rp(totalMarketValue)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>
              Total Nilai
            </Text>
          </View>
        </View>

        {/* ── Search Bar ─── */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.muted}
            strokeWidth={2}
            strokeLinecap="round"
          >
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
            style={[styles.searchInput, { color: theme.ink }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Cari varietas, asal, catatan..."
            placeholderTextColor={theme.muted}
          />
          {Boolean(query) && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Text style={{ color: theme.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter Chips ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <Chip
            label="Semua Grade"
            active={selectedGrade === 'all'}
            onPress={() => setSelectedGrade('all')}
          />
          <Chip
            label="Grade A"
            active={selectedGrade === 'A'}
            onPress={() => setSelectedGrade('A')}
          />
          <Chip
            label="Grade B"
            active={selectedGrade === 'B'}
            onPress={() => setSelectedGrade('B')}
          />
          <Chip
            label="Grade Show"
            active={selectedGrade === 'Show'}
            onPress={() => setSelectedGrade('Show')}
          />
        </ScrollView>

        {/* ── Sort Chips ─── */}
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: theme.muted }]}>Urutkan:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortContent}
          >
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortOption === 'newest' && {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accent,
                },
                { borderColor: theme.line },
              ]}
              onPress={() => setSortOption('newest')}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: sortOption === 'newest' ? theme.accent : theme.muted },
                ]}
              >
                Terbaru
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortChip,
                sortOption === 'price_asc' && {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accent,
                },
                { borderColor: theme.line },
              ]}
              onPress={() => setSortOption('price_asc')}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: sortOption === 'price_asc' ? theme.accent : theme.muted },
                ]}
              >
                Harga Terendah
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortChip,
                sortOption === 'price_desc' && {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accent,
                },
                { borderColor: theme.line },
              ]}
              onPress={() => setSortOption('price_desc')}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: sortOption === 'price_desc' ? theme.accent : theme.muted },
                ]}
              >
                Harga Tertinggi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortChip,
                sortOption === 'size_desc' && {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accent,
                },
                { borderColor: theme.line },
              ]}
              onPress={() => setSortOption('size_desc')}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: sortOption === 'size_desc' ? theme.accent : theme.muted },
                ]}
              >
                Ukuran Terbesar
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Product List Section ─── */}
        {filteredProducts.length > 0 ? (
          <View style={styles.productList}>
            {filteredProducts.map((fish: Fish) => (
              <View
                key={fish.id}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                  },
                ]}
              >
                {/* Image Section with Overlays */}
                <View
                  style={[styles.productImageWrap, { backgroundColor: theme.surface2 }]}
                >
                  {fish.foto ? (
                    <Image
                      source={{ uri: fish.foto }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <KoiArt varietas={fish.varietas} style={styles.productImage} />
                  )}

                  {/* Overlays */}
                  <View style={styles.imgTagRow}>
                    <View
                      style={[
                        styles.gradeTag,
                        { backgroundColor: 'rgba(0, 0, 0, 0.72)' },
                      ]}
                    >
                      <Text style={styles.gradeTagText}>Grade {fish.grade}</Text>
                    </View>

                    <View
                      style={[
                        styles.mktLiveTag,
                        { backgroundColor: 'rgba(23, 163, 74, 0.88)' },
                      ]}
                    >
                      <View style={styles.liveDot} />
                      <Text style={styles.mktLiveText}>Dijual</Text>
                    </View>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.productBody}>
                  {/* Title & Condition */}
                  <View style={styles.productTitleRow}>
                    <Text
                      style={[styles.productTitle, { color: theme.ink }]}
                      numberOfLines={1}
                    >
                      {fish.varietas}
                    </Text>
                    <Badge
                      label={fish.kondisi}
                      type={getConditionBadgeType(fish.kondisi)}
                    />
                  </View>

                  {/* Specs */}
                  <Text style={[styles.productSpecs, { color: theme.muted }]}>
                    {fish.ukuran} cm • {fish.kelamin} • {fish.asal || 'Lokal'}
                  </Text>

                  {/* Kolam & Stok */}
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaPond, { color: theme.ink }]}>
                      📍 {getPondName(fish.kolamId)}
                    </Text>
                    <Text style={[styles.metaStock, { color: theme.accent }]}>
                      {fish.jumlah} ekor tersedia
                    </Text>
                  </View>

                  {/* Price Row */}
                  <View
                    style={[
                      styles.priceBox,
                      { backgroundColor: theme.surface2, borderColor: theme.line },
                    ]}
                  >
                    <View>
                      <Text style={[styles.priceSub, { color: theme.muted }]}>
                        Harga Penjualan
                      </Text>
                      <Text style={[styles.priceMain, { color: theme.red }]}>
                        {rp(fish.hargaJual)}
                        <Text style={[styles.pricePer, { color: theme.muted }]}>
                          {' '}
                          / ekor
                        </Text>
                      </Text>
                    </View>
                    {fish.jumlah > 1 && (
                      <Text style={[styles.priceTotal, { color: theme.muted }]}>
                        Total: {rp(fish.hargaJual * fish.jumlah)}
                      </Text>
                    )}
                  </View>

                  {/* Seller / Farm badge */}
                  <View style={styles.sellerRow}>
                    <Text style={[styles.sellerLabel, { color: theme.muted }]}>
                      Peternak:
                    </Text>
                    <Text
                      style={[styles.sellerName, { color: theme.ink }]}
                      numberOfLines={1}
                    >
                      {user?.displayName || 'Djekkoi Farm'}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <Button
                      variant="pri"
                      style={styles.detailBtn}
                      onPress={() => openSheet('fishDetail', fish)}
                    >
                      Lihat Detail
                    </Button>
                    <Button
                      variant="ghost"
                      style={styles.disconnectBtn}
                      onPress={() => toggleDisplay(fish.id)}
                    >
                      Batal Jual
                    </Button>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : connectedProducts.length === 0 ? (
          /* Empty state: tidak ada ikan dengan display=true */
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.accentSoft }]}>
              <Svg
                width={36}
                height={36}
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.accent}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <Line x1={3} y1={6} x2={21} y2={6} />
                <Path d="M16 10a4 4 0 01-8 0" />
              </Svg>
            </View>

            <Text style={[styles.emptyTitle, { color: theme.ink }]}>
              Belum Ada Ikan di Marketplace
            </Text>

            <Text style={[styles.emptyDesc, { color: theme.muted }]}>
              Data ikan Anda belum dipilih untuk ditampilkan di penjualan. Pilih
              'Tampilkan di penjualan' pada data ikan Anda agar terhubung dan muncul di
              Marketplace ini.
            </Text>

            <View style={styles.emptyActions}>
              <Button
                variant="pri"
                wide
                onPress={() => router.push('/(tabs)/stock')}
              >
                Kelola Ikan di Stock
              </Button>
              <Button
                variant="default"
                wide
                onPress={() => openSheet('addFish')}
              >
                + Tambah Ikan Baru
              </Button>
            </View>
          </View>
        ) : (
          /* Empty state pencarian / filter */
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>
              Tidak ada ikan yang cocok
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.muted }]}>
              Tidak ditemukan ikan di marketplace dengan kata kunci "{query}".
            </Text>
            <Button
              variant="default"
              onPress={() => {
                setQuery('');
                setSelectedGrade('all');
              }}
            >
              Reset Filter
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  // Top header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontFamily: FontNames.sansBold,
    fontSize: 26,
    lineHeight: 30,
    marginTop: 4,
    marginBottom: 4,
  },
  sub: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    lineHeight: 18,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
  },
  onlinePillText: {
    fontFamily: FontNames.sansBold,
    fontSize: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Sim strip
  simStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  simStripTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 13,
  },
  simStripSub: {
    fontFamily: FontNames.sansMedium,
    fontSize: 11.5,
    marginTop: 1,
  },
  simToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  simToggleText: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 12,
  },

  // KPI Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: FontNames.sansBold,
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 11,
    textAlign: 'center',
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontNames.sansMedium,
    fontSize: 14.5,
  },

  // Filters
  filterScroll: {
    marginBottom: 10,
  },
  filterContent: {
    gap: 8,
    paddingRight: 10,
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sortLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
  },
  sortContent: {
    gap: 6,
  },
  sortChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sortChipText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
  },

  // Product List
  productList: {
    gap: 14,
  },
  productCard: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  productImageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imgTagRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeTagText: {
    fontFamily: FontNames.sansBold,
    fontSize: 11,
    color: '#ffffff',
  },
  mktLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  mktLiveText: {
    fontFamily: FontNames.sansBold,
    fontSize: 11,
    color: '#ffffff',
  },

  // Card Body
  productBody: {
    padding: 14,
    gap: 8,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  productTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 19,
    flex: 1,
  },
  productSpecs: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  metaPond: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 12.5,
  },
  metaStock: {
    fontFamily: FontNames.sansBold,
    fontSize: 12.5,
  },
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  priceSub: {
    fontFamily: FontNames.sansMedium,
    fontSize: 11,
  },
  priceMain: {
    fontFamily: FontNames.sansBold,
    fontSize: 16.5,
  },
  pricePer: {
    fontFamily: FontNames.sansRegular,
    fontSize: 12,
  },
  priceTotal: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
  },
  sellerName: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 12,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  detailBtn: {
    flex: 2,
  },
  disconnectBtn: {
    flex: 1,
  },

  // Empty state
  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 19,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActions: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },

  // ── OFFLINE BLOCKING STYLES ──
  offlineContent: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  offlineIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  offlineBadgeText: {
    fontFamily: FontNames.sansBold,
    fontSize: 12.5,
  },
  offlineTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 22,
    textAlign: 'center',
    marginTop: 4,
  },
  offlineDesc: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  simulatedBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  simulatedText: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 12.5,
  },
  offlineActionCol: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkingText: {
    fontFamily: FontNames.sansBold,
    fontSize: 14,
  },
  infoCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 14,
  },
  infoText: {
    fontFamily: FontNames.sansRegular,
    fontSize: 13,
    lineHeight: 20,
  },
});
