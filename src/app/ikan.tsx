import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { Chip } from '@/components/Chip';
import { FishCard } from '@/components/FishCard';
import { EmptyState } from '@/components/EmptyState';

export default function IkanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    state,
    searchQuery,
    setSearchQuery,
    pondFilter,
    setPondFilter,
    openSheet,
  } = useStore();

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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 110 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.ink }]}>Data ikan</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>
          Semua ikan yang ada di kolam kamu.
        </Text>

        {/* Search Input */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2} strokeLinecap="round">
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

        {/* Pond Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
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

      {/* FAB Button */}
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
        <Text style={[styles.fabText, { color: theme.onAccent }]}>Tambah ikan</Text>
      </TouchableOpacity>
    </View>
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
  list: {
    gap: 4,
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
