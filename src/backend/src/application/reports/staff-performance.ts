// Staff Performance Use Case - Application Layer
// Fetches staff/cashier sales performance metrics

import type { FastifyRequest, FastifyReply } from 'fastify';
import { reportRepository } from '../../infrastructure/database/repositories/container.js';
import type { ReportFilters, StaffPerformanceReport, StaffPerformance } from '../../domain/entities/report.js';
import { buildDateRange, getPeriodLabel } from './utils/date-utils.js';

interface StaffPerformanceQuery {
  from?: string;
  to?: string;
  preset?: string;
}

export async function getStaffPerformance(
  request: FastifyRequest<{ Querystring: StaffPerformanceQuery }>,
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

  const staffSales = await reportRepository.getStaffSales(tenantId, filters);

  // Calculate totals
  const totalSales = staffSales.reduce((sum, s) => sum + s.totalSales, 0);
  const totalTransactions = staffSales.reduce((sum, s) => sum + s.transactionCount, 0);

  // Calculate rankings and percentages
  let rank = 1;
  const staff: StaffPerformance[] = staffSales.map(item => {
    const perf: StaffPerformance = {
      userId: item.userId,
      userName: item.userName,
      role: item.role,
      transactionCount: item.transactionCount,
      totalSales: Math.round(item.totalSales * 100) / 100,
      averageOrderValue: item.transactionCount > 0
        ? Math.round((item.totalSales / item.transactionCount) * 100) / 100
        : 0,
      percentOfTotal: totalSales > 0
        ? Math.round((item.totalSales / totalSales) * 10000) / 100
        : 0,
      rank: rank++
    };
    return perf;
  });

  const report: StaffPerformanceReport = {
    period: {
      from: fromDate,
      to: toDate,
      label: getPeriodLabel(fromDate, toDate, preset)
    },
    staff,
    totals: {
      totalTransactions,
      totalSales: Math.round(totalSales * 100) / 100
    }
  };

  return reply.send({ success: true, data: report });
}
