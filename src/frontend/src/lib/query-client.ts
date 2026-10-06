import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.products.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.products.all, 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.orders.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
  tables: {
    all: ['tables'] as const,
    list: () => [...queryKeys.tables.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.tables.all, 'detail', id] as const,
  },
  stock: {
    all: ['stock'] as const,
    overview: () => [...queryKeys.stock.all, 'overview'] as const,
    alerts: () => [...queryKeys.stock.all, 'alerts'] as const,
  },
  reports: {
    all: ['reports'] as const,
    sales: (filters?: Record<string, unknown>) => [...queryKeys.reports.all, 'sales', filters] as const,
    products: (filters?: Record<string, unknown>) => [...queryKeys.reports.all, 'products', filters] as const,
    staff: (filters?: Record<string, unknown>) => [...queryKeys.reports.all, 'staff', filters] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
};
