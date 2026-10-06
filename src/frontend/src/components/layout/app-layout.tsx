import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { OfflineBanner } from '@/components/shared/offline-banner';
import { Toaster } from '@/components/ui/toaster';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <OfflineBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
