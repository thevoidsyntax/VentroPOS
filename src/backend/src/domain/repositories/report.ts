// Report Repository Interface - Domain Layer
// Contract for analytics and reporting queries

import type { ReportFilters } from '../entities/report.js';

export interface SalesMetrics {
  totalRevenue: number;
  grossRevenue: number;
  totalDiscount: number;
  totalTax: number;
  transactionCount: number;
  totalItemsSold: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number;
}

export interface HourlySales {
  hour: number;
  count: number;
  amount: number;
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  categoryId: string | null;
  categoryName: string | null;
  quantitySold: number;
  revenue: number;
}

export interface StaffSalesData {
  userId: string;
  userName: string;
  role: string;
  transactionCount: number;
  totalSales: number;
}

export interface CategorySalesData {
  categoryId: string;
  categoryName: string;
  parentId: string | null;
  quantitySold: number;
  revenue: number;
  orderCount: number;
}

export interface IReportRepository {
  // Sales Summary
  getSalesMetrics(tenantId: string, filters: ReportFilters): Promise<SalesMetrics>;
  getPaymentMethodBreakdown(tenantId: string, filters: ReportFilters): Promise<PaymentMethodBreakdown[]>;
  getHourlySales(tenantId: string, filters: ReportFilters): Promise<HourlySales[]>;
  getPreviousPeriodRevenue(tenantId: string, filters: ReportFilters): Promise<number>;

  // Product Performance
  getProductSales(tenantId: string, filters: ReportFilters, limit?: number): Promise<ProductSalesData[]>;
  getProductSalesTotal(tenantId: string, filters: ReportFilters): Promise<{ quantity: number; revenue: number }>;

  // Staff Performance
  getStaffSales(tenantId: string, filters: ReportFilters): Promise<StaffSalesData[]>;

  // Category Breakdown
  getCategorySales(tenantId: string, filters: ReportFilters): Promise<CategorySalesData[]>;
}
