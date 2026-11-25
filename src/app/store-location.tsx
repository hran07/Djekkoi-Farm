import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import MapView, { Marker } from 'react-native-maps';

import { Button } from '@/components/Button';
import { FontNames } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useTheme } from '@/hooks/useTheme';
import {
  buildDirectionsUrl,
  geocodeAddress,
  getCurrentCoords,
  openDirectionsInMaps,
  reverseGeocode,
} from '@/lib/location';

export default function StoreLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { profile, updateStoreLocation } = useAuth();
  const { showToast } = useStore();

  const mapRef = useRef<MapView | null>(null);

  // Form states
  const [storeName, setStoreName] = useState(profile?.store?.name || profile?.name || '');
  const [address, setAddress] = useState(profile?.store?.address || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Coordinates & accuracy
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    profile?.store ? { lat: profile.store.lat, lng: profile.store.lng } : null
  );
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Loading & status states
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Debounce ref for reverse geocoding
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle reverse geocoding with debounce
  const triggerReverseGeocode = useCallback((lat: number, lng: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsGeocoding(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
      } catch (err) {
        console.warn('Gagal reverse geocode marker:', err);
      } finally {
        setIsGeocoding(false);
      }
    }, 600);
  }, []);

  // Animasi kamera peta ke koordinat
  const centerMap = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        500
      );
    }
  }, []);

  // Ambil lokasi GPS perangkat saat ini
  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getCurrentCoords(true); // High accuracy for seller
      setCoords({ lat: loc.lat, lng: loc.lng });
      setAccuracy(loc.accuracy);
      centerMap(loc.lat, loc.lng);
      triggerReverseGeocode(loc.lat, loc.lng);
      showToast('Lokasi perangkat berhasil diambil');
    } catch (err: any) {
      Alert.alert('Gagal Mendapatkan Lokasi', err?.message || 'Pastikan GPS dan izin lokasi aktif.');
    } finally {
      setIsLocating(false);
    }
  };

  // Pencarian alamat manual melalui Geocoding
  const handleSearchAddress = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      const result = await geocodeAddress(query);
      if (result) {
        setCoords({ lat: result.lat, lng: result.lng });
        setAccuracy(null);
        centerMap(result.lat, result.lng);
        triggerReverseGeocode(result.lat, result.lng);
        showToast('Lokasi ditemukan pada peta');
      } else {
        Alert.alert('Lokasi Tidak Ditemukan', 'Coba gunakan nama kota, jalan, atau patokan yang lebih spesifik.');
      }
    } catch (err: any) {
      Alert.alert('Gagal Mencari Alamat', err?.message || 'Terjadi kesalahan saat mencari alamat.');
    } finally {
      setIsSearching(false);
    }
  };

  // Perubahan posisi marker saat di-drag
  const handleMarkerDragEnd = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoords({ lat: latitude, lng: longitude });
    setAccuracy(null); // Akurasi GPS tidak berlaku setelah marker digeser manual
    triggerReverseGeocode(latitude, longitude);
  };

  // Simpan data lokasi toko
  const handleSave = async () => {
    const trimmedName = storeName.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      Alert.alert('Nama Toko Kosong', 'Harap masukkan nama toko atau nama kolam Anda.');
      return;
    }
    if (!coords) {
      Alert.alert('Posisi Toko Belum Ditentukan', 'Silakan klik tombol "Ambil Lokasi Saya" atau cari alamat toko Anda pada peta.');
      return;
    }

    setIsSaving(true);
    try {
      await updateStoreLocation({
        name: trimmedName,
        lat: coords.lat,
        lng: coords.lng,
        address: trimmedAddress || 'Alamat tidak ditentukan',
        updatedAt: new Date().toISOString(),
      });
      showToast('Lokasi toko berhasil disimpan');
      router.back();
    } catch (err: any) {
      console.error('Gagal menyimpan lokasi toko:', err);
      Alert.alert('Gagal Menyimpan', err?.message || 'Terjadi kesalahan saat menyimpan lokasi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus lokasi toko
  const handleDelete = () => {
    Alert.alert(
      'Hapus Lokasi Toko',
      'Apakah Anda yakin ingin menghapus lokasi toko? Calon pembeli tidak akan dapat melihat jarak dan petunjuk arah ke toko Anda.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await updateStoreLocation(null);
              showToast('Lokasi toko telah dihapus');
              router.back();
            } catch (err: any) {
              console.error('Gagal menghapus lokasi toko:', err);
              Alert.alert('Gagal Menghapus', err?.message || 'Terjadi kesalahan saat menghapus lokasi.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Indikator akurasi GPS
  const renderAccuracyBadge = () => {
    if (accuracy === null) return null;
    let label = 'Baik';
    let color = '#10b981';
    let bg = '#10b98120';

    if (accuracy > 100) {
      label = 'Rendah';
      color = '#ef4444';
      bg = '#ef444420';
    } else if (accuracy > 20) {
      label = 'Cukup';
      color = '#f59e0b';
      bg = '#f59e0b20';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>
          Akurasi ±{Math.round(accuracy)}m ({label})
        </Text>
      </View>
    );
  };

  const initialRegion = coords
    ? {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
    : {
        latitude: -6.2,
        longitude: 106.816666,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.line }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth={2}>
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>Lokasi Toko</Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            Atur koordinat kolam/toko Anda untuk pembeli
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Form Nama & Pencarian ── */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>NAMA TOKO / KOLAM</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface2, color: theme.ink, borderColor: theme.line }]}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Contoh: Djekkoi Farm Blitar"
            placeholderTextColor={theme.muted}
          />

          <Text style={[styles.fieldLabel, { color: theme.muted, marginTop: 12 }]}>CARI ALAMAT ATAU KOTA</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[
                styles.input,
                styles.searchInput,
                { backgroundColor: theme.surface2, color: theme.ink, borderColor: theme.line },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Ketik jalan, daerah, atau kota..."
              placeholderTextColor={theme.muted}
              onSubmitEditing={handleSearchAddress}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.searchBtn, { backgroundColor: theme.accent }]}
              onPress={handleSearchAddress}
              disabled={isSearching}
              accessibilityRole="button"
              accessibilityLabel="Cari Alamat"
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
                  <Circle cx={11} cy={11} r={8} />
                  <Path d="M21 21l-4.35-4.35" />
                </Svg>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tombol GPS & Status Koordinat ── */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={styles.locatingRow}>
            <Button
              onPress={handleGetCurrentLocation}
              disabled={isLocating}
              variant="default"
              size="sm"
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={theme.ink} />
              ) : (
                'Ambil Lokasi Saya'
              )}
            </Button>
            {renderAccuracyBadge()}
          </View>

          {coords ? (
            <View style={styles.coordsInfo}>
              <Text style={[styles.coordsText, { color: theme.ink }]}>
                Latitude: <Text style={{ fontFamily: FontNames.sansSemiBold }}>{coords.lat.toFixed(6)}</Text>
                {'  '}
                Longitude: <Text style={{ fontFamily: FontNames.sansSemiBold }}>{coords.lng.toFixed(6)}</Text>
              </Text>
              <Text style={[styles.dragTip, { color: theme.muted }]}>
                *Tip: Anda bisa menggeser marker pin pada peta di bawah ini untuk posisi yang lebih presisi.
              </Text>
            </View>
          ) : (
            <Text style={[styles.noCoordsText, { color: theme.muted }]}>
              Belum ada titik koordinat yang dipilih. Tekan tombol di atas atau cari lokasi pada peta.
            </Text>
          )}
        </View>

        {/* ── Area Peta (MapView) atau Fallback ── */}
        <View style={[styles.mapContainer, { borderColor: theme.line, backgroundColor: theme.surface }]}>
          {!mapError ? (
            <>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsMyLocationButton={false}
              >
                {coords && (
                  <Marker
                    coordinate={{ latitude: coords.lat, longitude: coords.lng }}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                    title={storeName || 'Lokasi Toko'}
                    description={address || 'Geser marker untuk menyesuaikan lokasi'}
                  />
                )}
              </MapView>

              {/* Tombol Recentering pada Peta */}
              {coords && (
                <TouchableOpacity
                  style={[styles.recenterBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
                  onPress={() => centerMap(coords.lat, coords.lng)}
                  accessibilityRole="button"
                  accessibilityLabel="Pusatkan Peta"
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth={2}>
                    <Circle cx={12} cy={12} r={10} />
                    <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </Svg>
                </TouchableOpacity>
              )}
            </>
          ) : (
            // Fallback UI jika MapView gagal render
            <View style={styles.mapFallback}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={1.5}>
                <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <Circle cx={12} cy={10} r={3} />
              </Svg>
              <Text style={[styles.fallbackTitle, { color: theme.ink }]}>Peta tidak dapat dimuat</Text>
              <Text style={[styles.fallbackSubtitle, { color: theme.muted }]}>
                Gunakan koordinat manual atau buka langsung di aplikasi Google Maps.
              </Text>
              {coords && (
                <TouchableOpacity
                  style={[styles.openMapsBtn, { backgroundColor: theme.accent }]}
                  onPress={() => openDirectionsInMaps(coords.lat, coords.lng)}
                >
                  <Text style={styles.openMapsText}>Buka di Google Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Alamat Terdeteksi ── */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={styles.addressHeader}>
            <Text style={[styles.fieldLabel, { color: theme.muted }]}>ALAMAT LENGKAP TOKO</Text>
            {isGeocoding && <ActivityIndicator size="small" color={theme.accent} />}
          </View>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.surface2, color: theme.ink, borderColor: theme.line },
            ]}
            value={address}
            onChangeText={setAddress}
            placeholder="Alamat akan terisi otomatis saat memilih titik lokasi, atau ketik secara manual..."
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── Consent & Penjelasan ── */}
        <View style={[styles.consentBox, { backgroundColor: theme.accent + '12', borderColor: theme.accent + '30' }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth={2}>
            <Circle cx={12} cy={12} r={10} />
            <Path d="M12 16v-4M12 8h.01" />
          </Svg>
          <Text style={[styles.consentText, { color: theme.ink }]}>
            Lokasi toko Anda akan ditampilkan kepada calon pembeli di Marketplace agar mereka dapat mengetahui jarak dan rute ke kolam Anda.
          </Text>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionWrap}>
          <Button
            onPress={handleSave}
            disabled={!coords || isSaving || isDeleting}
            variant="pri"
            wide
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.onAccent} />
            ) : (
              'Simpan Lokasi Toko'
            )}
          </Button>

          {profile?.store && (
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: '#ef4444' }]}
              onPress={handleDelete}
              disabled={isSaving || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text style={styles.deleteBtnText}>Hapus Lokasi Toko</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 18,
  },
  headerSubtitle: {
    fontFamily: FontNames.sansRegular,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  fieldLabel: {
    fontFamily: FontNames.sansBold,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontNames.sansRegular,
    fontSize: 14,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 11,
  },
  coordsInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000015',
  },
  coordsText: {
    fontFamily: FontNames.sansRegular,
    fontSize: 13,
  },
  dragTip: {
    fontFamily: FontNames.sansRegular,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  noCoordsText: {
    fontFamily: FontNames.sansRegular,
    fontSize: 12,
    marginTop: 8,
  },
  mapContainer: {
    height: 260,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenterBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  fallbackTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 14,
  },
  fallbackSubtitle: {
    fontFamily: FontNames.sansRegular,
    fontSize: 12,
    textAlign: 'center',
  },
  openMapsBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openMapsText: {
    color: '#fff',
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  consentText: {
    flex: 1,
    fontFamily: FontNames.sansRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  actionWrap: {
    gap: 10,
    marginTop: 8,
  },
  deleteBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontFamily: FontNames.sansSemiBold,
    fontSize: 14,
  },
});
