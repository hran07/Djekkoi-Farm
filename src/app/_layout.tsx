import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  ShipporiMinchoB1_500Medium,
  ShipporiMinchoB1_700Bold,
  ShipporiMinchoB1_800ExtraBold,
} from '@expo-google-fonts/shippori-mincho-b1';

import { StoreProvider } from '@/context/StoreContext';
import { AppHeader } from '@/components/AppHeader';
import { CustomTabBar } from '@/components/CustomTabBar';
import { GlobalSheetHost } from '@/components/sheets/GlobalSheetHost';
import { Toast } from '@/components/Toast';
import { useTheme } from '@/hooks/useTheme';

SplashScreen.preventAutoHideAsync();

function RootTabsLayout() {
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    ShipporiMinchoB1_500Medium,
    ShipporiMinchoB1_700Bold,
    ShipporiMinchoB1_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <StoreProvider>
      <RootTabsLayout />
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
});
