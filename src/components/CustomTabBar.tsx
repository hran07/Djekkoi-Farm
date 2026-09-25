import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  { name: 'index', label: 'Dashboard', iconName: 'dashboard' },
  { name: 'ikan', label: 'Ikan', iconName: 'ikan' },
  { name: 'kolam', label: 'Kolam', iconName: 'kolam' },
  { name: 'penjualan', label: 'Penjualan', iconName: 'penjualan' },
  { name: 'riwayat', label: 'Riwayat', iconName: 'riwayat' },
];

export const CustomTabBar: React.FC<any> = ({ state, navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setActivePondDetailId } = useStore();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.line,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      <View style={styles.tabGrid}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIGS.find((c) => c.name === route.name) || {
            name: route.name,
            label: route.name,
            iconName: 'dashboard' as TabIconName,
          };

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

          const color = isFocused ? theme.accent : theme.muted;

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabButton}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.label}
            >
              {isFocused && (
                <View style={[styles.indicator, { backgroundColor: theme.accent }]} />
              )}
              <TabIcon name={config.iconName} color={color} size={23} />
              <Text style={[styles.tabLabel, { color }]}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    zIndex: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabGrid: {
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    paddingTop: 9,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: '44%',
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabLabel: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 11.5,
    lineHeight: 14,
  },
});
