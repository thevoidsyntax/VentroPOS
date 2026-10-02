// Report Routes - API Layer
// Endpoints for analytics and reporting

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getSalesSummary,
  getProductPerformance,
  getStaffPerformance,
  getCategoryBreakdown,
  exportReport
} from '../../application/reports/index.js';
import { authMiddleware } from '../middleware/index.js';

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  // Sales Summary - GET /api/v1/reports/sales
  fastify.get('/sales', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return getSalesSummary(request as Parameters<typeof getSalesSummary>[0], reply);
  });

  // Product Performance - GET /api/v1/reports/products
  fastify.get('/products', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return getProductPerformance(request as Parameters<typeof getProductPerformance>[0], reply);
  });

  // Staff Performance - GET /api/v1/reports/staff
  fastify.get('/staff', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return getStaffPerformance(request as Parameters<typeof getStaffPerformance>[0], reply);
  });

  // Category Breakdown - GET /api/v1/reports/categories
  fastify.get('/categories', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return getCategoryBreakdown(request as Parameters<typeof getCategoryBreakdown>[0], reply);
  });

  // Export Report - GET /api/v1/reports/export
  fastify.get('/export', {
    onRequest: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return exportReport(request as Parameters<typeof exportReport>[0], reply);
  });
}
