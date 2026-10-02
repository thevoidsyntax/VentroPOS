// Category Breakdown Use Case - Application Layer
// Fetches sales breakdown by product category

import type { FastifyRequest, FastifyReply } from 'fastify';
import { reportRepository } from '../../infrastructure/database/repositories/container.js';
import type { ReportFilters, CategoryBreakdownReport, CategorySales } from '../../domain/entities/report.js';
import { buildDateRange, getPeriodLabel } from './utils/date-utils.js';

interface CategoryBreakdownQuery {
  from?: string;
  to?: string;
  preset?: string;
}

export async function getCategoryBreakdown(
  request: FastifyRequest<{ Querystring: CategoryBreakdownQuery }>,
  reply: FastifyReply
): Promise<void> {
  const tenantId = request.tenantId!;
  const { fromDate, toDate } = buildDateRange(request.query.from, request.query.to, request.query.preset);
  const preset = request.query.preset as ReportFilters['preset'] | undefined;

  const filters: ReportFilters = {
    fromDate,
    toDate,
    preset
  };

  const categorySales = await reportRepository.getCategorySales(tenantId, filters);

  // Calculate totals
  const totalRevenue = categorySales.reduce((sum, c) => sum + c.revenue, 0);
  const totalQuantity = categorySales.reduce((sum, c) => sum + c.quantitySold, 0);
  const totalOrders = categorySales.reduce((sum, c) => sum + c.orderCount, 0);

  // Filter out "uncategorized" placeholder and separate it
  const categorized = categorySales.filter(c => c.categoryId !== 'uncategorized');
  const uncategorized = categorySales.find(c => c.categoryId === 'uncategorized');

  // Calculate rankings and percentages
  let rank = 1;
  const categories: CategorySales[] = categorized.map(item => {
    const cat: CategorySales = {
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      parentId: item.parentId ?? undefined,
      quantitySold: item.quantitySold,
      revenue: Math.round(item.revenue * 100) / 100,
      percentOfTotal: totalRevenue > 0
        ? Math.round((item.revenue / totalRevenue) * 10000) / 100
        : 0,
      orderCount: item.orderCount,
      rank: rank++
    };
    return cat;
  });

  const report: CategoryBreakdownReport = {
    period: {
      from: fromDate,
      to: toDate,
      label: getPeriodLabel(fromDate, toDate, preset)
    },
    categories,
    totals: {
      totalQuantitySold: totalQuantity,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders
    },
    uncategorized: uncategorized
      ? {
          quantitySold: uncategorized.quantitySold,
          revenue: Math.round(uncategorized.revenue * 100) / 100,
          orderCount: uncategorized.orderCount
        }
      : undefined
  };

  return reply.send({ success: true, data: report });
}
