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
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="ikan" options={{ title: 'Ikan' }} />
        <Tabs.Screen name="kolam" options={{ title: 'Kolam' }} />
        <Tabs.Screen name="penjualan" options={{ title: 'Penjualan' }} />
        <Tabs.Screen name="riwayat" options={{ title: 'Riwayat' }} />
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
