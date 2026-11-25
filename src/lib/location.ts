import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy: number | null;
}

/**
 * Memastikan izin lokasi foreground (saat aplikasi digunakan).
 * Tidak meminta izin background.
 * Jika ditolak permanen, menampilkan dialog untuk membuka pengaturan aplikasi.
 */
export async function ensureForegroundPermission(): Promise<boolean> {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) {
      return true;
    }

    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.status === Location.PermissionStatus.GRANTED) {
      return true;
    }

    if (!requested.canAskAgain || !canAskAgain) {
      Alert.alert(
        'Izin Lokasi Dibutuhkan',
        'Djekkoi Farm membutuhkan izin lokasi untuk menandai lokasi toko dan petunjuk arah. Silakan aktifkan izin lokasi di Pengaturan.',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Buka Pengaturan',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
    return false;
  } catch (err) {
    console.warn('Gagal memeriksa izin lokasi:', err);
    return false;
  }
}

// Cache in-memory koordinat sesi saat ini (tidak disimpan ke storage/Firestore demi privasi)
let cachedSessionCoords: LocationCoords | null = null;

export function getCachedSessionCoords(): LocationCoords | null {
  return cachedSessionCoords;
}

export function setCachedSessionCoords(coords: LocationCoords | null): void {
  cachedSessionCoords = coords;
}

/**
 * Mengambil koordinat perangkat saat ini.
 * Default menggunakan akurasi Balanced untuk menghemat baterai.
 * Mode penjual dapat mengaktifkan highAccuracy = true untuk presisi penandaan toko.
 */
export async function getCurrentCoords(highAccuracy: boolean = false): Promise<LocationCoords> {
  const hasPermission = await ensureForegroundPermission();
  if (!hasPermission) {
    throw new Error('Izin lokasi tidak diberikan oleh pengguna.');
  }

  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
    });

    const result: LocationCoords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
    };
    cachedSessionCoords = result;
    return result;
  } catch (err: any) {
    console.warn('Gagal mendapatkan posisi saat ini:', err);
    throw new Error('Gagal mengambil koordinat lokasi perangkat. Pastikan GPS aktif.');
  }
}

/**
 * Reverse geocoding: mengubah koordinat (lat, lng) menjadi alamat teks terbaca.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!results || results.length === 0) {
      return 'Alamat tidak ditemukan';
    }

    const first = results[0];
    const parts: string[] = [];

    // Format susunan alamat ramah pengguna Indonesia
    const street = [first.street, first.streetNumber].filter(Boolean).join(' ');
    if (street) parts.push(street);
    else if (first.name && first.name !== street) parts.push(first.name);

    if (first.district) parts.push(`Kec. ${first.district}`);
    if (first.city || first.subregion) parts.push(first.city || first.subregion || '');
    if (first.region) parts.push(first.region);
    if (first.postalCode) parts.push(first.postalCode);

    const cleanParts = parts.filter((p) => p && p.trim().length > 0);
    return cleanParts.length > 0 ? cleanParts.join(', ') : 'Alamat tidak ditemukan';
  } catch (err) {
    console.warn('Gagal reverse geocoding:', err);
    return 'Alamat tidak ditemukan';
  }
}

/**
 * Geocoding: mencari koordinat dari teks alamat/nama lokasi.
 */
export async function geocodeAddress(text: string): Promise<{ lat: number; lng: number } | null> {
  const query = text.trim();
  if (!query) return null;

  try {
    const results = await Location.geocodeAsync(query);
    if (results && results.length > 0) {
      return {
        lat: results[0].latitude,
        lng: results[0].longitude,
      };
    }
    return null;
  } catch (err) {
    console.warn('Gagal geocode address:', err);
    return null;
  }
}

/**
 * Rumus Haversine: menghitung jarak spherical lingkaran besar antara 2 koordinat (dalam meter).
 */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const deltaPhi = toRad(b.lat - a.lat);
  const deltaLambda = toRad(b.lng - a.lng);

  const sinDPhi = Math.sin(deltaPhi / 2);
  const sinDLambda = Math.sin(deltaLambda / 2);

  const aCalc =
    sinDPhi * sinDPhi +
    Math.cos(phi1) * Math.cos(phi2) * sinDLambda * sinDLambda;

  const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
  return Math.round(R * c);
}

/**
 * Format jarak numerik (meter) ke string ramah pengguna (contoh: "350 m" atau "2,4 km").
 */
export function formatDistance(meters: number): string {
  if (meters < 0) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = (meters / 1000).toFixed(1).replace('.', ',');
  return `${km} km`;
}

/**
 * Membuat tautan petunjuk arah Google Maps.
 */
export function buildDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Membuka aplikasi Google Maps atau browser ke koordinat tujuan.
 */
export async function openDirectionsInMaps(lat: number, lng: number): Promise<void> {
  const url = buildDirectionsUrl(lat, lng);
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Gagal Membuka Peta', 'Tidak dapat membuka tautan petunjuk arah.');
    }
  } catch (err) {
    console.warn('Gagal membuka url Google Maps:', err);
    Alert.alert('Gagal Membuka Peta', 'Terjadi kesalahan saat membuka petunjuk arah.');
  }
}
