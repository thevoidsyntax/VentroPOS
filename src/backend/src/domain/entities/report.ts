// Report Entities - Domain Layer

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';
export type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

// ============== SALES SUMMARY ==============
export interface SalesSummary {
  period: {
    from: Date;
    to: Date;
    label: string;
  };
  metrics: {
    totalRevenue: number;
    grossRevenue: number;
    totalDiscount: number;
    totalTax: number;
    transactionCount: number;
    averageOrderValue: number;
    totalItemsSold: number;
  };
  byPaymentMethod: {
    method: string;
    count: number;
    amount: number;
  }[];
  byHour: {
    hour: number;
    count: number;
    amount: number;
  }[];
  comparison?: {
    previousPeriodRevenue: number;
    revenueChangePercent: number;
  };
}

// ============== PRODUCT PERFORMANCE ==============
export interface ProductPerformance {
  productId: string;
  productName: string;
  categoryId?: string;
  categoryName?: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
  percentOfTotal: number;
  rank: number;
}

export interface ProductPerformanceReport {
  period: {
    from: Date;
    to: Date;
    label: string;
  };
  products: ProductPerformance[];
  totals: {
    totalQuantitySold: number;
    totalRevenue: number;
  };
  topMovers?: {
    mostSold: ProductPerformance[];
    leastSold: ProductPerformance[];
  };
}

// ============== STAFF PERFORMANCE ==============
export interface StaffPerformance {
  userId: string;
  userName: string;
  role: string;
  transactionCount: number;
  totalSales: number;
  averageOrderValue: number;
  percentOfTotal: number;
  rank: number;
}

export interface StaffPerformanceReport {
  period: {
    from: Date;
    to: Date;
    label: string;
  };
  staff: StaffPerformance[];
  totals: {
    totalTransactions: number;
    totalSales: number;
  };
}

// ============== CATEGORY BREAKDOWN ==============
export interface CategorySales {
  categoryId: string;
  categoryName: string;
  parentId?: string;
  quantitySold: number;
  revenue: number;
  percentOfTotal: number;
  orderCount: number;
  rank: number;
}

export interface CategoryBreakdownReport {
  period: {
    from: Date;
    to: Date;
    label: string;
  };
  categories: CategorySales[];
  totals: {
    totalQuantitySold: number;
    totalRevenue: number;
    totalOrders: number;
  };
  uncategorized?: {
    quantitySold: number;
    revenue: number;
    orderCount: number;
  };
}

// ============== REPORT FILTERS ==============
export interface ReportFilters {
  fromDate: Date;
  toDate: Date;
  preset?: DateRangePreset;
  categoryId?: string;
  userId?: string;
  productId?: string;
}

export interface PaginatedReport<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
