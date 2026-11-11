import { FontNames } from "@/constants/theme";
import { useStore } from "@/context/StoreContext";
import { useTheme } from "@/hooks/useTheme";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabIcon, TabIconName } from "./TabIcon";

interface TabItemConfig {
  name: string;
  href: string;
  label: string;
  iconName: TabIconName;
}

const TAB_CONFIGS: TabItemConfig[] = [
  {
    name: "marketplace",
    href: "/(tabs)/marketplace",
    label: "Marketplace",
    iconName: "marketplace",
  },
  { name: "index", href: "/(tabs)", label: "Dashboard", iconName: "dashboard" },
  { name: "stock", href: "/(tabs)/stock", label: "Stock", iconName: "kelola" },
  {
    name: "account",
    href: "/(tabs)/account",
    label: "Akun",
    iconName: "account",
  },
];

export const CustomTabBar: React.FC<any> = ({ state, navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setActivePondDetailId } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const bottomPad = Math.max(insets.bottom, 8);

  const checkIsFocused = (config: TabItemConfig) => {
    if (state?.routes && typeof state.index === "number") {
      return state.routes[state.index]?.name === config.name;
    }
    if (config.name === "index") {
      return (
        pathname === "/" || pathname === "/(tabs)" || pathname === "/index"
      );
    }
    return (
      pathname === `/${config.name}` || pathname === `/(tabs)/${config.name}`
    );
  };

  return (
    <View
      style={[styles.wrapper, { paddingBottom: bottomPad }]}
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
        {TAB_CONFIGS.map((config) => {
          const isFocused = checkIsFocused(config);
          const color = isFocused ? theme.accent : theme.muted;

          const onPress = () => {
            setActivePondDetailId(null);
            if (isFocused) return;

            if (navigation?.emit && navigation?.navigate) {
              const route = state?.routes?.find(
                (r: any) => r.name === config.name,
              );
              const event = navigation.emit({
                type: "tabPress",
                target: route?.key,
                canPreventDefault: true,
              });
              if (!event?.defaultPrevented) {
                navigation.navigate(config.name);
              }
            } else {
              router.push(config.href as any);
            }
          };

          return (
            <TouchableOpacity
              key={config.name}
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
              <View
                style={[styles.iconWrap, isFocused && styles.iconWrapActive]}
              >
                <TabIcon
                  name={config.iconName}
                  color={color}
                  size={isFocused ? 22 : 21}
                />
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    zIndex: 30,
    pointerEvents: "box-none",
  } as any,
  bar: {
    flexDirection: "row",
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 3,
    position: "relative",
    borderRadius: 22,
    minHeight: 56,
  },
  activePill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 22,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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
