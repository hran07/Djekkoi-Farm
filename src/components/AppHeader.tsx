import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Logo } from './Logo';
import { ftodayWithDay } from '@/lib/format';
import { useStore } from '@/context/StoreContext';

export const AppHeader: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { openSheet } = useStore();

  const todayStr = ftodayWithDay();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg,
          borderBottomColor: theme.line,
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Brand */}
        <View style={styles.brand}>
          <View style={[styles.logoWrap, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <Logo size={28} />
          </View>
          <View style={styles.titleBox}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.ink }]}>Djekkoi</Text>
              <Text style={[styles.titleAccent, { color: theme.accent }]}> Farm</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{todayStr}</Text>
          </View>
        </View>

        {/* Settings button */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.line,
            },
          ]}
          onPress={() => openSheet('settings')}
          accessibilityRole="button"
          accessibilityLabel="Pengaturan"
          activeOpacity={0.7}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {/* Settings/sliders icon */}
            <Line x1={4} y1={6} x2={20} y2={6} />
            <Line x1={4} y1={12} x2={20} y2={12} />
            <Line x1={4} y1={18} x2={20} y2={18} />
            <Circle cx={9} cy={6} r={2.2} fill={theme.bg} stroke={theme.ink} strokeWidth={1.8} />
            <Circle cx={16} cy={12} r={2.2} fill={theme.bg} stroke={theme.ink} strokeWidth={1.8} />
            <Circle cx={11} cy={18} r={2.2} fill={theme.bg} stroke={theme.ink} strokeWidth={1.8} />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    zIndex: 20,
  },
  inner: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    fontFamily: FontNames.sansBold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  titleAccent: {
    fontFamily: FontNames.sansBold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
    marginTop: 1,
    letterSpacing: 0.1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


