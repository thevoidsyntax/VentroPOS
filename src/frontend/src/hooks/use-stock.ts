import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

export function useStockOverview() {
  return useQuery({
    queryKey: queryKeys.stock.overview(),
    queryFn: () => api.stock.overview(),
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: queryKeys.stock.alerts(),
    queryFn: () => api.stock.alerts(),
    refetchInterval: 60000, // Refresh every minute
  });
}
