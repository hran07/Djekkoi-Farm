import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Fish, MarketplaceProduct } from '@/lib/types';
import { fdate, rp } from '@/lib/format';
import { getConversationId } from '@/lib/chat';
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
  const { user } = useAuth();
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
      setFish(initialFish);
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
    if (isMarketplaceItem && initialFish?.id) {
      fetchDetail({ silent: false, isRetry: false });
    }

    return () => {
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

  const handleChatSeller = useCallback(() => {
    if (!user || !mktProduct) return;
    const sellerId = mktProduct.userId || '';
    const conversationId = getConversationId(user.uid, sellerId, mktProduct.id);
    closeSheet();
    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId,
        sellerId,
        sellerName: mktProduct.sellerName || 'Peternak',
        productId: mktProduct.id,
        productName: mktProduct.varietas,
      },
    });
  }, [user, mktProduct, closeSheet, router]);

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
            <Button
              variant="pri"
              wide
              onPress={handleChatSeller}
            >
              Chat Penjual
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
});
