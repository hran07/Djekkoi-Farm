import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { FishCard } from '@/components/FishCard';
import { PondCard } from '@/components/PondCard';
import { EmptyState } from '@/components/EmptyState';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { sum } from '@/lib/format';

type ActiveTab = 'kolam' | 'ikan';

// ──────────────────────────────────────────────
// Sub-komponen: Konten "Kolam Saya"
// ──────────────────────────────────────────────
function KolamContent() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, activePondDetailId, setActivePondDetailId, openSheet } =
    useStore();

  const selectedPond = state.ponds.find((p) => p.id === activePondDetailId);

  if (selectedPond) {
    const pondFishList = state.fish.filter(
      (f) => f.kolamId === selectedPond.id
    );
    const totalEkor = sum(pondFishList, (f) => f.jumlah);

    return (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Button
          variant="ghost"
          size="sm"
          style={styles.backBtn}
          onPress={() => setActivePondDetailId(null)}
        >
          ← Semua kolam
        </Button>

        <Text style={[styles.sectionTitle, { color: theme.ink }]}>
          {selectedPond.name}
        </Text>
        <Text style={[styles.sectionSub, { color: theme.muted }]}>
          {selectedPond.lokasi || 'Lokasi belum diisi'}. Berisi {totalEkor} ekor
          dari {pondFishList.length} kelompok.
        </Text>

        <View style={styles.actionRow}>
          <Button
            variant="default"
            style={styles.actionBtn}
            onPress={() => openSheet('editPond', selectedPond)}
          >
            Edit kolam
          </Button>
          <Button
            variant="pri"
            style={styles.actionBtn}
            onPress={() => openSheet('addFish', { pondId: selectedPond.id })}
          >
            Tambah ikan
          </Button>
          <Button
            variant="ghost"
            style={styles.actionBtn}
            onPress={() => openSheet('deletePond', selectedPond)}
          >
            Hapus
          </Button>
        </View>

        {pondFishList.length > 0 ? (
          <View style={styles.list}>
            {pondFishList.map((f) => (
              <FishCard key={f.id} fish={f} />
            ))}
          </View>
        ) : (
          <EmptyState
            title="Kolam ini kosong"
            description="Tambah ikan baru atau pindahkan dari kolam lain."
          />
        )}
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {state.ponds.length > 0 ? (
          <View style={styles.list}>
            {state.ponds.map((p) => (
              <PondCard
                key={p.id}
                pond={p}
                onPress={() => setActivePondDetailId(p.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="Belum ada kolam"
            description="Tambah kolam pertama kamu."
          />
        )}
      </ScrollView>

      {/* FAB Tambah Kolam */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.accent,
            bottom: 72 + Math.max(insets.bottom, 12),
          },
        ]}
        onPress={() => openSheet('addPond')}
        accessibilityRole="button"
        accessibilityLabel="Tambah kolam"
      >
        <Text style={[styles.fabPlus, { color: theme.onAccent }]}>+</Text>
        <Text style={[styles.fabText, { color: theme.onAccent }]}>
          Tambah kolam
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ──────────────────────────────────────────────
// Sub-komponen: Konten "Ikan Saya"
// ──────────────────────────────────────────────
function IkanContent() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, searchQuery, setSearchQuery, pondFilter, setPondFilter, openSheet } =
    useStore();

  const q = searchQuery.toLowerCase().trim();
  const filteredFish = state.fish.filter((f) => {
    const matchesPond = pondFilter === 'all' || f.kolamId === pondFilter;
    const matchesQuery =
      !q ||
      `${f.varietas} ${f.asal} ${f.catatan} ${f.grade}`
        .toLowerCase()
        .includes(q);
    return matchesPond && matchesQuery;
  });

  const isTotalEmpty = state.fish.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Input */}
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
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari jenis, asal, atau catatan"
            placeholderTextColor={theme.muted}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <Text style={{ color: theme.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pond Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
        >
          <Chip
            label="Semua kolam"
            active={pondFilter === 'all'}
            onPress={() => setPondFilter('all')}
          />
          {state.ponds.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              active={pondFilter === p.id}
              onPress={() => setPondFilter(p.id)}
            />
          ))}
        </ScrollView>

        {/* Fish List / Empty State */}
        {filteredFish.length > 0 ? (
          <View style={styles.list}>
            {filteredFish.map((f) => (
              <FishCard key={f.id} fish={f} />
            ))}
          </View>
        ) : isTotalEmpty ? (
          <EmptyState
            title="Belum ada ikan"
            description="Tambah kolam dulu, lalu tambah ikan pertama kamu."
          />
        ) : (
          <EmptyState
            title="Tidak ada ikan yang cocok"
            description="Tambah ikan baru atau ubah filter."
          />
        )}
      </ScrollView>

      {/* FAB Tambah Ikan */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.accent,
            bottom: 72 + Math.max(insets.bottom, 12),
          },
        ]}
        onPress={() => openSheet('addFish')}
        accessibilityRole="button"
        accessibilityLabel="Tambah ikan"
      >
        <Text style={[styles.fabPlus, { color: theme.onAccent }]}>+</Text>
        <Text style={[styles.fabText, { color: theme.onAccent }]}>
          Tambah ikan
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ──────────────────────────────────────────────
// Main: Halaman Kelola
// ──────────────────────────────────────────────
export default function KelolaScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('kolam');

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Page Title */}
      <View style={[styles.pageHeader, { borderBottomColor: theme.line }]}>
        <Text style={[styles.pageTitle, { color: theme.ink }]}>Kelola</Text>

        {/* Toggle Sub-Navbar */}
        <View
          style={[styles.toggleWrap, { backgroundColor: theme.surface2 }]}
        >
          {(['kolam', 'ikan'] as ActiveTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'kolam' ? 'Kolam Saya' : 'Ikan Saya';
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.toggleBtn,
                  isActive && {
                    backgroundColor: theme.accent,
                    shadowColor: theme.accent,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 3,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: isActive ? theme.onAccent : theme.muted },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'kolam' ? <KolamContent /> : <IkanContent />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  pageTitle: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 26,
    lineHeight: 30,
  },
  toggleWrap: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 14,
  },
  // Shared scroll content styles
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionTitle: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  list: {
    gap: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontNames.sansMedium,
    fontSize: 14.5,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 25,
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0a1e3c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  },
  fabPlus: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
  },
  fabText: {
    fontFamily: FontNames.sansBold,
    fontSize: 14.5,
  },
});
