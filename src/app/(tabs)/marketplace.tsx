import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Badge, BadgeType } from '@/components/Badge';
import { Button } from '@/components/Button';
import { KoiArt } from '@/components/KoiArt';
import { Skeleton } from '@/components/Skeleton';
import { FontNames } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useTheme } from '@/hooks/useTheme';
import { db, forceFirestoreReconnect } from '@/lib/firebase';
import { useAutoReconnect, checkIsDeviceOnline } from '@/hooks/useAutoReconnect';
import { rp } from '@/lib/format';
import { MarketplaceProduct } from '@/lib/types';
import {
  collection,
  getDocsFromServer,
  limit,
  orderBy,
  query as firestoreQuery,
  QueryDocumentSnapshot,
  startAfter,
} from 'firebase/firestore';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'size_desc';

const PAGE_SIZE = 10;
const FETCH_TIMEOUT_MS = 10000;
const MAX_SILENT_RETRIES = 5;
const SILENT_RETRY_INTERVAL_MS = 3000;

function parseProduct(docSnap: QueryDocumentSnapshot): MarketplaceProduct {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    userId: d.userId,
    sellerName: d.sellerName || 'Peternak Djekkoi',
    sellerEmail: d.sellerEmail || '',
    varietas: d.varietas || '',
    asal: d.asal || '',
    jumlah: Number(d.jumlah) || 1,
    ukuran: Number(d.ukuran) || 0,
    grade: d.grade || 'A',
    kelamin: d.kelamin || 'Belum diketahui',
    kondisi: d.kondisi || 'Sehat',
    hargaBeli: Number(d.hargaBeli) || 0,
    hargaJual: Number(d.hargaJual) || 0,
    kolamId: d.kolamId || '',
    kolamName: d.kolamName || '',
    catatan: d.catatan || '',
    display: true,
    foto: d.foto || null,
    tgl: d.tgl || new Date().toISOString(),
    updatedAt: d.updatedAt || new Date().toISOString(),
  };
}

function getSortConstraint(sort: SortOption) {
  switch (sort) {
    case 'price_asc':
      return orderBy('hargaJual', 'asc');
    case 'price_desc':
      return orderBy('hargaJual', 'desc');
    case 'size_desc':
      return orderBy('ukuran', 'desc');
    case 'newest':
    default:
      return orderBy('tgl', 'desc');
  }
}

// ── Skeleton Kartu Produk ───────────────────────────────────────────
function ProductCardSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.productCard,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      {/* Gambar 16:9 */}
      <Skeleton width="100%" height={190} borderRadius={0} />

      {/* Card Body */}
      <View style={styles.productBody}>
        {/* Title Row */}
        <View style={styles.productTitleRow}>
          <Skeleton width="55%" height={22} borderRadius={6} />
          <Skeleton width={60} height={20} borderRadius={10} />
        </View>

        {/* Specs */}
        <Skeleton width="75%" height={14} borderRadius={4} />

        {/* Kolam & Stok */}
        <View style={styles.metaRow}>
          <Skeleton width="40%" height={14} borderRadius={4} />
          <Skeleton width="30%" height={14} borderRadius={4} />
        </View>

        {/* Price Box */}
        <View
          style={[
            styles.priceBox,
            { backgroundColor: theme.surface2, borderColor: theme.line },
          ]}
        >
          <View style={{ gap: 4 }}>
            <Skeleton width={80} height={11} borderRadius={4} />
            <Skeleton width={120} height={18} borderRadius={4} />
          </View>
        </View>

        {/* Seller Row */}
        <View style={styles.sellerRow}>
          <Skeleton width={50} height={12} borderRadius={4} />
          <Skeleton width={100} height={12} borderRadius={4} />
        </View>

        {/* Action Button */}
        <View style={styles.cardActions}>
          <Skeleton width="100%" height={40} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

