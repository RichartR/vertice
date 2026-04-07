import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean): { supported: boolean } {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  useEffect(() => {
    if (!supported || !enabled) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    const requestWakeLock = async () => {
      try {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release().catch(() => {});
          wakeLockRef.current = null;
        }
        wakeLockRef.current = await navigator.wakeLock!.request('screen');
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [enabled, supported]);

  return { supported };
}
