import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => api.categories.list(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, id] as const,
    queryFn: () => api.categories.get(id),
    enabled: !!id,
  });
}
