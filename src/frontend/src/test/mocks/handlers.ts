import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { Product, Category, Order, User } from '@/lib/api';

// Mock data
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Kopi Hitam',
    description: 'Kopi hitam original',
    price: 15000,
    categoryId: 'cat-1',
    stock: 50,
    lowStockThreshold: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Kopi Susu',
    description: 'Kopi dengan susu',
    price: 20000,
    categoryId: 'cat-1',
    stock: 30,
    lowStockThreshold: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Teh Manis',
    description: 'Teh manis tradisional',
    price: 10000,
    categoryId: 'cat-2',
    stock: 5,
    lowStockThreshold: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Kopi', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Teh', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Makanan', sortOrder: 3, isActive: true },
];

export const mockUser: User = {
  id: 'user-1',
  email: 'admin@ventropos.com',
  name: 'Admin User',
  role: 'admin',
  tenantId: 'tenant-1',
  isActive: true,
  createdAt: new Date().toISOString(),
};

// API handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'admin@ventropos.com' && body.password === 'admin123') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      });
    }
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/v1/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Products endpoints
  http.get('/api/v1/products', ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');

    let products = [...mockProducts];
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }

    return HttpResponse.json({
      data: products,
      pagination: {
        page: 1,
        limit: 20,
        total: products.length,
        totalPages: 1,
      },
    });
  }),

  http.get('/api/v1/products/:id', ({ params }) => {
    const product = mockProducts.find(p => p.id === params.id);
    if (!product) {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return HttpResponse.json(product);
  }),

  // Categories endpoints
  http.get('/api/v1/categories', () => {
    return HttpResponse.json(mockCategories);
  }),

  // Orders endpoints
  http.get('/api/v1/orders', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const orders: Order[] = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'completed',
        userId: 'user-1',
        items: [],
        subtotal: 30000,
        tax: 3300,
        discount: 0,
        total: 33300,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-002',
        status: 'pending',
        userId: 'user-1',
        items: [],
        subtotal: 50000,
        tax: 5500,
        discount: 0,
        total: 55500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    let filtered = orders;
    if (status) {
      filtered = orders.filter(o => o.status === status);
    }

    return HttpResponse.json({
      data: filtered,
      pagination: {
        page: 1,
        limit: 20,
        total: filtered.length,
        totalPages: 1,
      },
    });
  }),

  http.get('/api/v1/orders/:id', ({ params }) => {
    const order = {
      id: params.id,
      orderNumber: 'ORD-001',
      status: 'completed',
      userId: 'user-1',
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          quantity: 2,
          unitPrice: 15000,
          subtotal: 30000,
        },
      ],
      subtotal: 30000,
      tax: 3300,
      discount: 0,
      total: 33300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(order);
  }),

  http.post('/api/v1/orders', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'order-new',
      orderNumber: 'ORD-NEW',
      status: 'pending',
      userId: 'user-1',
      items: body.items,
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post('/api/v1/orders/:id/checkout', ({ params }) => {
    return HttpResponse.json({
      id: 'txn-1',
      orderId: params.id,
      payments: [{ method: 'cash', amount: 33300 }],
      total: 33300,
      paidAmount: 35000,
      changeAmount: 1700,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
  }),

  http.post('/api/v1/orders/:id/void', async ({ request }) => {
    const body = await request.json() as { reason: string };
    return HttpResponse.json({
      id: 'order-1',
      orderNumber: 'ORD-001',
      status: 'void',
      voidReason: body.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  // Stock endpoints
  http.get('/api/v1/stock/overview', () => {
    return HttpResponse.json({
      totalProducts: 25,
      inStock: 20,
      lowStock: 3,
      outOfStock: 2,
      totalValue: 5000000,
    });
  }),

  http.get('/api/v1/stock/alerts', () => {
    return HttpResponse.json([
      {
        id: 'alert-1',
        productId: 'prod-3',
        product: mockProducts[2],
        type: 'low',
        currentStock: 5,
        threshold: 10,
      },
    ]);
  }),

  // Reports endpoints
  http.get('/api/v1/reports/sales', () => {
    return HttpResponse.json({
      totalOrders: 150,
      totalSales: 15000000,
      totalTax: 1650000,
      totalDiscount: 500000,
      averageOrderValue: 100000,
      topProducts: [
        { productId: 'prod-1', name: 'Kopi Hitam', quantity: 100, revenue: 1500000 },
        { productId: 'prod-2', name: 'Kopi Susu', quantity: 80, revenue: 1600000 },
      ],
      hourlyBreakdown: [],
      dailyBreakdown: [],
    });
  }),
];

// Create MSW server
export const server = setupServer(...handlers);
