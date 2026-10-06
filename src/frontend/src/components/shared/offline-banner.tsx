import { useOffline } from '@/hooks';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-yellow-100 px-4 py-2 text-sm text-yellow-800">
      <WifiOff className="h-4 w-4" />
      <span>Anda sedang offline. Perubahan akan disinkronkan saat koneksi kembali.</span>
    </div>
  );
}
