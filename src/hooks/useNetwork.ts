import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Network from 'expo-network';

export interface NetworkInfo {
  isOnline: boolean;
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isChecking: boolean;
  checkConnection: () => Promise<boolean>;
}

export function useNetwork(): NetworkInfo {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);
  const [networkType, setNetworkType] = useState<string>('UNKNOWN');
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const evaluateState = useCallback((state: Network.NetworkState) => {
    const connected = state.isConnected ?? true;
    const reachable = state.isInternetReachable ?? connected;
    setIsConnected(connected);
    setIsInternetReachable(reachable);
    setNetworkType(state.type || 'UNKNOWN');
    return connected && reachable;
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        const browserOnline = navigator.onLine;
        setIsConnected(browserOnline);
        setIsInternetReachable(browserOnline);
        if (!browserOnline) {
          setIsChecking(false);
          return false;
        }
      }

      const state = await Network.getNetworkStateAsync();
      const online = evaluateState(state);
      setIsChecking(false);
      return online;
    } catch {
      // Fallback
      const fallbackOnline =
        Platform.OS === 'web' && typeof navigator !== 'undefined'
          ? navigator.onLine
          : true;
      setIsConnected(fallbackOnline);
      setIsInternetReachable(fallbackOnline);
      setIsChecking(false);
      return fallbackOnline;
    }
  }, [evaluateState]);

  useEffect(() => {
    let isMounted = true;

    // Initial async network check
    Network.getNetworkStateAsync()
      .then((state) => {
        if (isMounted) {
          evaluateState(state);
        }
      })
      .catch(() => {
        if (isMounted && Platform.OS === 'web' && typeof navigator !== 'undefined') {
          setIsConnected(navigator.onLine);
          setIsInternetReachable(navigator.onLine);
        }
      });

    // Subscribe to Network changes if available
    let subscription: { remove: () => void } | null = null;
    try {
      if (typeof Network.addNetworkStateListener === 'function') {
        subscription = Network.addNetworkStateListener((state) => {
          if (isMounted) {
            evaluateState(state);
          }
        });
      }
    } catch (e) {
      console.warn('Network listener error:', e);
    }

    // Web event listeners
    const handleWebOnline = () => {
      if (isMounted) {
        setIsConnected(true);
        setIsInternetReachable(true);
      }
    };
    const handleWebOffline = () => {
      if (isMounted) {
        setIsConnected(false);
        setIsInternetReachable(false);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', handleWebOnline);
      window.addEventListener('offline', handleWebOffline);
    }

    return () => {
      isMounted = false;
      subscription?.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('online', handleWebOnline);
        window.removeEventListener('offline', handleWebOffline);
      }
    };
  }, [evaluateState]);

  const isOnline = isConnected && isInternetReachable;

  return {
    isOnline,
    isConnected,
    isInternetReachable,
    type: networkType,
    isChecking,
    checkConnection,
  };
}
