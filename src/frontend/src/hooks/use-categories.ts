import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateCategoryData, type UpdateCategoryData } from '@/lib/api';
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

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryData) => api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      api.categories.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.categories.all, variables.id],
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
