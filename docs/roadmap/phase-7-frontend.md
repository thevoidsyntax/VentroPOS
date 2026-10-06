# Phase 7: Frontend Setup (React + TypeScript)

> **Version:** 1.0.0
> **Status:** 🔄 In Progress
> **Target:** Q1 2026

---

## Overview

Phase 7 sets up the React frontend with TypeScript, Vite, TailwindCSS, shadcn/ui, and PWA configuration. This establishes the foundation for all subsequent frontend phases.

---

## Objectives

1. 🔄 Project foundation (Vite + TypeScript)
2. ⬜ UI framework setup (Tailwind + shadcn/ui)
3. ⬜ State management (Zustand + TanStack Query)
4. ⬜ Routing (React Router)
5. ⬜ PWA configuration
6. ⬜ Core POS interface (Login, POS Grid, Cart, Checkout)

---

## Skills Integration

| Skill | Type | Trigger |
|-------|------|---------|
| `/frontend` | Auto | File: `**/*.tsx`, `**/*.jsx` |
| `/ui-ux-pro-max` | Auto | File: `**/*.tsx`, `**/*.jsx` |
| `/ui-ux-pro-max-styling` | Auto | Styling work |
| `/ui-ux-pro-max-design-system` | Manual | Initial design tokens |

> **Goal:** Human-like UI patterns for all components

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 + Vite 6 |
| Language | TypeScript 5 (strict) |
| Styling | TailwindCSS 3 + shadcn/ui |
| State | Zustand 5 (global) + TanStack Query 5 (server) |
| Routing | React Router 6 |
| Icons | Lucide React |
| Toasts | Sonner |
| Charts | Recharts |
| PWA | vite-plugin-pwa |

---

## Project Structure

```
frontend/
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── layout/          # Header, Sidebar, AppLayout
│   │   ├── pos/             # ProductCard, CartDrawer, etc.
│   │   └── shared/          # LoadingSkeleton, ErrorBoundary
│   ├── hooks/               # useCart, useProducts, useOrders
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   ├── utils.ts         # cn(), formatters
│   │   └── query-client.ts  # TanStack Query config
│   ├── pages/               # Route pages
│   │   ├── auth/login.tsx
│   │   ├── pos/             # POSPage, CheckoutPage, ReceiptPage
│   │   └── ...
│   ├── stores/              # Zustand stores
│   │   ├── cart-store.ts
│   │   ├── auth-store.ts
│   │   └── ui-store.ts
│   ├── types/               # API types, cart types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css            # Tailwind imports
├── index.html
├── vite.config.ts           # PWA plugin
├── tailwind.config.js
└── package.json
```

---

## Phase 7.1: Project Foundation

- [ ] Create Vite project: `npm create vite@latest frontend -- --template react-ts`
- [ ] Install core dependencies
- [ ] Configure TypeScript (strict mode)
- [ ] Setup folder structure
- [ ] Configure TailwindCSS
- [ ] Initialize shadcn/ui

### Setup Commands

```bash
cd frontend
npm install react react-dom react-router-dom @tanstack/react-query zustand recharts lucide-react sonner
npm install -D tailwindcss postcss autoprefixer @vitejs/plugin-react
npx tailwindcss init -p
npx shadcn@latest init
```

---

## Phase 7.2: Core Infrastructure

- [ ] API client with auth headers (`lib/api.ts`)
- [ ] TanStack Query client config
- [ ] Zustand stores (cart, auth, ui)
- [ ] React Router configuration
- [ ] App layout with sidebar

---

## Phase 7.3: POS Interface

- [ ] Login page
- [ ] Product grid with category tabs
- [ ] Product card component
- [ ] Cart drawer with qty adjust
- [ ] Checkout flow
- [ ] Receipt modal

### POS Grid Layout (Tablet-First)

```
┌─────────────────────────────────────────────────┐
│  Category Tabs (horizontal scroll)              │
├─────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ [img] │ │[img] │ │[img] │ │[img] │  Products │
│  │ Name  │ │ Name  │ │ Name  │ │ Name  │  (3-4 col)│
│  │ Rp XX │ │ Rp XX │ │ Rp XX │ │ Rp XX │          │
│  └─────┘ └─────┘ └─────┘ └─────┘              │
└─────────────────────────────────────────────────┘
│  [View Cart (X items)] ──────────── [PAY Rp X]│
└─────────────────────────────────────────────────┘
```

---

## Phase 7.4: Offline Support

- [ ] Service worker (vite-plugin-pwa)
- [ ] Offline detection hook
- [ ] Offline banner UI
- [ ] Cache products for offline

---

## shadcn/ui Components

```bash
npx shadcn@latest add button card input label badge
npx shadcn@latest add dialog dropdown-menu tabs toast
npx shadcn@latest add sheet scroll-area separator
npx shadcn@latest add avatar table select popover
```

---

## Quality Gates

| Check | Command | Target |
|-------|---------|--------|
| TypeScript | `tsc --noEmit` | 0 errors |
| Build | `vite build` | Success |
| Bundle Size | - | < 200KB gzipped |

---

## Deliverables Checklist

- [ ] `frontend/` directory with Vite project
- [ ] `tailwind.config.js` with POS design tokens
- [ ] `src/components/ui/` with shadcn components
- [ ] `src/stores/` with Zustand stores
- [ ] `src/hooks/` with TanStack Query hooks
- [ ] Login page functional
- [ ] POS grid displays products
- [ ] Cart drawer works
- [ ] Checkout flow complete
- [ ] PWA configured

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 8 - Orders Management](./phase-8-orders.md)**

---

*Document maintained by: thevoidsyntax*
