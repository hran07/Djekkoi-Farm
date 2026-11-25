import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Fish, MarketplaceProduct } from '@/lib/types';
import { fdate, rp } from '@/lib/format';
import { getConversationId, getOrCreateConversation } from '@/lib/chat';
import { formatDistance, getCurrentCoords, haversineMeters, openDirectionsInMaps } from '@/lib/location';
import { useGeofence } from '@/hooks/useGeofence';
import { Badge, BadgeType } from '../Badge';
import { KoiArt } from '../KoiArt';
import { Button } from '../Button';
import { Skeleton } from '../Skeleton';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { db, forceFirestoreReconnect } from '@/lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { useAutoReconnect, checkIsDeviceOnline } from '@/hooks/useAutoReconnect';

interface FishDetailSheetProps {
  fish: Fish;
}

const DETAIL_TIMEOUT_MS = 10000;
const MAX_SILENT_RETRIES = 5;
const SILENT_RETRY_INTERVAL_MS = 3000;

function DetailSheetSkeleton() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Gambar 16:10 */}
      <Skeleton
        width="100%"
        height={210}
        borderRadius={16}
        style={{ marginBottom: 12 }}
      />

      {/* Tabel Detail */}
      <View
        style={[
          styles.kvTable,
          { backgroundColor: theme.surface, borderColor: theme.line },
        ]}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item, idx) => (
          <View
            key={item}
            style={[
              styles.kvRow,
              {
                borderBottomColor: theme.line,
                borderBottomWidth: idx === 7 ? 0 : 1,
              },
            ]}
          >
            <Skeleton width="35%" height={15} borderRadius={4} />
            <Skeleton width="45%" height={15} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Button Skeleton */}
      <View style={styles.buttonGroup}>
        <Skeleton width="100%" height={46} borderRadius={12} />
      </View>
    </View>
  );
}

