import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Order, type OrderFilters, type CreateOrderData, type CheckoutData, type OrderStatus } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useCartStore } from '@/stores';

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => api.orders.list(filters),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => api.orders.get(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderData) => api.orders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useCheckoutOrder() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clearCart);

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: CheckoutData }) =>
      api.orders.checkout(orderId, data),
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      api.orders.updateStatus(orderId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) });
    },
  });
}

export function useVoidOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      api.orders.void(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
