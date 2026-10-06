import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCategories } from '@/hooks/use-categories';
import { server, mockCategories } from '@/test/mocks';

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

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches categories successfully', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0]).toMatchObject({
      id: 'cat-1',
      name: 'Kopi',
    });
  });

  it('caches categories', async () => {
    const { result, rerender } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Rerender should use cached data
    rerender();

    expect(result.current.isSuccess).toBe(true);
  });
});
