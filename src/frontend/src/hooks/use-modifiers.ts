import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type CreateModifierGroupData,
  type UpdateModifierGroupData,
  type CreateModifierData,
  type UpdateModifierData,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

// Modifier Groups
export function useModifierGroups() {
  return useQuery({
    queryKey: queryKeys.modifierGroups.list(),
    queryFn: () => api.modifiers.listGroups(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useModifierGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.modifierGroups.detail(id),
    queryFn: () => api.modifiers.getGroup(id),
    enabled: !!id,
  });
}

export function useCreateModifierGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModifierGroupData) => api.modifiers.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modifierGroups.all });
    },
  });
}

export function useUpdateModifierGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateModifierGroupData }) =>
      api.modifiers.updateGroup(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modifierGroups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.modifierGroups.detail(variables.id) });
    },
  });
}

export function useDeleteModifierGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.modifiers.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modifierGroups.all });
    },
  });
}

// Modifiers
export function useCreateModifier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateModifierData }) =>
      api.modifiers.createModifier(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modifierGroups.all });
    },
  });
}

export function useUpdateModifier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateModifierData }) =>
      api.modifiers.updateModifier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modifierGroups.all });
    },
  });
}

export function useDeleteModifier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.modifiers.deleteModifier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modifierGroups.all });
    },
  });
}
