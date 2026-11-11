import { useEffect } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';
import { forceFirestoreReconnect } from '@/lib/firebase';

export function useAutoReconnect(onReconnect: () => void, isEnabled: boolean) {
  useEffect(() => {
    if (!isEnabled) return;

    let isMounted = true;

    const handleReconnect = async () => {
      if (!isMounted) return;
      await forceFirestoreReconnect();
      if (isMounted) {
        onReconnect();
      }
    };

    // 1. Web online event
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', handleReconnect);
    }

    // 2. Native Network state listener
    let networkSub: { remove: () => void } | null = null;
    try {
      if (typeof Network.addNetworkStateListener === 'function') {
        networkSub = Network.addNetworkStateListener((state) => {
          const isConnected = state.isConnected ?? true;
          const isInternetReachable = state.isInternetReachable ?? isConnected;
          if (isConnected && isInternetReachable) {
            handleReconnect();
          }
        });
      }
    } catch (e) {
      console.warn('Network listener error in useAutoReconnect:', e);
    }

    // 3. AppState listener (misal saat user kembali dari pengaturan koneksi)
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        handleReconnect();
      }
    });

    return () => {
      isMounted = false;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('online', handleReconnect);
      }
      networkSub?.remove();
      appStateSub.remove();
    };
  }, [onReconnect, isEnabled]);
}

