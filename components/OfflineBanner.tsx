'use client';

import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    function onPending(e: Event) {
      const detail = (e as CustomEvent<{ n: number }>).detail;
      setPending(detail?.n ?? 0);
    }
    window.addEventListener('mealprep:pending', onPending as EventListener);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('mealprep:pending', onPending as EventListener);
    };
  }, []);

  if (online && pending === 0) return null;
  return (
    <div
      className={`border-b px-4 py-2 text-center text-sm ${
        online ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
      }`}
    >
      {online ? `${pending} change(s) pending sync` : 'Offline mode — changes will sync when you reconnect'}
    </div>
  );
}
