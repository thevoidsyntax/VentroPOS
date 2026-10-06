import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const setOffline = useUIStore((state) => state.setOffline);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  return isOffline;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<{
    online: boolean;
    effectiveType: string | null;
    downlink: number | null;
  }>({
    online: navigator.onLine,
    effectiveType: null,
    downlink: null,
  });

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;

    const updateNetworkStatus = () => {
      setStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType ?? null,
        downlink: connection?.downlink ?? null,
      });
    };

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
      updateNetworkStatus();
    }

    window.addEventListener('online', () => setStatus((s) => ({ ...s, online: true })));
    window.addEventListener('offline', () => setStatus((s) => ({ ...s, online: false })));

    return () => {
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return status;
}

interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}
