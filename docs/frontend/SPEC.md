# VentroPOS Frontend - Setup Specification

> **Phase:** 7
> **Status:** Ready to Implement
> **Primary Skill:** `/frontend` - React best practices
> **UI/UX Skills (auto-invoke for .tsx/.jsx):**
> - `/ui-ux-pro-max` - Human-like UI patterns, responsive, tablet-first (**AUTO**)
> - `/ui-ux-pro-max-styling` - Tailwind + shadcn/ui styling patterns (auto)
> - `/ui-ux-pro-max-design-system` - Design tokens, colors, typography, spacing (manual - initial setup)
> **Last Updated:** 2026-10-08

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Tech Stack Details](#2-tech-stack-details)
3. [UI/UX Skill Integration](#3-uiux-skill-integration)
4. [Folder Structure](#4-folder-structure)
5. [Component Architecture](#5-component-architecture)
6. [State Management](#6-state-management)
7. [API Integration](#7-api-integration)
8. [Routing](#8-routing)
9. [PWA Configuration](#9-pwa-configuration)
10. [Development Workflow](#10-development-workflow)

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

## 3. UI/UX Skill Integration

### 3.1 Skill Overview

| Skill | When to Invoke | Purpose |
|-------|----------------|---------|
| `/ui-ux-pro-max` | Before starting UI work | Assessment: "What patterns make this look human-made?" |
| `/ui-ux-pro-max-styling` | When styling components | Tailwind classes, responsive patterns, animations |
| `/ui-ux-pro-max-design-system` | Design token setup | Colors, typography, spacing, theme configuration |

### 3.2 Workflow Pattern

```
Phase 7 Implementation Flow:
┌─────────────────────────────────────────────────────────────┐
│  1. Setup Phase                                             │
│     └─ /frontend (auto) → Project structure, configs        │
├─────────────────────────────────────────────────────────────┤
│  2. UI/UX Assessment (Manual Invoke)                        │
│     └─ /ui-ux-pro-max                                       │
│         └─ Analyze: "POS grid for cafe kasir"               │
│         └─ Output: Human-like patterns, touch-first rules   │
├─────────────────────────────────────────────────────────────┤
│  3. Design Tokens (Manual Invoke)                            │
│     └─ /ui-ux-pro-max-design-system                        │
│         └─ Colors, typography, spacing for POS              │
│         └─ Tailwind config: brand colors, touch sizing      │
├─────────────────────────────────────────────────────────────┤
│  4. Component Styling (Manual Invoke per component)          │
│     └─ /ui-ux-pro-max-styling                              │
│         └─ ProductCard, CartDrawer, CheckoutForm            │
│         └─ Responsive breakpoints, hover states             │
├─────────────────────────────────────────────────────────────┤
│  5. Integration                                             │
│     └─ /frontend (auto) → React components                  │
│     └─ /performance (auto) → Bundle, Core Web Vitals       │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 /ui-ux-pro-max Patterns for POS

**Human-like UI Principles:**

| Aspect | AI-Generated (Avoid) | Human-like (Target) |
|--------|----------------------|---------------------|
| Spacing | Uniform, mathematical | Organic, slight variations |
| Colors | Flat, generic | Subtle gradients, warm tones |
| Typography | System default | Considered font stack |
| Interactions | Instant, robotic | Micro-animations, feedback |
| Layout | Perfect grid | Slight asymmetry, breathing room |

**Tablet-First Touch Rules:**

```
✅ DO:
- Min tap target: 44x44px
- Adequate spacing between targets: 8px minimum
- Clear visual feedback on touch
- Swipe gestures for common actions
- Large, readable text: 14px minimum body

❌ DON'T:
- Dense grids with small gaps
- Hover-dependent interactions
- Multiple actions per tap
- Small, cramped layouts
- Scroll-heavy forms
```

### 3.4 /ui-ux-pro-max-design-system Tokens

**Color Palette (POS-Optimized):**

```css
/* Primary - Trust, Clarity */
--primary: #2563EB;           /* Blue-600 - main actions */
--primary-hover: #1D4ED8;     /* Blue-700 */
--primary-foreground: #FFFFFF;

/* Secondary - Accent */
--secondary: #7C3AED;         /* Violet-600 */
--secondary-hover: #6D28D9;

/* Status Colors */
--success: #16A34A;           /* Green-600 - paid, completed */
--warning: #CA8A04;           /* Yellow-600 - pending, alerts */
--danger: #DC2626;            /* Red-600 - void, errors */
--info: #0891B2;              /* Cyan-600 - in-progress */

/* Surfaces */
--background: #F8FAFC;       /* Slate-50 - main bg */
--surface: #FFFFFF;          /* Cards, drawers */
--surface-elevated: #FFFFFF; /* Modals */
--border: #E2E8F0;           /* Slate-200 */
--border-focus: #2563EB;      /* Focus rings */

/* Text */
--text-primary: #1E293B;     /* Slate-800 */
--text-secondary: #64748B;    /* Slate-500 */
--text-muted: #94A3B8;       /* Slate-400 */
```

**Typography Scale:**

```
Font: Inter (system-ui fallback)
Weight: 400 (body), 500 (labels), 600 (headings), 700 (emphasis)

Scale:
- xs:   12px / 16px line-height   (captions, timestamps)
- sm:   14px / 20px line-height   (body, prices)
- base: 16px / 24px line-height   (large body)
- lg:   18px / 28px line-height   (section headers)
- xl:   20px / 28px line-height   (page titles)
- 2xl:  24px / 32px line-height   (major headings)
- 3xl:  30px / 36px line-height   (dashboard metrics)
```

**Spacing System:**

```
Base unit: 4px

Spacing tokens:
- 0:   0px
- 1:   4px      (icon gaps)
- 2:   8px      (inline spacing)
- 3:   12px     (compact elements)
- 4:   16px     (card padding, section gaps)
- 5:   20px     (large padding)
- 6:   24px     (section margins)
- 8:   32px     (page margins)
- 10:  40px     (major sections)
- 12:  48px     (page padding top/bottom)

Touch-specific:
- button-height: 44px     (minimum)
- input-height: 44px      (touch-friendly)
- list-item-height: 56px  (comfortable tap)
- card-min-padding: 16px
```

**Border Radius:**

```
- none: 0px
- sm:   4px      (small chips, badges)
- md:   6px      (inputs, small cards)
- lg:   8px      (buttons, cards)
- xl:   12px     (modals, large cards)
- 2xl:  16px     (drawers, sheets)
- full: 9999px   (pills, avatars)
```

### 3.5 /ui-ux-pro-max-styling Patterns

**Component Patterns:**

```tsx
// ProductCard - Human-like touch target
<div className="
  relative flex flex-col items-center p-4
  bg-white rounded-lg border border-slate-200
  shadow-sm hover:shadow-md active:scale-[0.98]
  transition-all duration-150 cursor-pointer
  min-h-[140px] min-w-[100px]
">
  {/* Product image with subtle shadow */}
  <div className="w-20 h-20 rounded-md overflow-hidden shadow-sm">
    <img src={image} alt={name} className="w-full h-full object-cover" />
  </div>
  
  {/* Name with ellipsis for overflow */}
  <span className="mt-2 text-sm font-medium text-slate-800 line-clamp-2 text-center">
    {name}
  </span>
  
  {/* Price - prominent but not shouting */}
  <span className="text-sm font-semibold text-slate-900">
    Rp {formatPrice(price)}
  </span>
  
  {/* Low stock indicator - subtle but visible */}
  {stock <= lowStockThreshold && (
    <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
      {stock} left
    </span>
  )}
</div>

// CartDrawer - Slide-in with backdrop
<Sheet>
  <SheetContent side="right" className="w-[360px] sm:w-[400px]">
    <SheetHeader>
      <SheetTitle>Keranjang</SheetTitle>
      <SheetDescription>
        {items.length} item{items.length !== 1 ? 's' : ''}
      </SheetDescription>
    </SheetHeader>
    
    {/* Scrollable cart items */}
    <ScrollArea className="flex-1 px-1">
      {items.map(item => <CartItem key={item.id} item={item} />)}
    </ScrollArea>
    
    {/* Sticky checkout footer */}
    <div className="border-t pt-4 mt-4">
      <div className="flex justify-between text-sm text-slate-600 mb-2">
        <span>Subtotal</span>
        <span>Rp {formatPrice(subtotal)}</span>
      </div>
      <Button className="w-full h-12 text-base font-semibold">
        Bayar Rp {formatPrice(total)}
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

**Responsive Breakpoints:**

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '320px',   // Small mobile
      'sm': '640px',   // Large mobile
      'md': '768px',   // Tablet portrait (PRIMARY)
      'lg': '1024px',  // Tablet landscape
      'xl': '1280px',  // Desktop
    },
  },
}

// POS Grid - Responsive columns
<div className="
  grid gap-3 p-4
  grid-cols-3 xs:grid-cols-4 sm:grid-cols-5
  md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
">
  {/* Products auto-fill */}
</div>
```

### 3.6 Quality Checklist

```
Before calling /ui-ux-pro-max-styling:

□ Component has clear purpose
□ States defined (default, hover, active, disabled, loading)
□ Touch target ≥ 44x44px
□ Spacing follows 4px grid
□ Text readable at arm's length (tablet use case)
□ Colors pass contrast ratio (WCAG AA)
□ Animations subtle and purposeful

After styling with /ui-ux-pro-max-styling:

□ Human-like, not template-generated feel
□ Touch-friendly interactions
□ Consistent spacing and typography
□ Accessible (keyboard, screen reader)
□ Performant (no janky animations)
```

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

## 4. Folder Structure

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
├── eslint.config.js        # ESLint 9 flat config
└── package.json
```

---

## 5. Component Architecture

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

## 6. State Management

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

## 7. API Integration

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

## 8. Routing

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

## 9. PWA Configuration

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

## 10. Development Workflow

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
| Lint | `eslint src` | 0 errors (ESLint 9 flat config) |
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
