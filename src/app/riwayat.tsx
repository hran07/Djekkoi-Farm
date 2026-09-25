import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { Chip } from '@/components/Chip';
import { HistoryItem } from '@/components/HistoryItem';
import { EmptyState } from '@/components/EmptyState';
import { fdate } from '@/lib/format';
import { HistoryEntry } from '@/lib/types';

export default function RiwayatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, historyFilter, setHistoryFilter } = useStore();

  const filteredHistory = state.history.filter((h) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'edit') return h.tipe === 'edit_ikan' || h.tipe === 'edit_kolam';
    return h.tipe === historyFilter;
  });

  // Group by date
  const groupedEntries: { dateStr: string; items: HistoryEntry[] }[] = [];
  let currentDate = '';
  let currentGroup: HistoryEntry[] = [];

  filteredHistory.forEach((h) => {
    const dateStr = fdate(h.ts);
    if (dateStr !== currentDate) {
      if (currentGroup.length > 0) {
        groupedEntries.push({ dateStr: currentDate, items: currentGroup });
      }
      currentDate = dateStr;
      currentGroup = [h];
    } else {
      currentGroup.push(h);
    }
  });

  if (currentGroup.length > 0) {
    groupedEntries.push({ dateStr: currentDate, items: currentGroup });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 110 + Math.max(insets.bottom, 12) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.ink }]}>Riwayat</Text>
      <Text style={[styles.sub, { color: theme.muted }]}>
        Catatan ikan masuk, keluar, dan perubahan data.
      </Text>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {[
          ['all', 'Semua'],
          ['masuk', 'Masuk'],
          ['keluar', 'Keluar'],
          ['edit', 'Perubahan'],
        ].map(([key, label]) => (
          <Chip
            key={key}
            label={label}
            active={historyFilter === key}
            onPress={() => setHistoryFilter(key)}
          />
        ))}
      </ScrollView>

      {/* Grouped History List / Empty State */}
      {groupedEntries.length > 0 ? (
        groupedEntries.map((group) => (
          <View key={group.dateStr} style={styles.groupContainer}>
            <Text style={[styles.dayTitle, { color: theme.muted }]}>{group.dateStr}</Text>
            {group.items.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </View>
        ))
      ) : (
        <EmptyState
          title="Belum ada catatan"
          description="Riwayat terisi otomatis saat kamu mengubah data."
        />
      )}
    </ScrollView>
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
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  groupContainer: {
    marginBottom: 12,
  },
  dayTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 13.5,
    marginTop: 10,
    marginBottom: 6,
  },
});