export default function MarketplaceScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { openSheet, toggleDisplay } = useStore();

  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Pagination & Loading States (Tidak disimpan di context global atau variabel modul)
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [fetchStatus, setFetchStatus] = useState<
    'idle' | 'loading-first' | 'loading-more' | 'done' | 'error-first'
  >('loading-first');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const hasMoreRef = useRef(true);
  const fetchIdRef = useRef(0);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silentRetryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silentRetryCountRef = useRef(0);

  // ─── Fetch First Page dengan Timeout & Silent Option ───────────────
  const fetchFirstPage = useCallback(
    async (
      sortTarget: SortOption = sortOption,
      {
        silent = false,
        isRetry = false,
      }: { silent?: boolean; isRetry?: boolean } = {}
    ) => {
      if (!user) return;

      const currentFetchId = ++fetchIdRef.current;
      console.log(
        `[Marketplace] attempt #${currentFetchId} (silent: ${silent}, isRetry: ${isRetry}): loading (sort: ${sortTarget})`
      );

      if (!silent) {
        setFetchStatus('loading-first');
        lastDocRef.current = null;
        hasMoreRef.current = true;
      }

      // Bersihkan timer timeout sebelumnya jika ada
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
        activeTimerRef.current = null;
      }

      // Timeout 10 detik eksplisit
      activeTimerRef.current = setTimeout(() => {
        if (fetchIdRef.current === currentFetchId) {
          console.log(
            `[Marketplace] attempt #${currentFetchId}: timeout 10s triggered -> error`
          );
          setFetchStatus('error-first');
        }
      }, FETCH_TIMEOUT_MS);

      try {
        // Reset koneksi & backoff Firestore HANYA jika diminta (retry/pull-to-refresh/auto-reconnect)
        if (isRetry) {
          await forceFirestoreReconnect();
        }

        const col = collection(db, 'marketplace_products');
        const q = firestoreQuery(
          col,
          getSortConstraint(sortTarget),
          limit(PAGE_SIZE)
        );

        // getDocsFromServer: TIDAK membaca cache, langsung ke server
        const snap = await getDocsFromServer(q);

        // Jika request berhasil (bahkan jika sebelumnya sudah berstatus error)
        if (fetchIdRef.current === currentFetchId) {
          if (activeTimerRef.current) {
            clearTimeout(activeTimerRef.current);
            activeTimerRef.current = null;
          }

          console.log(
            `[Marketplace] attempt #${currentFetchId}: success, docs: ${snap.docs.length}, fromCache: ${snap.metadata.fromCache}`
          );

          const items: MarketplaceProduct[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.display !== false) items.push(parseProduct(docSnap));
          });

          lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
          hasMoreRef.current = snap.docs.length === PAGE_SIZE;
          setProducts(items);
          setFetchStatus('done');
        }
      } catch (err) {
        if (fetchIdRef.current === currentFetchId) {
          if (activeTimerRef.current) {
            clearTimeout(activeTimerRef.current);
            activeTimerRef.current = null;
          }
          console.log(
            `[Marketplace] attempt #${currentFetchId}: error (code: ${
              (err as any)?.code || 'unknown'
            })`,
            err
          );
          if (!silent) {
            setFetchStatus('error-first');
          }
        }
      }
    },
    [user, sortOption]
  );

  // ─── Fetch Next Page (Load More, Gagal Diam-diam) ──────────────────
  const fetchNextPage = useCallback(async () => {
    if (!user) return;
    if (!hasMoreRef.current) return;
    if (fetchStatus === 'loading-more' || fetchStatus === 'loading-first') return;
    if (!lastDocRef.current) return;

    setFetchStatus('loading-more');

    try {
      const col = collection(db, 'marketplace_products');
      const q = firestoreQuery(
        col,
        getSortConstraint(sortOption),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );
      const snap = await getDocsFromServer(q);
      console.log(
        `[Marketplace LoadMore] success, docs: ${snap.docs.length}, fromCache: ${snap.metadata.fromCache}`
      );

      const items: MarketplaceProduct[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.display !== false) items.push(parseProduct(docSnap));
      });

      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? lastDocRef.current;
      hasMoreRef.current = snap.docs.length === PAGE_SIZE;
      setProducts((prev) => [...prev, ...items]);
      setFetchStatus('done');
    } catch {
      // Gagal diam-diam, tanpa pesan offline, tanpa loop retry
      setFetchStatus('done');
    }
  }, [user, fetchStatus, sortOption]);

  // ─── Tombol Coba Lagi (Non-silent: Skeleton + Reset Timer) ─────────
  const handleRetry = useCallback(async () => {
    silentRetryCountRef.current = 0;
    await fetchFirstPage(sortOption, { silent: false, isRetry: true });
  }, [fetchFirstPage, sortOption]);

  // ─── Percobaan Ulang Diam-diam (Silent Retry Interval saat Error) ──
  useEffect(() => {
    if (fetchStatus !== 'error-first') {
      if (silentRetryTimerRef.current) {
        clearInterval(silentRetryTimerRef.current);
        silentRetryTimerRef.current = null;
      }
      silentRetryCountRef.current = 0;
      return;
    }

    silentRetryCountRef.current = 0;

    silentRetryTimerRef.current = setInterval(async () => {
      if (silentRetryCountRef.current >= MAX_SILENT_RETRIES) {
        console.log(
          `[Marketplace] Max silent retries (${MAX_SILENT_RETRIES}) reached. Stopping retry interval.`
        );
        if (silentRetryTimerRef.current) {
          clearInterval(silentRetryTimerRef.current);
          silentRetryTimerRef.current = null;
        }
        return;
      }

      const isOnline = await checkIsDeviceOnline();
      if (isOnline) {
        silentRetryCountRef.current += 1;
        console.log(
          `[Marketplace] Silent retry #${silentRetryCountRef.current}/${MAX_SILENT_RETRIES} triggered (online detected)`
        );
        fetchFirstPage(sortOption, { silent: true, isRetry: true });
      } else {
        console.log('[Marketplace] Silent retry skipped (device is offline)');
      }
    }, SILENT_RETRY_INTERVAL_MS);

    return () => {
      if (silentRetryTimerRef.current) {
        clearInterval(silentRetryTimerRef.current);
        silentRetryTimerRef.current = null;
      }
    };
  }, [fetchStatus, fetchFirstPage, sortOption]);

  // ─── Pemulihan otomatis saat event 'online' terdeteksi ─────────────
  const handleAutoReconnect = useCallback(() => {
    console.log('[Marketplace] AutoReconnect event triggered: starting silent retry cycle');
    silentRetryCountRef.current = 0;
    fetchFirstPage(sortOption, { silent: true, isRetry: true });
  }, [fetchFirstPage, sortOption]);

  useAutoReconnect(
    handleAutoReconnect,
    fetchStatus === 'loading-first' || fetchStatus === 'error-first'
  );

  // ─── Pull-to-refresh ──────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Kosongkan segera agar tidak menampilkan data lama saat offline
    setProducts([]);
    lastDocRef.current = null;
    setFetchStatus('loading-first');
    await fetchFirstPage(sortOption, { silent: false, isRetry: true });
    setIsRefreshing(false);
  }, [fetchFirstPage, sortOption]);

  // ─── Ganti Urutan (Server-Side Ordering) ──────────────────────────
  const handleSelectSort = useCallback(
    (newSort: SortOption) => {
      if (newSort === sortOption) return;
      setSortOption(newSort);
      setProducts([]); // Kosongkan data agar skeleton tampil
      fetchFirstPage(newSort, { silent: false });
    },
    [sortOption, fetchFirstPage]
  );

  // ─── Inisialisasi awal (Hanya fetch saat layar aktif) ──────────────
  useEffect(() => {
    fetchFirstPage(sortOption, { silent: false });

    return () => {
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
      }
      if (silentRetryTimerRef.current) {
        clearInterval(silentRetryTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Filter Search di Sisi Klien ─────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      return (
        `${p.varietas} ${p.asal} ${p.catatan} ${p.grade} ${p.kolamName} ${p.sellerName}`
          .toLowerCase()
          .includes(q)
      );
    });
  }, [products, searchText]);

  // Jika hasil filter search kosong tapi masih ada halaman berikutnya di server,
  // otomatis muat halaman berikutnya agar hasil pencarian dapat ditemukan
  useEffect(() => {
    if (
      searchText.trim() &&
      filteredProducts.length === 0 &&
      hasMoreRef.current &&
      fetchStatus === 'done'
    ) {
      fetchNextPage();
    }
  }, [searchText, filteredProducts.length, fetchStatus, fetchNextPage]);

  const getConditionBadgeType = (kondisi: string): BadgeType => {
    if (kondisi === 'Sehat') return 'ok';
    if (kondisi === 'Sakit') return 'bad';
    return 'warn';
  };

  // ─── Header FlatList ──────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.ink }]}>Marketplace</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>
            Semua ikan yang sedang dijual oleh para peternak.
          </Text>
        </View>
      </View>

      {/* Search Bar */}
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
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Cari varietas, peternak, asal..."
          placeholderTextColor={theme.muted}
        />
        {Boolean(searchText) && (
          <TouchableOpacity onPress={() => setSearchText('')} hitSlop={10}>
            <Text style={{ color: theme.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chip Urutan (Tanpa teks "Urutkan") */}
      <View style={styles.sortRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}
          data={[
            { key: 'newest', label: 'Terbaru' },
            { key: 'price_asc', label: 'Harga Terendah' },
            { key: 'price_desc', label: 'Harga Tertinggi' },
            { key: 'size_desc', label: 'Ukuran Terbesar' },
          ] as { key: SortOption; label: string }[]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortOption === item.key && {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accent,
                },
                { borderColor: theme.line },
              ]}
              onPress={() => handleSelectSort(item.key)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  {
                    color:
                      sortOption === item.key ? theme.accent : theme.muted,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  // ─── Render Item Produk ───────────────────────────────────────────
  const renderItem = ({ item: product }: { item: MarketplaceProduct }) => {
    const isOwner = product.userId === user?.uid;
    return (
      <View
        style={[
          styles.productCard,
          { backgroundColor: theme.surface, borderColor: theme.line },
        ]}
      >
        {/* Gambar Produk */}
        <View
          style={[styles.productImageWrap, { backgroundColor: theme.surface2 }]}
        >
          {product.foto ? (
            <Image
              source={{ uri: product.foto }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <KoiArt varietas={product.varietas} style={styles.productImage} />
          )}

          {/* Overlays */}
          <View style={styles.imgTagRow}>
            <View
              style={[
                styles.gradeTag,
                { backgroundColor: 'rgba(0, 0, 0, 0.72)' },
              ]}
            >
              <Text style={styles.gradeTagText}>Grade {product.grade}</Text>
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
              {product.varietas}
            </Text>
            <Badge
              label={product.kondisi}
              type={getConditionBadgeType(product.kondisi)}
            />
          </View>

          {/* Specs */}
          <Text style={[styles.productSpecs, { color: theme.muted }]}>
            {product.ukuran} cm • {product.kelamin} • {product.asal || 'Lokal'}
          </Text>

          {/* Kolam & Stok */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaPond, { color: theme.ink }]}>
              📍 {product.kolamName || '-'}
            </Text>
            <Text style={[styles.metaStock, { color: theme.accent }]}>
              {product.jumlah} ekor tersedia
            </Text>
          </View>

          {/* Price Box */}
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
                {rp(product.hargaJual)}
                <Text style={[styles.pricePer, { color: theme.muted }]}>
                  {' '}
                  / ekor
                </Text>
              </Text>
            </View>
            {product.jumlah > 1 && (
              <Text style={[styles.priceTotal, { color: theme.muted }]}>
                Total: {rp(product.hargaJual * product.jumlah)}
              </Text>
            )}
          </View>

          {/* Peternak */}
          <View style={styles.sellerRow}>
            <Text style={[styles.sellerLabel, { color: theme.muted }]}>
              Peternak:
            </Text>
            <Text
              style={[styles.sellerName, { color: theme.ink }]}
              numberOfLines={1}
            >
              {product.sellerName || 'Djekkoi Farm'}
              {isOwner ? ' (Anda)' : ''}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActions}>
            <Button
              variant="pri"
              style={styles.detailBtn}
              onPress={() => openSheet('fishDetail', product)}
            >
              Lihat Detail
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                style={styles.disconnectBtn}
                onPress={() => toggleDisplay(product.id)}
              >
                Batal Jual
              </Button>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── Empty & Error State ──────────────────────────────────────────
  const renderEmptyOrError = () => {
    // 1. Loading first page: Tampilkan 3 kartu Skeleton
    if (fetchStatus === 'loading-first') {
      return (
        <View style={styles.skeletonContainer}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      );
    }

    // 2. Error setelah 10 detik atau offline
    if (fetchStatus === 'error-first') {
      return (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View
            style={[styles.emptyIconWrap, { backgroundColor: theme.surface2 }]}
          >
            <Svg
              width={36}
              height={36}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.muted}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <Path d="M12 8v4M12 16h.01" />
            </Svg>
          </View>
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>
            Koneksi bermasalah
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.muted }]}>
            Tidak dapat mengambil data marketplace. Periksa koneksi Anda, lalu
            coba lagi.
          </Text>
          <View style={styles.emptyActions}>
            <Button variant="pri" wide onPress={handleRetry}>
              Coba Lagi
            </Button>
          </View>
        </View>
      );
    }

    // 3. Query berhasil tapi koleksi memang kosong
    if (products.length === 0) {
      return (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View
            style={[styles.emptyIconWrap, { backgroundColor: theme.accentSoft }]}
          >
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
              <Path d="M3 6h18" />
              <Path d="M16 10a4 4 0 01-8 0" />
            </Svg>
          </View>
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>
            Belum Ada Ikan di Marketplace
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.muted }]}>
            Belum ada peternak yang menampilkan ikan untuk dijual saat ini.
          </Text>
        </View>
      );
    }

    // 4. Filter search tidak ada yang cocok (hanya jika sudah tidak ada halaman lagi untuk dicoba)
    if (!hasMoreRef.current && searchText.trim() !== '') {
      return (
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
            Tidak ditemukan ikan dengan kata kunci "{searchText}".
          </Text>
          <Button variant="default" onPress={() => setSearchText('')}>
            Reset Filter
          </Button>
        </View>
      );
    }

    return null;
  };

  // ─── Footer FlatList ──────────────────────────────────────────────
  const ListFooter =
    fetchStatus === 'loading-more' ? (
      <View style={styles.loadMoreSpinner}>
        <ActivityIndicator size="small" color={theme.muted} />
      </View>
    ) : undefined;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <FlatList
        data={fetchStatus === 'loading-first' ? [] : filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={renderEmptyOrError}
        ListFooterComponent={ListFooter}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 110 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (
            !isRefreshing &&
            fetchStatus === 'done' &&
            hasMoreRef.current
          ) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

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

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontNames.sansRegular,
    fontSize: 14,
    padding: 0,
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sortContent: { gap: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12.5,
  },

  // Product Card
  productCard: {
    borderWidth: 1,
    borderRadius: 20,
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

  // Empty & Error Card
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

  // Load More Footer
  loadMoreSpinner: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Skeleton
  skeletonContainer: {
    gap: 12,
    marginTop: 4,
  },
});
