import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { TabIcon, TabIconName } from './TabIcon';
import { useStore } from '@/context/StoreContext';

interface TabItemConfig {
  name: string;
  label: string;
  iconName: TabIconName;
}

const TAB_CONFIGS: TabItemConfig[] = [
  { name: 'marketplace', label: 'Marketplace', iconName: 'marketplace' },
  { name: 'index', label: 'Dashboard', iconName: 'dashboard' },
  { name: 'stock', label: 'Stock', iconName: 'kelola' },
  { name: 'account', label: 'Akun', iconName: 'account' },
];

// Hanya tampilkan 4 tab yang dikonfigurasi
const VISIBLE_TAB_NAMES = new Set(TAB_CONFIGS.map((c) => c.name));

export const CustomTabBar: React.FC<any> = ({ state, navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setActivePondDetailId } = useStore();

  // Filter hanya route yang ada di TAB_CONFIGS
  const visibleRoutes = state.routes.filter((r: any) => VISIBLE_TAB_NAMES.has(r.name));

  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: bottomPad },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
            shadowColor: theme.ink,
          },
        ]}
      >
        {visibleRoutes.map((route: any) => {
          const isFocused = state.routes[state.index]?.name === route.name;
          const config = TAB_CONFIGS.find((c) => c.name === route.name)!;
          const color = isFocused ? theme.accent : theme.muted;

          const onPress = () => {
            setActivePondDetailId(null);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabButton}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.label}
              activeOpacity={0.7}
            >
              {/* Active background pill */}
              {isFocused && (
                <View
                  style={[
                    styles.activePill,
                    { backgroundColor: theme.accentSoft },
                  ]}
                />
              )}

              {/* Icon wrapper with scale effect */}
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <TabIcon name={config.iconName} color={color} size={isFocused ? 22 : 21} />
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.tabLabel,
                  { color },
                  isFocused && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    zIndex: 30,
    pointerEvents: 'box-none',
  } as any,
  bar: {
    flexDirection: 'row',
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    // Shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
    position: 'relative',
    borderRadius: 22,
    minHeight: 56,
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapActive: {
    transform: [{ scale: 1.08 }],
  },
  tabLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontFamily: FontNames.sansSemiBold,
  },
});


