import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Logo } from './Logo';
import { ftodayWithDay } from '@/lib/format';

export const AppHeader: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

        {/* Chat button */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.line,
            },
          ]}
          onPress={() => router.push('/chat' as any)}
          accessibilityRole="button"
          accessibilityLabel="Chat"
          activeOpacity={0.7}
        >
          <Svg
            width={19}
            height={19}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.ink}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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


