import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';

// ──────────────────────────────────────────────
// Marketplace — Belum terhubung ke Firestore
// Data real akan ditambahkan di sprint berikutnya
// ──────────────────────────────────────────────

export default function MarketplaceScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ─── */}
        <Text style={[styles.title, { color: theme.ink }]}>Marketplace</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>
          Temukan ikan koi terbaik dari peternak Djekkoi.
        </Text>

        {/* ── Search Bar ─── */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
            stroke={theme.muted} strokeWidth={2} strokeLinecap="round">
            <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
            style={[styles.searchInput, { color: theme.ink }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Cari varietas, asal, atau grade..."
            placeholderTextColor={theme.muted}
          />
          {Boolean(query) && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Text style={{ color: theme.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Segera Hadir Banner ─── */}
        <View style={[styles.comingSoonCard, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <View style={[styles.comingSoonIcon, { backgroundColor: theme.accent }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"
              stroke={theme.onAccent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <Line x1={3} y1={6} x2={21} y2={6} />
              <Path d="M16 10a4 4 0 01-8 0" />
            </Svg>
          </View>
          <Text style={[styles.comingSoonTitle, { color: theme.accent }]}>
            Marketplace Segera Hadir
          </Text>
          <Text style={[styles.comingSoonDesc, { color: theme.muted }]}>
            Fitur jual-beli ikan antar peternak Djekkoi sedang dalam pengembangan.
            Pantau terus update-nya!
          </Text>
        </View>

        {/* ── Fitur yang akan datang ─── */}
        <Text style={[styles.featuresTitle, { color: theme.ink }]}>
          Yang akan tersedia:
        </Text>
        {[
          {
            icon: (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={theme.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </Svg>
            ),
            text: 'Cari ikan berdasarkan varietas & grade',
          },
          {
            icon: (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={theme.ok} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={12} r={10} />
                <Path d="M9 12l2 2 4-4" />
              </Svg>
            ),
            text: 'Verifikasi penjual terpercaya',
          },
          {
            icon: (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={theme.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </Svg>
            ),
            text: 'Rating dan ulasan penjual',
          },
          {
            icon: (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={theme.red} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
              </Svg>
            ),
            text: 'Wishlist ikan favorit',
          },
        ].map((item, i) => (
          <View
            key={i}
            style={[
              styles.featureRow,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            {item.icon}
            <Text style={[styles.featureText, { color: theme.ink }]}>{item.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  title: {
    fontFamily: FontNames.sansBold,
    fontSize: 26,
    lineHeight: 30,
    marginTop: 6,
    marginBottom: 4,
  },
  sub: { fontFamily: FontNames.sansMedium, fontSize: 14, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontFamily: FontNames.sansMedium, fontSize: 14.5 },
  // Coming soon card
  comingSoonCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  comingSoonIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 20,
    textAlign: 'center',
  },
  comingSoonDesc: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  // Features list
  featuresTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 15,
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },
  featureText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    flex: 1,
  },
});
