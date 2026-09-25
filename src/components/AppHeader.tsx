import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
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
        <View style={styles.brand}>
          <Logo size={38} />
          <View style={styles.titleBox}>
            <Text style={[styles.title, { color: theme.ink }]}>Djekkoi Farm</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{todayStr}</Text>
          </View>
        </View>

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
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth={2} strokeLinecap="round">
            <Circle cx={5} cy={12} r={1.2} fill={theme.ink} />
            <Circle cx={12} cy={12} r={1.2} fill={theme.ink} />
            <Circle cx={19} cy={12} r={1.2} fill={theme.ink} />
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
  titleBox: {
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 22,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
    marginTop: 1,
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
