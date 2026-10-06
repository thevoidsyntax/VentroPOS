# VentroPOS Frontend - Setup Specification

> **Phase:** 7  
> **Status:** Ready to Implement  
> **Last Updated:** 2026-01-26

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Tech Stack Details](#2-tech-stack-details)
3. [Folder Structure](#3-folder-structure)
4. [Component Architecture](#4-component-architecture)
5. [State Management](#5-state-management)
6. [API Integration](#6-api-integration)
7. [Routing](#7-routing)
8. [PWA Configuration](#8-pwa-configuration)
9. [Development Workflow](#9-development-workflow)

---

## 1. Project Setup

### 1.1 Project Creation

```bash
# Create Vite project
npm create vite@latest frontend -- --template react-ts

# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Install additional dependencies
npm install react-router-dom @tanstack/react-query zustand recharts lucide-react
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Initialize shadcn/ui
npx shadcn@latest init
```

### 1.2 Package.json Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^5.x",
    "recharts": "^2.x",
    "lucide-react": "^0.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "@radix-ui/react-slot": "^1.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^1.x",
    "@radix-ui/react-tabs": "^1.x",
    "sonner": "^1.x",
    "zustand": "^5.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@vitejs/plugin-react": "^4.x",
    "typescript": "^5.x",
    "vite": "^6.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

---

## 2. Tech Stack Details

### 2.1 Framework & Build

| Component | Choice | Version | Notes |
|-----------|--------|---------|-------|
| Bundler | Vite | 6.x | Fast HMR |
| Language | TypeScript | 5.x | Strict mode |
| React | React | 18.x | - |

### 2.2 UI & Styling

| Component | Choice | Version | Notes |
|-----------|--------|---------|-------|
| CSS | TailwindCSS | 3.x | Utility-first |
| UI Components | shadcn/ui | Latest | Headless + Radix |
| Icons | Lucide React | Latest | Consistent, tree-shakeable |
| Toasts | Sonner | Latest | Beautiful notifications |
| Charts | Recharts | 2.x | React-native |
| Forms | React Hook Form | - | Future |
| Validation | Zod | - | Schema-first |

### 2.3 State & Data

| Component | Choice | Version | Notes |
|-----------|--------|---------|-------|
| Global State | Zustand | 5.x | Simple, minimal |
| Server State | TanStack Query | 5.x | Caching, offline |
| Routing | React Router | 6.x | Client-side |

### 2.4 PWA

| Component | Choice | Version | Notes |
|-----------|--------|---------|-------|
| PWA Plugin | vite-plugin-pwa | Latest | Workbox integration |
| Service Worker | Workbox | Latest | Caching strategies |
| Install Prompt | Native | - | Web API |
| Offline | IndexedDB | - | Local persistence |

---

## 3. Folder Structure

```
frontend/
├── public/                  # Static assets
│   ├── favicon.ico
│   └── manifest.json         # PWA manifest
├── src/
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── layout/          # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── app-layout.tsx
│   │   ├── pos/             # POS-specific components
│   │   │   ├── product-card.tsx
│   │   │   ├── cart-drawer.tsx
│   │   │   ├── cart-item.tsx
│   │   │   └── category-tabs.tsx
│   │   ├── orders/
│   │   │   ├── order-list.tsx
│   │   │   └── order-detail.tsx
│   │   └── shared/          # Shared components
│   │       ├── loading-skeleton.tsx
│   │       ├── error-boundary.tsx
│   │       └── offline-banner.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── use-cart.ts
│   │   ├── use-orders.ts
│   │   ├── use-products.ts
│   │   └── use-offline.ts
│   ├── lib/                 # Utilities
│   │   ├── api.ts            # API client
│   │   ├── utils.ts          # cn() helper, formatters
│   │   └── constants.ts       # App constants
│   ├── pages/                # Route pages
│   │   ├── pos/
│   │   │   ├── index.tsx
│   │   │   ├── checkout.tsx
│   │   │   └── receipt.tsx
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   └── $id.tsx
│   │   ├── stock/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── auth/
│   │       └── login.tsx
│   ├── routes/               # Route configuration
│   │   └── index.tsx
│   ├── stores/               # Zustand stores
│   │   ├── cart-store.ts
│   │   ├── auth-store.ts
│   │   └── ui-store.ts
│   ├── types/                # TypeScript types
│   │   ├── api.ts
│   │   ├── cart.ts
│   │   └── order.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css              # Tailwind imports
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## 4. Component Architecture

### 4.1 Layer Separation

```
┌─────────────────────────────────────────────┐
│  Pages (Route Components)                    │
│  - Fetch data, orchestrate sub-components   │
│  - Handle loading/error states           │
│  - Route params → data fetching           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Features/POS Components                  │
│  - ProductCard, CartDrawer, CheckoutForm  │
│  - Self-contained, reusable              │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  UI Components (shadcn)                  │
│  - Button, Dialog, Card, Input           │
│  - Headless, styled with Tailwind        │
└─────────────────────────────────────────┘
```

### 4.2 shadcn/ui Components to Install

```bash
# Core components needed for POS
npx shadcn@latest add button card input label badge
npx shadcn@latest add dialog dropdown-menu tabs toast
npx shadcn@latest add sheet scroll-area separator
npx shadcn@latest add avatar dropdown-menu table
npx shadcn@latest add select popover command
```

### 4.3 Custom POS Components

| Component | Purpose | Location |
|-----------|---------|-----------|
| `ProductCard` | Product in grid with qty selector | `components/pos/ |
| `CategoryTabs` | Horizontal category filter | `components/pos/` |
| `CartDrawer` | Slide-in cart panel | `components/pos/` |
| `CartItem` | Single cart line item | `components/pos/` |
| `PaymentModal` | Payment method selection | `components/pos/` |
| `ReceiptModal` | Transaction receipt | `components/pos/` |
| `OrderStatusBadge` | Color-coded status | `components/shared/` |
| `OfflineBanner` | Offline indicator | `components/shared/` |
| `LoadingSkeleton` | Content placeholder | `components/shared/` |

---

## 5. State Management

### 5.1 Zustand Stores

#### Cart Store

```typescript
// stores/cart-store.ts
interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers?: string[];
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
}
```

#### Auth Store

```typescript
// stores/auth-store.ts
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
}
```

#### UI Store

```typescript
// stores/ui-store.ts
interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  offline: boolean;
  setOffline: (offline: boolean) => void;
}
```

### 5.2 TanStack Query Configuration

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 5.3 Query Hooks Pattern

```typescript
// hooks/use-products.ts
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.products.list(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.products.get(id),
    enabled: !!id,
  });
}
```

---

## 6. API Integration

### 6.1 API Client

```typescript
// lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'API Error');
  }

  return res.json();
}

export const api = {
  products: {
    list: (filters?) => fetchApi('/products', { params: filters }),
    get: (id) => fetchApi(`/products/${id}`),
  },
  orders: {
    list: (filters?) => fetchApi('/orders', { params: filters }),
    get: (id) => fetchApi(`/orders/${id}`),
    create: (data) => fetchApi('/orders', { method: 'POST', body: JSON.stringify(data) }),
    checkout: (id, data) => fetchApi(`/orders/${id}/checkout`, { method: 'POST', body: JSON.stringify(data) }),
    void: (id) => fetchApi(`/orders/${id}/void`, { method: 'POST' }),
  },
  // ... other endpoints
};
```

### 6.2 API Endpoints Mapping

| Backend Endpoint | Frontend Hook | Use Case |
|------------------|---------------|---------|
| `GET /products` | `useProducts()` | Product grid |
| `GET /products/:id` | `useProduct(id)` | Product detail |
| `GET /orders` | `useOrders()` | Order list |
| `POST /orders` | `createOrder()` | New order |
| `POST /orders/:id/checkout` | `checkoutOrder()` | Payment |
| `GET /reports/sales` | `useSalesReport()` | Dashboard |
| `POST /stock/opnames` | `useCreateOpname()` | Stock opname |

---

## 7. Routing

### 7.1 Route Structure

```typescript
// routes/index.tsx
const routes = [
  { path: '/login', component: LoginPage, public: true },
  {
    path: '/',
    component: AppLayout,
    children: [
      { index: true, component: RedirectToPOS },
      { path: 'pos', component: POSPage },
      { path: 'pos/checkout/:orderId', component: CheckoutPage },
      { path: 'orders', component: OrdersPage },
      { path: 'orders/:id', component: OrderDetailPage },
      { path: 'stock', component: StockPage },
      { path: 'reports', component: ReportsPage },
      { path: 'settings', component: SettingsPage },
    ],
  },
];
```

### 7.2 Route Guards

```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
```

---

## 8. PWA Configuration

### 8.1 vite.config.ts

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'VentroPOS',
        short_name: 'VentroPOS',
        description: 'Point of Sale for Cafe',
        theme_color: '#2563EB',
        background_color: '#F8FAFC',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.ventropos\.com\/v1\/products/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'products-cache',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
});
```

### 8.2 Offline Detection

```typescript
// hooks/use-offline.ts
export function useOffline() {
  const [isOffline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}
```

---

## 9. Development Workflow

### 9.1 Branch Strategy

```
main (production)
├── develop (integration)
│   ├── feature/phase-7-pos-grid
│   ├── feature/phase-8-orders
│   └── ...
└── hotfix/fix-bug
```

### 9.2 Commit Convention

```
feat(pos): add product grid with category tabs
fix(cart): correct quantity calculation
chore: add shadcn button component
docs(readme): update setup instructions
```

### 9.3 Environment Variables

```env
# .env.local
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=VentroPOS
```

### 9.4 Quality Gates

| Check | Command | Threshold |
|-------|---------|------------|
| TypeScript | `tsc --noEmit` | 0 errors |
| Lint | `eslint src --ext .ts,.tsx` | 0 errors |
| Tests | `vitest --coverage` | >70% coverage |
| Build | `vite build` | Success |
| Lighthouse | `lhci autorun` | Performance >90 |

---

## Implementation Checklist

### Phase 7.1: Project Setup
- [ ] Create Vite project
- [ ] Install dependencies
- [ ] Configure Tailwind
- [ ] Setup shadcn/ui
- [ ] Configure PWA plugin
- [ ] Setup folder structure

### Phase 7.2: Core Infrastructure
- [ ] API client with auth headers
- [ ] TanStack Query setup
- [ ] Zustand stores (cart, auth, ui)
- [ ] React Router configuration
- [ ] App layout with sidebar

### Phase 7.3: POS Grid
- [ ] Product grid with category tabs
- [ ] Product card component
- [ ] Cart drawer with qty adjust
- [ ] Checkout flow
- [ ] Receipt modal

### Phase 7.4: Offline Support
- [ ] Service worker registration
- [ ] Offline detection hook
- [ ] Offline banner UI
- [ ] Cache products for offline

---

## Dependencies Summary

```bash
# Core
npm install react react-dom react-router-dom @tanstack/react-query zustand

# UI
npm install tailwindcss postcss autoprefixer
npm install lucide-react recharts sonner

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input badge dialog

# PWA
npm install -D vite-plugin-pwa

# Dev
npm install -D typescript @types/react @types/react-dom vite
```

---

*Maintained by: thevoidsyntax*
