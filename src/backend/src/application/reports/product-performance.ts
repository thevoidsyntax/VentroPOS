// Product Performance Use Case - Application Layer
// Fetches product sales performance metrics

import type { FastifyRequest, FastifyReply } from 'fastify';
import { reportRepository } from '../../infrastructure/database/repositories/container.js';
import type { ReportFilters, ProductPerformanceReport, ProductPerformance } from '../../domain/entities/report.js';
import { buildDateRange, getPeriodLabel } from './utils/date-utils.js';

interface ProductPerformanceQuery {
  from?: string;
  to?: string;
  preset?: string;
  limit?: string;
  categoryId?: string;
}

export async function getProductPerformance(
  request: FastifyRequest<{ Querystring: ProductPerformanceQuery }>,
  reply: FastifyReply
): Promise<void> {
  const tenantId = request.tenantId!;
  const { fromDate, toDate } = buildDateRange(request.query.from, request.query.to, request.query.preset);
  const preset = request.query.preset as ReportFilters['preset'] | undefined;
  const limit = Math.min(parseInt(request.query.limit ?? '20', 10), 100);

  const filters: ReportFilters = {
    fromDate,
    toDate,
    preset,
    categoryId: request.query.categoryId
  };

  // Fetch data in parallel
  const [productSales, totals] = await Promise.all([
    reportRepository.getProductSales(tenantId, filters, limit),
    reportRepository.getProductSalesTotal(tenantId, filters)
  ]);

  // Calculate rankings and percentages
  let rank = 1;
  const products: ProductPerformance[] = productSales.map(item => {
    const perf: ProductPerformance = {
      productId: item.productId,
      productName: item.productName,
      categoryId: item.categoryId ?? undefined,
      categoryName: item.categoryName ?? undefined,
      quantitySold: item.quantitySold,
      revenue: Math.round(item.revenue * 100) / 100,
      averagePrice: item.quantitySold > 0
        ? Math.round((item.revenue / item.quantitySold) * 100) / 100
        : 0,
      percentOfTotal: totals.revenue > 0
        ? Math.round((item.revenue / totals.revenue) * 10000) / 100
        : 0,
      rank: rank++
    };
    return perf;
  });

  const report: ProductPerformanceReport = {
    period: {
      from: fromDate,
      to: toDate,
      label: getPeriodLabel(fromDate, toDate, preset)
    },
    products,
    totals: {
      totalQuantitySold: totals.quantity,
      totalRevenue: Math.round(totals.revenue * 100) / 100
    },
    topMovers: products.length > 0
      ? {
          mostSold: products.slice(0, 5),
          leastSold: products.slice(-5).reverse()
        }
      : undefined
  };

  return reply.send({ success: true, data: report });
}
