import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { FontNames, LOW } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { PondHero } from '@/components/PondHero';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { fdate, rp, sum } from '@/lib/format';

export default function DashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, periodFilter, setPeriodFilter, getPondName } = useStore();

  const DAY_MS = 86400000;

  // Filter history by period
  const inPeriod = (ts: string) => {
    if (periodFilter === 0) return true;
    const diff = Date.now() - new Date(ts).getTime();
    return diff <= periodFilter * DAY_MS;
  };

  const periodHistory = state.history.filter((h) => inPeriod(h.ts));
  const masukCount = sum(
    periodHistory.filter((h) => h.tipe === 'masuk'),
    (h) => h.jumlah || 0
  );

  const keluarList = periodHistory.filter((h) => h.tipe === 'keluar');
  const soldList = keluarList.filter((h) => h.tujuan === 'terjual');
  const keluarCount = sum(keluarList, (h) => h.jumlah || 0);
  const soldCount = sum(soldList, (h) => h.jumlah || 0);
  const movedCount = keluarCount - soldCount;

  const omzet = sum(soldList, (h) => (h.sale?.harga || 0) * (h.jumlah || 0));
  const laba = sum(
    soldList,
    (h) => ((h.sale?.harga || 0) - (h.sale?.beli || 0)) * (h.jumlah || 0)
  );

  const totalFish = sum(state.fish, (f) => f.jumlah);
  const totalStockValue = sum(state.fish, (f) => f.jumlah * f.hargaJual);
  const uniqueVarieties = new Set(state.fish.map((f) => f.varietas)).size;
  const occupiedPondsCount = state.ponds.filter((p) =>
    state.fish.some((f) => f.kolamId === p.id)
  ).length;

  const periodLabelMap: Record<number, string> = {
    1: 'hari ini',
    7: '7 hari terakhir',
    30: '30 hari terakhir',
    0: 'seluruh waktu',
  };
  const periodLabel = periodLabelMap[periodFilter] || '30 hari terakhir';

  // Stock alerts
  const alerts: { type: 'warn' | 'bad' | 'ok'; icon: string; text: string }[] = [];

  const byVariety: Record<string, number> = {};
  state.fish.forEach((f) => {
    byVariety[f.varietas] = (byVariety[f.varietas] || 0) + f.jumlah;
  });

  Object.keys(byVariety).forEach((v) => {
    if (byVariety[v] <= LOW) {
      alerts.push({
        type: 'warn',
        icon: '⚠️',
        text: `Stok ${v} menipis, tersisa ${byVariety[v]} ekor.`,
      });
    }
  });

  state.fish.forEach((f) => {
    const pondName = getPondName(f.kolamId);
    if (f.kondisi === 'Sakit') {
      alerts.push({
        type: 'bad',
        icon: '🔴',
        text: `${f.jumlah} ekor ${f.varietas} berstatus sakit di ${pondName}.`,
      });
    } else if (f.kondisi === 'Karantina') {
      alerts.push({
        type: 'warn',
        icon: '🟡',
        text: `${f.jumlah} ekor ${f.varietas} masih karantina di ${pondName}.`,
      });
    }
  });

  state.ponds.forEach((p) => {
    const hasFishInPond = state.fish.some((f) => f.kolamId === p.id);
    if (!hasFishInPond) {
      alerts.push({
        type: 'warn',
        icon: '💧',
        text: `${p.name} sedang kosong.`,
      });
    }
  });

  // Recent 5 sales
  const recentSales = state.history.filter((h) => h.tujuan === 'terjual').slice(0, 5);

  // Pond fish distribution max for bar chart
  const maxPondFishCount = Math.max(
    1,
    ...state.ponds.map((p) =>
      sum(
        state.fish.filter((f) => f.kolamId === p.id),
        (f) => f.jumlah
      )
    )
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 110 + Math.max(insets.bottom, 12) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Banner */}
      <PondHero
        totalFish={totalFish}
        totalVarieties={uniqueVarieties}
        totalPonds={state.ponds.length}
        totalStockValue={totalStockValue}
      />

      {/* Period Selector Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {[
          [1, 'Hari ini'],
          [7, '7 hari'],
          [30, '30 hari'],
          [0, 'Semua'],
        ].map(([val, label]) => (
          <Chip
            key={val}
            label={label as string}
            active={periodFilter === val}
            onPress={() => setPeriodFilter(val as number)}
          />
        ))}
      </ScrollView>

      {/* 2x2 Grid Tiles */}
      <View style={styles.pairGrid}>
        <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.tileTitle, { color: theme.muted }]}>🏊 Total kolam</Text>
          <Text style={[styles.tileNum, { color: theme.ink }]}>{state.ponds.length}</Text>
          <Text style={[styles.tileSub, { color: theme.muted }]}>
            {occupiedPondsCount} terisi
          </Text>
        </View>

        <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.tileTitle, { color: theme.muted }]}>📥 Ikan masuk</Text>
          <Text style={[styles.tileNum, { color: theme.ink }]}>{masukCount}</Text>
          <Text style={[styles.tileSub, { color: theme.muted }]}>{periodLabel}</Text>
        </View>

        <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.tileTitle, { color: theme.muted }]}>📤 Ikan keluar</Text>
          <Text style={[styles.tileNum, { color: theme.ink }]}>{keluarCount}</Text>
          <Text style={[styles.tileSub, { color: theme.muted }]}>
            {soldCount} terjual, {movedCount} pindah kolam
          </Text>
        </View>

        <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.tileTitle, { color: theme.muted }]}>Estimasi laba kotor</Text>
          <Text style={[styles.tileNumSmall, { color: theme.ink }]}>{rp(laba)}</Text>
          <Text style={[styles.tileSub, { color: theme.muted }]}>dari harga beli</Text>
        </View>
      </View>

      {/* Red Sales Ribbon */}
      <View style={[styles.ribbon, { backgroundColor: theme.red }]}>
        <View>
          <Text style={styles.ribbonSmall}>💰 Total penjualan, {periodLabel}</Text>
          <Text style={styles.ribbonNum}>{rp(omzet)}</Text>
        </View>
        <View style={styles.ribbonRight}>
          <Text style={styles.ribbonSmall}>{soldList.length} transaksi</Text>
          <Text style={styles.ribbonSmall}>{soldCount} ekor terjual</Text>
        </View>
      </View>

      {/* Stock Information Section */}
      <Text style={[styles.secTitle, { color: theme.ink }]}>⚠️ Informasi stok</Text>
      <View style={styles.alertsContainer}>
        {alerts.length > 0 ? (
          alerts.map((a, i) => (
            <View
              key={i}
              style={[
                styles.alertCard,
                a.type === 'bad'
                  ? { backgroundColor: theme.badSoft }
                  : a.type === 'warn'
                  ? { backgroundColor: theme.goldSoft }
                  : { backgroundColor: theme.okSoft },
              ]}
            >
              <Text style={styles.alertIcon}>{a.icon}</Text>
              <Text style={[styles.alertText, { color: theme.ink }]}>{a.text}</Text>
            </View>
          ))
        ) : (
          <View style={[styles.alertCard, { backgroundColor: theme.okSoft }]}>
            <Text style={styles.alertIcon}>✅</Text>
            <Text style={[styles.alertText, { color: theme.ink }]}>Semua stok aman.</Text>
          </View>
        )}
      </View>

      {/* Recent Transactions Summary */}
      <Text style={[styles.secTitle, { color: theme.ink }]}>📊 Ringkasan transaksi</Text>
      {recentSales.length > 0 ? (
        <View style={[styles.trxBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          {recentSales.map((h, idx) => (
            <View
              key={h.id}
              style={[
                styles.trxItem,
                {
                  borderBottomColor: theme.line,
                  borderBottomWidth: idx === recentSales.length - 1 ? 0 : 1,
                },
              ]}
            >
              <View style={styles.trxLeft}>
                <Text style={[styles.trxBuyer, { color: theme.ink }]}>
                  {h.sale?.pembeli || 'Tanpa nama'}
                </Text>
                <Text style={[styles.trxSub, { color: theme.muted }]}>
                  {h.jumlah} ekor {h.ikan}
                </Text>
                <Text style={[styles.trxSub, { color: theme.muted }]}>
                  {fdate(h.ts)}, {h.sale?.metode}
                </Text>
              </View>
              <Text style={[styles.trxPrice, { color: theme.red }]}>
                {rp((h.sale?.harga || 0) * (h.jumlah || 1))}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          title="Belum ada penjualan"
          description="Penjualan yang kamu catat akan muncul di sini."
        />
      )}

      {/* Pond Distribution Bar Chart */}
      <Text style={[styles.secTitle, { color: theme.ink }]}>Sebaran ikan per kolam</Text>
      <View style={styles.barsContainer}>
        {state.ponds.map((p) => {
          const count = sum(
            state.fish.filter((f) => f.kolamId === p.id),
            (f) => f.jumlah
          );
          const percent = Math.round((count / maxPondFishCount) * 100);

          return (
            <View key={p.id} style={styles.barRow}>
              <Text style={[styles.barName, { color: theme.ink }]} numberOfLines={1}>
                {p.name}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: theme.surface2 }]}>
                <View
                  style={[
                    styles.barFill,
                    { backgroundColor: theme.accent, width: `${percent}%` },
                  ]}
                />
              </View>
              <Text style={[styles.barCount, { color: theme.ink }]}>{count}</Text>
            </View>
          );
        })}
      </View>
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
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pairGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  tile: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  tileTitle: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13.5,
  },
  tileNum: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 32,
    lineHeight: 36,
    marginVertical: 2,
  },
  tileNumSmall: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 24,
    lineHeight: 30,
    marginVertical: 4,
  },
  tileSub: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12.5,
  },
  ribbon: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ribbonSmall: {
    color: '#ffffff',
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13,
    opacity: 0.9,
  },
  ribbonNum: {
    color: '#ffffff',
    fontFamily: FontNames.serifExtraBold,
    fontSize: 34,
    lineHeight: 38,
    marginTop: 2,
  },
  ribbonRight: {
    alignItems: 'flex-end',
  },
  secTitle: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 19,
    marginTop: 20,
    marginBottom: 10,
  },
  alertsContainer: {
    gap: 8,
  },
  alertCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertIcon: {
    fontSize: 15,
  },
  alertText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  trxBox: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  trxItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  trxLeft: {
    flex: 1,
  },
  trxBuyer: {
    fontFamily: FontNames.sansBold,
    fontSize: 14.5,
  },
  trxSub: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12.5,
    marginTop: 1,
  },
  trxPrice: {
    fontFamily: FontNames.serifBold,
    fontSize: 16,
  },
  barsContainer: {
    gap: 8,
    marginVertical: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barName: {
    width: 110,
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  barCount: {
    width: 34,
    fontFamily: FontNames.sansBold,
    fontSize: 13.5,
    textAlign: 'right',
  },
});
