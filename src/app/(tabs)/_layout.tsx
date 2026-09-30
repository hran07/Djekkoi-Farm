import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { CustomTabBar } from '@/components/CustomTabBar';
import { GlobalSheetHost } from '@/components/sheets/GlobalSheetHost';
import { Toast } from '@/components/Toast';
import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <View style={[styles.flexOne, { backgroundColor: theme.bg }]}>
      <AppHeader />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.bg },
        }}
      >
        <Tabs.Screen name="marketplace" options={{ title: 'Marketplace' }} />
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="stock" options={{ title: 'Stock' }} />
        <Tabs.Screen name="account" options={{ title: 'Akun' }} />
        {/* Tab lama — tersembunyi dari bottom bar */}
        <Tabs.Screen name="kelola" options={{ href: null }} />
        <Tabs.Screen name="penjualan" options={{ href: null }} />
        <Tabs.Screen name="ikan" options={{ href: null }} />
        <Tabs.Screen name="kolam" options={{ href: null }} />
        <Tabs.Screen name="riwayat" options={{ href: null }} />
      </Tabs>
      <GlobalSheetHost />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
});
