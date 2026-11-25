import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { ensureForegroundPermission, haversineMeters } from '@/lib/location';

export type GeofenceStatus = 'inside' | 'outside' | 'unknown';

interface UseGeofenceOptions {
  center: { lat: number; lng: number } | null;
  radiusMeters?: number; // Default 100 meter
  storeName?: string;
  enabled?: boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

/**
 * useGeofence
 *
 * Menerapkan monitoring geofencing hemat baterai di foreground sesuai materi Week 10:
 *
 * MENGAPA TIDAK MENGGUNAKAN Location.startGeofencingAsync?
 * 1. Location.startGeofencingAsync memerlukan izin lokasi latar belakang (ACCESS_BACKGROUND_LOCATION)
 *    yang ketat di Google Play Store dan Apple App Store serta memerlukan TaskManager di root file.
 * 2. Fitur "Pantau Kedatangan" di Djekkoi Farm diperuntukkan bagi pembeli yang sedang dalam perjalanan
 *    dan membuka aplikasi/halaman detail toko.
 * 3. Oleh karena itu, kita menggunakan Location.watchPositionAsync foreground dengan akurasi Balanced,
 *    distanceInterval 25 meter, dan timeInterval 10 detik.
 *
 * OPTIMASI BATERAI:
 * 1. Hanya aktif ketika opsi `enabled === true`.
 * 2. Unsubscribe secara otomatis saat komponen unmount atau `enabled` false.
 * 3. Terintegrasi dengan AppState: jika aplikasi beralih ke background/inactive, pemantauan
 *    dihentikan sementara dan disambung kembali saat aplikasi aktif kembali.
 * 4. Menerapkan Histeresis:
 *    - Masuk radius: jarak <= radius (contoh: 100 m)
 *    - Keluar radius: jarak > radius * 1.2 (contoh: 120 m)
 *    Histeresis mencegah alert berulang akibat fluktuasi/noise sinyal GPS di perbatasan radius.
 */
export function useGeofence({
  center,
  radiusMeters = 100,
  storeName = 'Toko',
  enabled = false,
  onEnter,
  onExit,
}: UseGeofenceOptions) {
  const [status, setStatus] = useState<GeofenceStatus>('unknown');
  const [distance, setDistance] = useState<number | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const statusRef = useRef<GeofenceStatus>('unknown');
  const appStateRef = useRef<AppStateStatus>((AppState.currentState as AppStateStatus) || 'active');

  // Keep callback refs updated to avoid re-subscribing on function identity changes
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    let isCancelled = false;

    const stopWatching = () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      setIsWatching(false);
    };

    const startWatching = async () => {
      if (!enabled || !center || !center.lat || !center.lng) {
        stopWatching();
        return;
      }

      const hasPerm = await ensureForegroundPermission();
      if (!hasPerm || isCancelled) {
        stopWatching();
        return;
      }

      // Stop previous subscription before creating a new one
      stopWatching();

      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced, // Hemat baterai
            distanceInterval: 25, // Update hanya saat berpindah minimal 25 meter
            timeInterval: 10000, // Minimal 10 detik per interval
          },
          (loc) => {
            if (isCancelled || !center) return;

            const currentCoord = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            };

            const dist = haversineMeters(currentCoord, center);
            setDistance(dist);

            const prevStatus = statusRef.current;
            const exitThreshold = radiusMeters * 1.2; // Histeresis buffer 20%

            if (dist <= radiusMeters) {
              if (prevStatus !== 'inside') {
                statusRef.current = 'inside';
                setStatus('inside');
                onEnterRef.current?.();
              }
            } else if (dist > exitThreshold) {
              if (prevStatus === 'inside') {
                statusRef.current = 'outside';
                setStatus('outside');
                onExitRef.current?.();
              } else if (prevStatus === 'unknown') {
                statusRef.current = 'outside';
                setStatus('outside');
              }
            }
          }
        );

        if (isCancelled) {
          sub.remove();
        } else {
          subscriptionRef.current = sub;
          setIsWatching(true);
        }
      } catch (err) {
        console.warn('Gagal memulai watchPosition geofence:', err);
        stopWatching();
      }
    };

    if (enabled && center) {
      startWatching();
    } else {
      stopWatching();
      setStatus('unknown');
      setDistance(null);
    }

    // Handle AppState: jeda pemantauan saat app background
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/active/) &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // App beralih ke background -> hentikan GPS untuk hemat baterai
        stopWatching();
      } else if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        enabled &&
        center
      ) {
        // App kembali aktif -> lanjutkan pemantauan
        startWatching();
      }
      appStateRef.current = nextAppState;
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isCancelled = true;
      stopWatching();
      appStateSub.remove();
    };
  }, [enabled, center?.lat, center?.lng, radiusMeters]);

  return {
    status,
    distance,
    isWatching,
  };
}
