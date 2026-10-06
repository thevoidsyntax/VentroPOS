import { useQuery } from '@tanstack/react-query';
import { api, type ReportFilters } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

export function useSalesReport(filters: ReportFilters) {
  return useQuery({
    queryKey: queryKeys.reports.sales(filters),
    queryFn: () => api.reports.sales(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

export function useProductReport(filters: ReportFilters) {
  return useQuery({
    queryKey: queryKeys.reports.products(filters),
    queryFn: () => api.reports.products(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

export function useStaffReport(filters: ReportFilters) {
  return useQuery({
    queryKey: queryKeys.reports.staff(filters),
    queryFn: () => api.reports.staff(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

export function useCategoryBreakdown(filters: ReportFilters) {
  return useQuery({
    queryKey: queryKeys.reports.categoryBreakdown(filters),
    queryFn: () => api.reports.categoryBreakdown(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });
}