export const FishDetailSheet: React.FC<FishDetailSheetProps> = ({
  fish: initialFish,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { getPondName, openSheet, toggleDisplay, closeSheet, showToast } =
    useStore();

  const isMarketplaceItem = Boolean(
    initialFish && (initialFish as MarketplaceProduct).sellerName !== undefined
  );
  const [fish, setFish] = useState<Fish>(initialFish);
  const [fetchState, setFetchState] = useState<'loading' | 'done' | 'error'>(
    isMarketplaceItem ? 'loading' : 'done'
  );

  const fetchIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silentRetryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silentRetryCountRef = useRef(0);

  // Selalu sinkronkan state lokal saat initialFish berubah
  useEffect(() => {
    if (initialFish) {
      const timer = setTimeout(() => {
        setFish(initialFish);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialFish]);

  const fetchDetail = useCallback(
    async ({
      silent = false,
      isRetry = false,
    }: { silent?: boolean; isRetry?: boolean } = {}) => {
      if (!initialFish?.id) return;

      const currentFetchId = ++fetchIdRef.current;
      console.log(
        `[FishDetailSheet] attempt #${currentFetchId} (silent: ${silent}, isRetry: ${isRetry}): loading`
      );

      if (!silent) {
        setFetchState('loading');
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Timeout 10 detik eksplisit
      timerRef.current = setTimeout(() => {
        if (fetchIdRef.current === currentFetchId) {
          console.log(
            `[FishDetailSheet] attempt #${currentFetchId}: timeout 10s triggered -> error`
          );
          setFetchState('error');
        }
      }, DETAIL_TIMEOUT_MS);

      try {
        // Reset koneksi & backoff Firestore HANYA jika diminta (retry/auto-reconnect)
        // Jangan disableNetwork pada pemuatan normal awal karena akan memutus koneksi aktif
        if (isRetry) {
          await forceFirestoreReconnect();
        }

        const docRef = doc(db, 'marketplace_products', initialFish.id);
        // Menggunakan getDocFromServer agar tidak membaca cache
        const snap = await getDocFromServer(docRef);

        if (fetchIdRef.current === currentFetchId) {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }

          console.log(
            `[FishDetailSheet] attempt #${currentFetchId}: success, fromCache: ${snap.metadata.fromCache}`
          );

          if (snap.exists()) {
            const d = snap.data();
            setFish({
              ...initialFish,
              jumlah: Number(d.jumlah) || initialFish.jumlah,
              hargaJual: Number(d.hargaJual) || initialFish.hargaJual,
              hargaBeli: Number(d.hargaBeli) || initialFish.hargaBeli,
              kondisi: d.kondisi || initialFish.kondisi,
              catatan: d.catatan || initialFish.catatan,
              display: d.display ?? initialFish.display,
              updatedAt: d.updatedAt,
              sellerName: d.sellerName,
              sellerEmail: d.sellerEmail,
              kolamName: d.kolamName,
              storeName: d.storeName,
              storeLat: typeof d.storeLat === 'number' ? d.storeLat : undefined,
              storeLng: typeof d.storeLng === 'number' ? d.storeLng : undefined,
              storeAddress: d.storeAddress,
            } as MarketplaceProduct);
          }
          setFetchState('done');
        }
      } catch (err) {
        if (fetchIdRef.current === currentFetchId) {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          console.log(
            `[FishDetailSheet] attempt #${currentFetchId}: error (code: ${
              (err as any)?.code || 'unknown'
            })`,
            err
          );
          if (!silent) {
            setFetchState('error');
          }
        }
      }
    },
    [initialFish]
  );

  const handleRetry = useCallback(async () => {
    silentRetryCountRef.current = 0;
    fetchDetail({ silent: false, isRetry: true });
  }, [fetchDetail]);

  // Percobaan ulang berkala diam-diam saat status 'error'
  useEffect(() => {
    if (!isMarketplaceItem || fetchState !== 'error') {
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
          `[FishDetailSheet] Max silent retries (${MAX_SILENT_RETRIES}) reached. Stopping retry interval.`
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
          `[FishDetailSheet] Silent retry #${silentRetryCountRef.current}/${MAX_SILENT_RETRIES} triggered (online detected)`
        );
        fetchDetail({ silent: true, isRetry: true });
      } else {
        console.log('[FishDetailSheet] Silent retry skipped (device is offline)');
      }
    }, SILENT_RETRY_INTERVAL_MS);

    return () => {
      if (silentRetryTimerRef.current) {
        clearInterval(silentRetryTimerRef.current);
        silentRetryTimerRef.current = null;
      }
    };
  }, [fetchState, isMarketplaceItem, fetchDetail]);

  // Pemulihan otomatis saat koneksi kembali
  const handleAutoReconnect = useCallback(() => {
    console.log('[FishDetailSheet] AutoReconnect event triggered: starting silent retry');
    silentRetryCountRef.current = 0;
    fetchDetail({ silent: true, isRetry: true });
  }, [fetchDetail]);

  useAutoReconnect(
    handleAutoReconnect,
    isMarketplaceItem && (fetchState === 'loading' || fetchState === 'error')
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isMarketplaceItem && initialFish?.id) {
      timer = setTimeout(() => {
        fetchDetail({ silent: false, isRetry: false });
      }, 0);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (silentRetryTimerRef.current) {
        clearInterval(silentRetryTimerRef.current);
      }
    };
  }, [isMarketplaceItem, initialFish?.id, fetchDetail]);

  const isOwner = !fish?.userId || fish?.userId === user?.uid;
  const mktProduct = fish as MarketplaceProduct;
  const sellerId = mktProduct?.userId || '';

  // ── Lokasi Toko & Geofence (Khusus Pembeli) ────────────────
  const hasStoreCoords =
    typeof mktProduct?.storeLat === 'number' && typeof mktProduct?.storeLng === 'number';

  const storeCenter = useMemo(() => {
    return hasStoreCoords && typeof mktProduct?.storeLat === 'number' && typeof mktProduct?.storeLng === 'number'
      ? { lat: mktProduct.storeLat, lng: mktProduct.storeLng }
      : null;
  }, [mktProduct, hasStoreCoords]);

  const [buyerCoords, setBuyerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [buyerDistance, setBuyerDistance] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [isMonitoringGeofence, setIsMonitoringGeofence] = useState(false);
  const miniMapError = false;

  const { status: geofenceStatus, distance: geofenceDist } = useGeofence({
    center: storeCenter,
    radiusMeters: 100,
    storeName: mktProduct?.storeName || 'Toko Penjual',
    enabled: isMonitoringGeofence,
    onEnter: () => {
      showToast(`Selamat datang di ${mktProduct.storeName || 'toko penjual'}!`);
    },
    onExit: () => {
      showToast(`Anda telah meninggalkan area ${mktProduct.storeName || 'toko penjual'}`);
    },
  });

  const handleCalculateDistance = useCallback(async () => {
    if (!hasStoreCoords || !storeCenter) return;
    setIsCalculatingDistance(true);
    try {
      const coords = await getCurrentCoords(false); // Balanced accuracy
      setBuyerCoords({ lat: coords.lat, lng: coords.lng });
      const dist = haversineMeters(coords, storeCenter);
      setBuyerDistance(dist);
      showToast(`Jarak ke toko: ${formatDistance(dist)}`);
    } catch (err: any) {
      Alert.alert('Gagal Mengambil Lokasi', err?.message || 'Pastikan GPS dan izin lokasi aktif.');
    } finally {
      setIsCalculatingDistance(false);
    }
  }, [hasStoreCoords, storeCenter, showToast]);

  const handleOpenDirections = useCallback(() => {
    if (storeCenter) {
      openDirectionsInMaps(storeCenter.lat, storeCenter.lng);
    }
  }, [storeCenter]);

  const handleToggleGeofence = useCallback(() => {
    setIsMonitoringGeofence((prev) => {
      const next = !prev;
      if (next) {
        showToast('Pemantauan kedatangan diaktifkan');
      } else {
        showToast('Pemantauan kedatangan dinonaktifkan');
      }
      return next;
    });
  }, [showToast]);

  const handleChatSeller = useCallback(() => {
    if (!user || !mktProduct || isOwner || !sellerId) return;
    const conversationId = getConversationId(user.uid, sellerId, mktProduct.id);
    const sName = mktProduct.sellerName || 'Peternak';
    const myName = profile?.name || user.displayName || 'Pembeli';

    closeSheet();

    // Inisialisasi percakapan dengan nama kedua belah pihak
    getOrCreateConversation({
      currentUserId: user.uid,
      currentUserName: myName,
      sellerId,
      sellerName: sName,
      productId: mktProduct.id,
      productName: mktProduct.varietas,
    }).catch((err) => {
      console.warn('[FishDetailSheet] getOrCreateConversation prefetch warning:', err);
    });

    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId,
        sellerId,
        sellerName: sName,
        currentUserName: myName,
        productId: mktProduct.id,
        productName: mktProduct.varietas,
      },
    });
  }, [user, profile, mktProduct, isOwner, sellerId, closeSheet, router]);

  const getConditionBadgeType = (kondisi: string): BadgeType => {
    if (kondisi === 'Sehat') return 'ok';
    if (kondisi === 'Sakit') return 'bad';
    return 'warn';
  };

  if (!fish) {
    return null;
  }

  const margin = (fish.hargaJual || 0) - (fish.hargaBeli || 0);

  // ── Loading state (Skeleton Detail) ────────────────────────
  if (fetchState === 'loading') {
    return <DetailSheetSkeleton />;
  }

  // ── Error state (SATU-SATUNYA tempat pesan koneksi boleh muncul) ──
  if (fetchState === 'error') {
    return (
      <View style={styles.errorWrap}>
        <Text style={[styles.errorTitle, { color: theme.ink }]}>
          Gagal memuat detail
        </Text>
        <Text style={[styles.errorDesc, { color: theme.muted }]}>
          Tidak dapat mengambil data produk. Periksa koneksi Anda, lalu coba lagi.
        </Text>
        <Button variant="pri" wide onPress={handleRetry}>
          Coba Lagi
        </Button>
      </View>
    );
  }

  // ── Normal detail view ─────────────────────────────────────
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
          {
            label: 'Peternak / Penjual',
            value: mktProduct.sellerName || 'Peternak Djekkoi',
          },
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
          <Image
            source={{ uri: fish.foto }}
            style={styles.heroImg}
            resizeMode="cover"
          />
        ) : (
          <KoiArt varietas={fish.varietas} style={styles.heroImg} />
        )}
      </View>

      <View
        style={[
          styles.kvTable,
          { backgroundColor: theme.surface, borderColor: theme.line },
        ]}
      >
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

      {/* ── Lokasi Toko Penjual (Khusus Pembeli) ── */}
      {!isOwner && hasStoreCoords && (
        <View style={[styles.storeCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={styles.storeHeader}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth={2}>
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <Circle cx={12} cy={10} r={3} />
            </Svg>
            <View style={{ flex: 1 }}>
              <Text style={[styles.storeTitle, { color: theme.ink }]}>
                {mktProduct.storeName || 'Lokasi Toko Penjual'}
              </Text>
              <Text style={[styles.storeAddress, { color: theme.muted }]} numberOfLines={2}>
                {mktProduct.storeAddress || 'Alamat tidak tersedia'}
              </Text>
            </View>
          </View>

          {/* Mini MapView */}
          <View style={[styles.miniMapWrap, { borderColor: theme.line, backgroundColor: theme.surface2 }]}>
            {!miniMapError ? (
              <MapView
                style={styles.miniMap}
                initialRegion={{
                  latitude: storeCenter!.lat,
                  longitude: storeCenter!.lng,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: storeCenter!.lat, longitude: storeCenter!.lng }}
                  title={mktProduct.storeName || 'Toko'}
                  pinColor="red"
                />
                {buyerCoords && (
                  <Marker
                    coordinate={{ latitude: buyerCoords.lat, longitude: buyerCoords.lng }}
                    title="Posisi Anda"
                    pinColor="blue"
                  />
                )}
              </MapView>
            ) : (
              <View style={styles.miniMapFallback}>
                <Text style={[styles.miniFallbackText, { color: theme.muted }]}>
                  Peta mini tidak dapat dimuat. Anda dapat membuka rute langsung di Google Maps.
                </Text>
              </View>
            )}
          </View>

          {/* Status Jarak */}
          {buyerDistance !== null && (
            <View style={[styles.distanceRow, { backgroundColor: theme.surface2 }]}>
              <Text style={[styles.distanceText, { color: theme.ink }]}>
                Jarak dari Anda:{' '}
                <Text style={{ fontFamily: FontNames.sansBold, color: theme.accent }}>
                  {formatDistance(buyerDistance)}
                </Text>
              </Text>
            </View>
          )}

          {/* Status Geofence */}
          {isMonitoringGeofence && (
            <View
              style={[
                styles.geofenceStatusWrap,
                { backgroundColor: geofenceStatus === 'inside' ? '#10b98115' : '#f59e0b15' },
              ]}
            >
              <Text
                style={[
                  styles.geofenceStatusText,
                  { color: geofenceStatus === 'inside' ? '#10b981' : '#f59e0b' },
                ]}
              >
                {geofenceStatus === 'inside'
                  ? '📍 Anda berada di area toko (≤ 100m)'
                  : `🚶 Memantau kedatangan (${formatDistance(geofenceDist ?? buyerDistance ?? 0)})`}
              </Text>
            </View>
          )}

          {/* Tombol Hitung Jarak & Petunjuk Arah */}
          <View style={styles.locationActions}>
            <Button
              variant="default"
              size="sm"
              style={styles.flexBtn}
              onPress={handleCalculateDistance}
              disabled={isCalculatingDistance}
            >
              {isCalculatingDistance ? (
                <ActivityIndicator size="small" color={theme.ink} />
              ) : (
                'Hitung Jarak'
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              style={styles.flexBtn}
              onPress={handleOpenDirections}
            >
              Petunjuk Arah
            </Button>
          </View>

          {/* Toggle Pantau Kedatangan (Geofence) */}
          <TouchableOpacity
            style={[
              styles.geofenceToggle,
              { borderColor: isMonitoringGeofence ? theme.accent : theme.line },
            ]}
            onPress={handleToggleGeofence}
          >
            <Svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke={isMonitoringGeofence ? theme.accent : theme.muted}
              strokeWidth={2}
            >
              <Circle cx={12} cy={12} r={10} />
              <Path d="M12 6v6l4 2" />
            </Svg>
            <Text
              style={[
                styles.geofenceToggleText,
                { color: isMonitoringGeofence ? theme.accent : theme.muted },
              ]}
            >
              {isMonitoringGeofence ? 'Matikan Pantau Kedatangan' : 'Pantau Kedatangan (Geofence)'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info jika Penjual Belum Mengatur Lokasi Toko */}
      {!isOwner && !hasStoreCoords && (
        <View style={[styles.noStoreCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2}>
            <Circle cx={12} cy={12} r={10} />
            <Path d="M12 8v4M12 16h.01" />
          </Svg>
          <Text style={[styles.noStoreText, { color: theme.muted }]}>
            Penjual belum mengatur lokasi toko
          </Text>
        </View>
      )}

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
                {fish.display
                  ? 'Sembunyikan dari penjualan'
                  : 'Tampilkan di penjualan'}
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
            {!isOwner && Boolean(sellerId) && (
              <Button
                variant="pri"
                wide
                onPress={handleChatSeller}
              >
                Chat Penjual
              </Button>
            )}
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
  errorWrap: {
    paddingVertical: 28,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 18,
    textAlign: 'center',
  },
  errorDesc: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
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
  storeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 14,
  },
  storeAddress: {
    fontFamily: FontNames.sansRegular,
    fontSize: 12,
    marginTop: 2,
  },
  miniMapWrap: {
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  miniMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  miniFallbackText: {
    fontFamily: FontNames.sansRegular,
    fontSize: 12,
    textAlign: 'center',
  },
  distanceRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  distanceText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
  },
  geofenceStatusWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  geofenceStatusText: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 12,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  flexBtn: {
    flex: 1,
  },
  geofenceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    gap: 6,
  },
  geofenceToggleText: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 12,
  },
  noStoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  noStoreText: {
    fontFamily: FontNames.sansRegular,
    fontSize: 12,
  },
});
