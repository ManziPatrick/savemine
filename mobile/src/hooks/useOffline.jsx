import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
};

