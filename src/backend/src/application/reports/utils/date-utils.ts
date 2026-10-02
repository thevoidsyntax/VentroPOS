// Date Utilities - Application Layer
// Helper functions for date range calculations

import type { DateRangePreset } from '../../../domain/entities/report.js';

export interface DateRange {
  fromDate: Date;
  toDate: Date;
}

export function buildDateRange(
  from?: string,
  to?: string,
  preset?: string
): DateRange {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Default: today
  let fromDate = todayStart;
  let toDate = todayEnd;

  // Handle preset ranges
  if (preset && preset !== 'custom') {
    switch (preset as DateRangePreset) {
      case 'today':
        fromDate = todayStart;
        toDate = todayEnd;
        break;
      case 'yesterday': {
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayEnd);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        fromDate = yesterdayStart;
        toDate = yesterdayEnd;
        break;
      }
      case 'this_week': {
        const dayOfWeek = now.getDay();
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        fromDate = weekStart;
        toDate = weekEnd;
        break;
      }
      case 'last_week': {
        const dayOfWeek = now.getDay();
        const thisWeekStart = new Date(todayStart);
        thisWeekStart.setDate(thisWeekStart.getDate() - dayOfWeek);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        lastWeekEnd.setHours(23, 59, 59, 999);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        lastWeekStart.setHours(0, 0, 0, 0);
        fromDate = lastWeekStart;
        toDate = lastWeekEnd;
        break;
      }
      case 'this_month':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last_month': {
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        fromDate = lastMonthStart;
        toDate = lastMonthEnd;
        break;
      }
      default:
        fromDate = todayStart;
        toDate = todayEnd;
    }
  } else if (from && to) {
    // Handle custom date range
    fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
  }

  return { fromDate, toDate };
}

export function getPeriodLabel(fromDate: Date, toDate: Date, preset?: string): string {
  if (preset && preset !== 'custom') {
    const labels: Record<string, string> = {
      today: 'Hari Ini',
      yesterday: 'Kemarin',
      this_week: 'Minggu Ini',
      last_week: 'Minggu Lalu',
      this_month: 'Bulan Ini',
      last_month: 'Bulan Lalu',
      custom: 'Kustom'
    };
    return labels[preset] ?? 'Kustom';
  }

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
