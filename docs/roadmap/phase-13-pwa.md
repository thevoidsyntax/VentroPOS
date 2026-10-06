# Phase 13: PWA Polish

> **Version:** 1.0.0
> **Status:** ⬜ Todo
> **Priority:** P2
> **Dependencies:** Phase 7 (Frontend Setup)

---

## Overview

Phase 13 implements PWA features including offline mode, install prompt, and push notifications for a native app-like experience.

---

## Objectives

1. ⬜ Service worker optimization
2. ⬜ Offline mode with IndexedDB
3. ⬜ Install prompt
4. ⬜ Push notifications (optional)
5. ⬜ App manifest optimization
6. ⬜ Performance optimization

---

## Features

### Offline Mode

```
┌─────────────────────────────────────────────────────────────┐
│  📡 Offline Mode                                          │
├─────────────────────────────────────────────────────────────┤
│  You're currently offline.                                 │
│  Changes will sync when you're back online.               │
│                                                             │
│  Pending changes:                                          │
│  • 3 orders queued                                        │
│  • 1 stock adjustment                                     │
│                                                             │
│  Available offline:                                        │
│  • Product catalog (last synced: 5 min ago)               │
│  • Categories                                             │
│  • Tables                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Install Prompt

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Install VentroPOS                                 │    │
│  │                                                     │    │
│  │  Access from your home screen for a faster         │    │
│  │  experience.                                       │    │
│  │                                                     │    │
│  │         [Install]              [Not Now]          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Sync Status

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 Syncing...                                            │
│  Uploading 2 pending orders                               │
│  ████████████░░░░░░░░ 60%                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Service Worker Strategy

```typescript
// vite.config.ts - PWA config
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.ventropos\.com\/v1\/products/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'products-cache',
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
        },
      },
      {
        urlPattern: /^https:\/\/api\.ventropos\.com\/v1\/orders/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'orders-cache',
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
})
```

### IndexedDB Schema

```typescript
// lib/offline-db.ts
interface OfflineDB {
  pendingOrders: {
    id: string;
    data: OrderData;
    createdAt: Date;
    synced: boolean;
  }[];
  cachedProducts: Product[];
  cachedCategories: Category[];
  syncQueue: SyncItem[];
}
```

### Offline Detection Hook

```typescript
// hooks/use-offline.ts
export function useOffline() {
  const [isOffline, setOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      syncPendingData();
    };
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline, pendingCount };
}
```

### Install Prompt Hook

```typescript
// hooks/use-install-prompt.ts
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return { deferredPrompt, isInstalled, install };
}
```

---

## App Manifest

```json
{
  "name": "VentroPOS",
  "short_name": "VentroPOS",
  "description": "Point of Sale for Cafe",
  "theme_color": "#2563EB",
  "background_color": "#F8FAFC",
  "display": "standalone",
  "orientation": "any",
  "scope": "/",
  "start_url": "/pos",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## Deliverables Checklist

- [ ] PWA manifest configured
- [ ] App icons generated (all sizes)
- [ ] Service worker with caching strategies
- [ ] Offline banner component
- [ ] Offline detection hook
- [ ] IndexedDB for offline data
- [ ] Sync queue for pending mutations
- [ ] Install prompt component
- [ ] Install prompt hook
- [ ] Sync status indicator
- [ ] Background sync (if supported)
- [ ] iOS splash screen

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Bundle Size (gzipped) | < 200KB |
| Lighthouse PWA Score | > 90 |

---

➡️ **[Back to Roadmap](../README.md)**

---

*Document maintained by: thevoidsyntax*
