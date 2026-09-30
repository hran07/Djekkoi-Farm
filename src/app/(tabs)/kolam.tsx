import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { PondCard } from '@/components/PondCard';
import { FishCard } from '@/components/FishCard';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { sum } from '@/lib/format';

export default function KolamScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    state,
    activePondDetailId,
    setActivePondDetailId,
    openSheet,
  } = useStore();

  const selectedPond = state.ponds.find((p) => p.id === activePondDetailId);

  if (selectedPond) {
    const pondFishList = state.fish.filter((f) => f.kolamId === selectedPond.id);
    const totalEkor = sum(pondFishList, (f) => f.jumlah);

    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
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

          <Text style={[styles.title, { color: theme.ink }]}>{selectedPond.name}</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>
            {selectedPond.lokasi || 'Lokasi belum diisi'}. Berisi {totalEkor} ekor dari{' '}
            {pondFishList.length} kelompok.
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 110 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.ink }]}>Kolam</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>
          Ketuk kolam untuk melihat ikan di dalamnya.
        </Text>

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

      {/* FAB Button */}
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
        <Text style={[styles.fabText, { color: theme.onAccent }]}>Tambah kolam</Text>
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
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 26,
    lineHeight: 30,
    marginTop: 4,
    marginBottom: 4,
  },
  sub: {
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
