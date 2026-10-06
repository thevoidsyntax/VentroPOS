// Export Report Use Case - Application Layer
// Exports report data to CSV format

import type { FastifyRequest, FastifyReply } from 'fastify';
import { reportRepository } from '../../infrastructure/database/repositories/container.js';
import type { ReportFilters } from '../../domain/entities/report.js';
import { buildDateRange, getPeriodLabel } from './utils/date-utils.js';

type ExportType = 'sales' | 'products' | 'staff' | 'categories';

interface ExportQuery {
  type: string;
  from?: string;
  to?: string;
  preset?: string;
}

export async function exportReport(
  request: FastifyRequest<{ Querystring: ExportQuery }>,
  reply: FastifyReply
): Promise<void> {
  const tenantId = request.tenantId!;
  const exportType = request.query.type as ExportType;

  if (!['sales', 'products', 'staff', 'categories'].includes(exportType)) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'INVALID_EXPORT_TYPE',
        message: 'Export type must be one of: sales, products, staff, categories'
      }
    });
  }

  const { fromDate, toDate } = buildDateRange(request.query.from, request.query.to, request.query.preset);
  const preset = request.query.preset as ReportFilters['preset'] | undefined;

  const filters: ReportFilters = {
    fromDate,
    toDate,
    preset
  };

  let csvContent = '';
  let filename = '';

  switch (exportType) {
    case 'sales': {
      const [metrics, paymentMethods] = await Promise.all([
        reportRepository.getSalesMetrics(tenantId, filters),
        reportRepository.getPaymentMethodBreakdown(tenantId, filters)
      ]);

      filename = `sales-report-${getPeriodLabel(fromDate, toDate, preset).replace(/\s/g, '-')}.csv`;

      // Header
      csvContent = 'Sales Report\n';
      csvContent += `Period,${getPeriodLabel(fromDate, toDate, preset)}\n\n`;

      // Metrics
      csvContent += 'Metric,Value\n';
      csvContent += `Total Revenue,"${metrics.totalRevenue.toFixed(2)}"\n`;
      csvContent += `Gross Revenue,"${metrics.grossRevenue.toFixed(2)}"\n`;
      csvContent += `Total Discount,"${metrics.totalDiscount.toFixed(2)}"\n`;
      csvContent += `Total Tax,"${metrics.totalTax.toFixed(2)}"\n`;
      csvContent += `Transaction Count,"${metrics.transactionCount}"\n`;
      csvContent += `Total Items Sold,"${metrics.totalItemsSold}"\n`;
      csvContent += `Average Order Value,"${metrics.transactionCount > 0 ? (metrics.totalRevenue / metrics.transactionCount).toFixed(2) : '0.00'}"\n\n`;

      // Payment Methods
      csvContent += 'Payment Method,Count,Amount\n';
      for (const pm of paymentMethods) {
        csvContent += `${pm.method},"${pm.count}","${pm.amount.toFixed(2)}"\n`;
      }
      break;
    }

    case 'products': {
      const [products, totals] = await Promise.all([
        reportRepository.getProductSales(tenantId, filters, 1000),
        reportRepository.getProductSalesTotal(tenantId, filters)
      ]);

      filename = `product-performance-${getPeriodLabel(fromDate, toDate, preset).replace(/\s/g, '-')}.csv`;

      csvContent = 'Product Performance Report\n';
      csvContent += `Period,${getPeriodLabel(fromDate, toDate, preset)}\n\n`;
      csvContent += 'Rank,Product Name,Category,Quantity Sold,Revenue,% of Total,Average Price\n';
      let rank = 1;
      for (const p of products) {
        const percentOfTotal = totals.revenue > 0 ? ((p.revenue / totals.revenue) * 100).toFixed(2) : '0.00';
        const avgPrice = p.quantitySold > 0 ? (p.revenue / p.quantitySold).toFixed(2) : '0.00';
        csvContent += `"${rank}","${p.productName}","${p.categoryName ?? 'N/A'}","${p.quantitySold}","${p.revenue.toFixed(2)}","${percentOfTotal}%","${avgPrice}"\n`;
        rank++;
      }
      break;
    }

    case 'staff': {
      const staffSales = await reportRepository.getStaffSales(tenantId, filters);
      const totalSales = staffSales.reduce((sum, s) => sum + s.totalSales, 0);

      filename = `staff-performance-${getPeriodLabel(fromDate, toDate, preset).replace(/\s/g, '-')}.csv`;

      csvContent = 'Staff Performance Report\n';
      csvContent += `Period,${getPeriodLabel(fromDate, toDate, preset)}\n\n`;
      csvContent += 'Rank,Staff Name,Role,Transactions,Total Sales,% of Total,AOV\n';
      let rank = 1;
      for (const s of staffSales) {
        const percentOfTotal = totalSales > 0 ? ((s.totalSales / totalSales) * 100).toFixed(2) : '0.00';
        const aov = s.transactionCount > 0 ? (s.totalSales / s.transactionCount).toFixed(2) : '0.00';
        csvContent += `"${rank}","${s.userName}","${s.role}","${s.transactionCount}","${s.totalSales.toFixed(2)}","${percentOfTotal}%","${aov}"\n`;
        rank++;
      }
      break;
    }

    case 'categories': {
      const categorySales = await reportRepository.getCategorySales(tenantId, filters);
      const totalRevenue = categorySales.reduce((sum, c) => sum + c.revenue, 0);

      filename = `category-breakdown-${getPeriodLabel(fromDate, toDate, preset).replace(/\s/g, '-')}.csv`;

      csvContent = 'Category Breakdown Report\n';
      csvContent += `Period,${getPeriodLabel(fromDate, toDate, preset)}\n\n`;
      csvContent += 'Rank,Category,Quantity Sold,Revenue,% of Total,Order Count\n';
      let rank = 1;
      for (const c of categorySales.filter(cat => cat.categoryId !== 'uncategorized')) {
        const percentOfTotal = totalRevenue > 0 ? ((c.revenue / totalRevenue) * 100).toFixed(2) : '0.00';
        csvContent += `"${rank}","${c.categoryName}","${c.quantitySold}","${c.revenue.toFixed(2)}","${percentOfTotal}%","${c.orderCount}"\n`;
        rank++;
      }
      break;
    }
  }

  const blob = Buffer.from(csvContent, 'utf-8');

  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(blob);
}
