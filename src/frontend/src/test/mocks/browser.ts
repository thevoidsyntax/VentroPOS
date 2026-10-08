import { http, HttpResponse } from 'msw';

// Browser-specific handlers (for E2E tests)
export const browserHandlers = [
  http.get('/api/v1/products', () => {
    return HttpResponse.json({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  }),
  http.get('/api/v1/categories', () => {
    return HttpResponse.json([]);
  }),
];
