// Sales Summary Use Case - Application Layer
// Fetches comprehensive sales metrics for a given period

import type { FastifyRequest, FastifyReply } from 'fastify';
import { reportRepository } from '../../infrastructure/database/repositories/container.js';
import type { ReportFilters, SalesSummary } from '../../domain/entities/report.js';
import { buildDateRange, getPeriodLabel } from './utils/date-utils.js';

interface SalesSummaryQuery {
  from?: string;
  to?: string;
  preset?: string;
}

export async function getSalesSummary(
  request: FastifyRequest<{ Querystring: SalesSummaryQuery }>,
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

  // Run all queries in parallel for better performance
  const [metrics, paymentMethods, hourlySales, previousRevenue] = await Promise.all([
    reportRepository.getSalesMetrics(tenantId, filters),
    reportRepository.getPaymentMethodBreakdown(tenantId, filters),
    reportRepository.getHourlySales(tenantId, filters),
    reportRepository.getPreviousPeriodRevenue(tenantId, filters)
  ]);

  const averageOrderValue = metrics.transactionCount > 0
    ? metrics.totalRevenue / metrics.transactionCount
    : 0;

  const revenueChangePercent = previousRevenue > 0
    ? ((metrics.totalRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  const summary: SalesSummary = {
    period: {
      from: fromDate,
      to: toDate,
      label: getPeriodLabel(fromDate, toDate, preset)
    },
    metrics: {
      totalRevenue: Math.round(metrics.totalRevenue * 100) / 100,
      grossRevenue: Math.round(metrics.grossRevenue * 100) / 100,
      totalDiscount: Math.round(metrics.totalDiscount * 100) / 100,
      totalTax: Math.round(metrics.totalTax * 100) / 100,
      transactionCount: metrics.transactionCount,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalItemsSold: metrics.totalItemsSold
    },
    byPaymentMethod: paymentMethods,
    byHour: hourlySales,
    comparison: {
      previousPeriodRevenue: Math.round(previousRevenue * 100) / 100,
      revenueChangePercent: Math.round(revenueChangePercent * 100) / 100
    }
  };

  return reply.send({ success: true, data: summary });
}
