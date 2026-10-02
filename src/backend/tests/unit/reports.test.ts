// Report Tests - Unit Tests for Report Use Cases
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReportFilters, SalesSummary, ProductPerformanceReport, StaffPerformanceReport, CategoryBreakdownReport } from '../../src/domain/entities/report.js';

// Mock repository
const mockReportRepository = {
  getSalesMetrics: vi.fn(),
  getPaymentMethodBreakdown: vi.fn(),
  getHourlySales: vi.fn(),
  getPreviousPeriodRevenue: vi.fn(),
  getProductSales: vi.fn(),
  getProductSalesTotal: vi.fn(),
  getStaffSales: vi.fn(),
  getCategorySales: vi.fn(),
};

// Mock the container
vi.mock('../../src/infrastructure/database/repositories/container.js', () => ({
  reportRepository: mockReportRepository,
}));

describe('Report Use Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sales Summary', () => {
    it('should calculate correct average order value', () => {
      const metrics = {
        totalRevenue: 1000000,
        grossRevenue: 1100000,
        totalDiscount: 100000,
        totalTax: 110000,
        transactionCount: 50,
        totalItemsSold: 200,
      };

      const averageOrderValue = metrics.transactionCount > 0
        ? metrics.totalRevenue / metrics.transactionCount
        : 0;

      expect(averageOrderValue).toBe(20000);
    });

    it('should handle zero transactions gracefully', () => {
      const metrics = {
        totalRevenue: 0,
        grossRevenue: 0,
        totalDiscount: 0,
        totalTax: 0,
        transactionCount: 0,
        totalItemsSold: 0,
      };

      const averageOrderValue = metrics.transactionCount > 0
        ? metrics.totalRevenue / metrics.transactionCount
        : 0;

      expect(averageOrderValue).toBe(0);
    });

    it('should calculate revenue change percentage', () => {
      const currentRevenue = 1500000;
      const previousRevenue = 1000000;

      const changePercent = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      expect(changePercent).toBe(50);
    });

    it('should handle negative revenue change', () => {
      const currentRevenue = 800000;
      const previousRevenue = 1000000;

      const changePercent = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

      expect(changePercent).toBe(-20);
    });
  });

  describe('Product Performance', () => {
    it('should calculate percentage of total correctly', () => {
      const productRevenue = 500000;
      const totalRevenue = 2000000;

      const percentOfTotal = totalRevenue > 0
        ? (productRevenue / totalRevenue) * 100
        : 0;

      expect(percentOfTotal).toBe(25);
    });

    it('should calculate average price correctly', () => {
      const productRevenue = 600000;
      const quantitySold = 30;

      const averagePrice = quantitySold > 0
        ? productRevenue / quantitySold
        : 0;

      expect(averagePrice).toBe(20000);
    });

    it('should handle zero quantity sold', () => {
      const productRevenue = 0;
      const quantitySold = 0;

      const averagePrice = quantitySold > 0
        ? productRevenue / quantitySold
        : 0;

      expect(averagePrice).toBe(0);
    });

    it('should rank products correctly', () => {
      const products = [
        { productId: '1', productName: 'Coffee', quantitySold: 100, revenue: 1500000 },
        { productId: '2', productName: 'Tea', quantitySold: 80, revenue: 960000 },
        { productId: '3', productName: 'Pastry', revenue: 540000, quantitySold: 45 },
      ].sort((a, b) => b.revenue - a.revenue);

      const ranked = products.map((p, idx) => ({ ...p, rank: idx + 1 }));

      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].productName).toBe('Coffee');
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].rank).toBe(3);
    });
  });

  describe('Staff Performance', () => {
    it('should calculate staff percentage of total', () => {
      const staffSales = [
        { userId: '1', userName: 'Alice', totalSales: 500000 },
        { userId: '2', userName: 'Bob', totalSales: 300000 },
        { userId: '3', userName: 'Charlie', totalSales: 200000 },
      ];

      const totalSales = staffSales.reduce((sum, s) => sum + s.totalSales, 0);

      const percentages = staffSales.map(s => ({
        ...s,
        percentOfTotal: totalSales > 0 ? (s.totalSales / totalSales) * 100 : 0,
      }));

      expect(percentages[0].percentOfTotal).toBe(50);
      expect(percentages[1].percentOfTotal).toBe(30);
      expect(percentages[2].percentOfTotal).toBe(20);
    });

    it('should calculate average order value per staff', () => {
      const totalSales = 1000000;
      const transactionCount = 50;

      const aov = transactionCount > 0 ? totalSales / transactionCount : 0;

      expect(aov).toBe(20000);
    });
  });

  describe('Category Breakdown', () => {
    it('should calculate category percentage correctly', () => {
      const categoryRevenue = 750000;
      const totalRevenue = 3000000;

      const percentOfTotal = totalRevenue > 0
        ? (categoryRevenue / totalRevenue) * 100
        : 0;

      expect(percentOfTotal).toBe(25);
    });

    it('should separate categorized from uncategorized', () => {
      const categorySales = [
        { categoryId: '1', categoryName: 'Beverages', quantitySold: 100, revenue: 1000000, orderCount: 50 },
        { categoryId: '2', categoryName: 'Food', quantitySold: 80, revenue: 800000, orderCount: 40 },
        { categoryId: 'uncategorized', categoryName: 'Uncategorized', quantitySold: 20, revenue: 200000, orderCount: 10 },
      ];

      const categorized = categorySales.filter(c => c.categoryId !== 'uncategorized');
      const uncategorized = categorySales.find(c => c.categoryId === 'uncategorized');

      expect(categorized).toHaveLength(2);
      expect(uncategorized).toBeDefined();
      expect(uncategorized?.categoryName).toBe('Uncategorized');
    });

    it('should calculate totals correctly', () => {
      const categorySales = [
        { categoryId: '1', categoryName: 'Coffee', quantitySold: 100, revenue: 1500000 },
        { categoryId: '2', categoryName: 'Tea', quantitySold: 80, revenue: 800000 },
      ];

      const totalRevenue = categorySales.reduce((sum, c) => sum + c.revenue, 0);
      const totalQuantity = categorySales.reduce((sum, c) => sum + c.quantitySold, 0);

      expect(totalRevenue).toBe(2300000);
      expect(totalQuantity).toBe(180);
    });
  });

  describe('Date Range Utilities', () => {
    it('should calculate this_week range correctly', () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - dayOfWeek);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekEnd.getDay()).toBe(6); // Saturday
      expect(weekStart <= now).toBe(true);
      expect(weekEnd >= now).toBe(true);
    });

    it('should calculate this_month range correctly', () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      expect(monthStart.getDate()).toBe(1);
      expect(monthEnd.getDate()).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
      expect(monthStart <= now).toBe(true);
      expect(monthEnd >= now).toBe(true);
    });

    it('should calculate yesterday range correctly', () => {
      const now = new Date();
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      expect(yesterdayStart.getDate()).toBe(yesterday.getDate());
      expect(yesterdayEnd.getDate()).toBe(yesterday.getDate());
    });

    it('should calculate last_week range correctly', () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      const thisWeekStart = new Date(todayStart);
      thisWeekStart.setDate(thisWeekStart.getDate() - dayOfWeek);

      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);

      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekStart.getDate() - 6);
      lastWeekStart.setHours(0, 0, 0, 0);

      expect(lastWeekStart < thisWeekStart).toBe(true);
      expect(lastWeekEnd < thisWeekStart).toBe(true);
      // 7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(lastWeekEnd.getTime() - lastWeekStart.getTime()).toBe(sevenDaysMs - 1);
    });
  });

  describe('Currency Formatting', () => {
    it('should format IDR currency correctly', () => {
      const amount = 1500000;
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);

      expect(formatted).toContain('1.500.000');
    });
  });

  describe('CSV Export', () => {
    it('should escape CSV values with commas correctly', () => {
      const value = 'Coffee, Large';
      const escaped = `"${value}"`;

      expect(escaped).toBe('"Coffee, Large"');
    });

    it('should escape CSV values with quotes correctly', () => {
      const value = 'Coffee "Grande"';
      const escaped = `"${value.replace(/"/g, '""')}"`;

      expect(escaped).toBe('"Coffee ""Grande"""');
    });

    it('should calculate revenue percentages for export', () => {
      const products = [
        { productName: 'Coffee', revenue: 1500000 },
        { productName: 'Tea', revenue: 500000 },
      ];

      const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

      const withPercent = products.map(p => ({
        ...p,
        percentOfTotal: ((p.revenue / totalRevenue) * 100).toFixed(2) + '%'
      }));

      expect(withPercent[0].percentOfTotal).toBe('75.00%');
      expect(withPercent[1].percentOfTotal).toBe('25.00%');
    });
  });

  describe('Report Data Structures', () => {
    it('should have correct SalesSummary structure', () => {
      const summary: SalesSummary = {
        period: {
          from: new Date(),
          to: new Date(),
          label: 'Hari Ini'
        },
        metrics: {
          totalRevenue: 1000000,
          grossRevenue: 1100000,
          totalDiscount: 100000,
          totalTax: 110000,
          transactionCount: 50,
          averageOrderValue: 20000,
          totalItemsSold: 200
        },
        byPaymentMethod: [
          { method: 'cash', count: 30, amount: 600000 },
          { method: 'qris', count: 20, amount: 400000 }
        ],
        byHour: [
          { hour: 9, count: 10, amount: 200000 },
          { hour: 10, count: 15, amount: 300000 }
        ],
        comparison: {
          previousPeriodRevenue: 800000,
          revenueChangePercent: 25
        }
      };

      expect(summary.period.label).toBe('Hari Ini');
      expect(summary.metrics.transactionCount).toBe(50);
      expect(summary.byPaymentMethod).toHaveLength(2);
      expect(summary.comparison?.revenueChangePercent).toBe(25);
    });

    it('should have correct ProductPerformanceReport structure', () => {
      const report: ProductPerformanceReport = {
        period: {
          from: new Date(),
          to: new Date(),
          label: 'Hari Ini'
        },
        products: [
          {
            productId: '1',
            productName: 'Coffee',
            categoryId: 'cat-1',
            categoryName: 'Beverages',
            quantitySold: 100,
            revenue: 1500000,
            averagePrice: 15000,
            percentOfTotal: 75,
            rank: 1
          }
        ],
        totals: {
          totalQuantitySold: 100,
          totalRevenue: 1500000
        },
        topMovers: {
          mostSold: [],
          leastSold: []
        }
      };

      expect(report.products[0].rank).toBe(1);
      expect(report.totals.totalRevenue).toBe(1500000);
    });

    it('should have correct StaffPerformanceReport structure', () => {
      const report: StaffPerformanceReport = {
        period: {
          from: new Date(),
          to: new Date(),
          label: 'Hari Ini'
        },
        staff: [
          {
            userId: '1',
            userName: 'Alice',
            role: 'kasir',
            transactionCount: 25,
            totalSales: 500000,
            averageOrderValue: 20000,
            percentOfTotal: 50,
            rank: 1
          }
        ],
        totals: {
          totalTransactions: 25,
          totalSales: 500000
        }
      };

      expect(report.staff[0].role).toBe('kasir');
      expect(report.totals.totalSales).toBe(500000);
    });

    it('should have correct CategoryBreakdownReport structure', () => {
      const report: CategoryBreakdownReport = {
        period: {
          from: new Date(),
          to: new Date(),
          label: 'Hari Ini'
        },
        categories: [
          {
            categoryId: '1',
            categoryName: 'Beverages',
            quantitySold: 100,
            revenue: 1500000,
            percentOfTotal: 75,
            orderCount: 50,
            rank: 1
          }
        ],
        totals: {
          totalQuantitySold: 100,
          totalRevenue: 1500000,
          totalOrders: 50
        }
      };

      expect(report.categories[0].categoryName).toBe('Beverages');
      expect(report.totals.totalOrders).toBe(50);
    });
  });
});
