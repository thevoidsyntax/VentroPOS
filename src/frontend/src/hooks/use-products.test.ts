import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts, useProduct } from '@/hooks/use-products';
import { server, mockProducts } from '@/test/mocks';
import { http, HttpResponse } from 'msw';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products successfully', async () => {
    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(3);
    expect(result.current.data?.data[0]).toMatchObject({
      id: 'prod-1',
      name: 'Kopi Hitam',
    });
  });

  it('filters products by category', async () => {
    const { result } = renderHook(() => useProducts({ categoryId: 'cat-1' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data.every(p => p.categoryId === 'cat-1')).toBe(true);
  });

  it('handles error state', async () => {
    server.use(
      http.get('/api/v1/products', () => HttpResponse.json({ message: 'Error' }, { status: 500 }))
    );

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single product successfully', async () => {
    const { result } = renderHook(() => useProduct('prod-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      id: 'prod-1',
      name: 'Kopi Hitam',
    });
  });

  it('does not fetch when id is empty', async () => {
    const { result } = renderHook(() => useProduct(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('handles 404 error', async () => {
    const { result } = renderHook(() => useProduct('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
