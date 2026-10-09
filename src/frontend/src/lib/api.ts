import { useAuthStore } from '@/stores/auth-store';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Use absolute URL construction for proxy
    const baseUrl = this.baseUrl.startsWith('http')
      ? this.baseUrl
      : (this.baseUrl.startsWith('/') ? this.baseUrl : `/${this.baseUrl}`);
    const urlString = endpoint.startsWith('/')
      ? `${baseUrl}${endpoint}`
      : `${baseUrl}/${endpoint}`;
    const url = new URL(urlString, window.location.origin);

    // Handle query params
    if (options.params) {
      Object.entries(options.params).forEach(
        ([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        }
      );
    }

    const { params: _params, ...fetchOptions } = options;

    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(),
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An error occurred',
        status: response.status,
      }));
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    login: (email: string, password: string) =>
      this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: RegisterData) =>
      this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    refresh: (refreshToken: string) =>
      this.request<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
    logout: () =>
      this.request<void>('/auth/logout', { method: 'POST' }),
  };

  // Products endpoints
  products = {
    list: (params?: ProductFilters) =>
      this.request<PaginatedResponse<Product>>('/products', { params: params as unknown as Record<string, string | number | boolean | undefined> }),
    get: (id: string) =>
      this.request<Product>(`/products/${id}`),
    create: (data: CreateProductData) =>
      this.request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateProductData) =>
      this.request<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<void>(`/products/${id}`, { method: 'DELETE' }),
  };

  // Categories endpoints
  categories = {
    list: () =>
      this.request<Category[]>('/categories'),
    get: (id: string) =>
      this.request<Category>(`/categories/${id}`),
    create: (data: CreateCategoryData) =>
      this.request<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateCategoryData) =>
      this.request<Category>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<void>(`/categories/${id}`, { method: 'DELETE' }),
  };

  // Orders endpoints
  orders = {
    list: (params?: OrderFilters) =>
      this.request<PaginatedResponse<Order>>('/orders', { params: params as unknown as Record<string, string | number | boolean | undefined> }),
    get: (id: string) =>
      this.request<Order>(`/orders/${id}`),
    create: (data: CreateOrderData) =>
      this.request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkout: (id: string, data: CheckoutData) =>
      this.request<Transaction>(`/orders/${id}/checkout`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'X-Idempotency-Key': crypto.randomUUID(),
        },
      }),
    updateStatus: (id: string, status: OrderStatus) =>
      this.request<Order>(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    void: (id: string, reason: string) =>
      this.request<Order>(`/orders/${id}/void`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  };

  // Tables endpoints
  tables = {
    list: () =>
      this.request<Table[]>('/tables'),
    get: (id: string) =>
      this.request<Table>(`/tables/${id}`),
    create: (data: CreateTableData) =>
      this.request<Table>('/tables', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTableData) =>
      this.request<Table>(`/tables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<void>(`/tables/${id}`, { method: 'DELETE' }),
    occupy: (id: string, orderId: string) =>
      this.request<Table>(`/tables/${id}/occupy`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      }),
    release: (id: string) =>
      this.request<Table>(`/tables/${id}/release`, {
        method: 'POST',
      }),
  };

  // Stock endpoints
  stock = {
    overview: () =>
      this.request<StockOverview>('/stock/overview'),
    alerts: () =>
      this.request<StockAlert[]>('/stock/alerts'),
    adjust: (productId: string, quantity: number, reason: string) =>
      this.request<void>('/stock/adjust', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, reason }),
      }),
    receive: (data: ReceiveStockData) =>
      this.request<void>('/stock/receive', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Reports endpoints
  reports = {
    sales: (params?: ReportFilters) =>
      this.request<SalesReport>('/reports/sales', { params: params as unknown as Record<string, string | number | boolean | undefined> }),
    products: (params?: ReportFilters) =>
      this.request<ProductReport>('/reports/products', { params: params as unknown as Record<string, string | number | boolean | undefined> }),
    staff: (params?: ReportFilters) =>
      this.request<StaffReport[]>('/reports/staff', { params: params as unknown as Record<string, string | number | boolean | undefined> }),
    categoryBreakdown: (params?: ReportFilters) =>
      this.request<CategoryBreakdown[]>('/reports/categories', { params: params as unknown as Record<string, string | number | boolean | undefined> }),
  };

  // Users endpoints
  users = {
    list: () =>
      this.request<User[]>('/users'),
    get: (id: string) =>
      this.request<User>(`/users/${id}`),
    create: (data: CreateUserData) =>
      this.request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateUserData) =>
      this.request<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deactivate: (id: string) =>
      this.request<void>(`/users/${id}/deactivate`, {
        method: 'POST',
      }),
  };

  // Modifiers endpoints
  modifiers = {
    listGroups: () =>
      this.request<ModifierGroup[]>('/modifiers/groups'),
    getGroup: (id: string) =>
      this.request<ModifierGroup>(`/modifiers/groups/${id}`),
    createGroup: (data: CreateModifierGroupData) =>
      this.request<ModifierGroup>('/modifiers/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateGroup: (id: string, data: UpdateModifierGroupData) =>
      this.request<ModifierGroup>(`/modifiers/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteGroup: (id: string) =>
      this.request<void>(`/modifiers/groups/${id}`, { method: 'DELETE' }),
    listModifiers: (groupId: string) =>
      this.request<Modifier[]>(`/modifiers/groups/${groupId}/modifiers`),
    createModifier: (groupId: string, data: CreateModifierData) =>
      this.request<Modifier>(`/modifiers/groups/${groupId}/modifiers`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateModifier: (id: string, data: UpdateModifierData) =>
      this.request<Modifier>(`/modifiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteModifier: (id: string) =>
      this.request<void>(`/modifiers/${id}`, { method: 'DELETE' }),
  };
}

export const api = new ApiClient(API_BASE);

// Type definitions
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  outletName: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
}

export interface UpdateUserData {
  name?: string;
  role?: 'admin' | 'manager' | 'cashier';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId: string;
  category?: Category;
  sku?: string;
  imageUrl?: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId: string;
  sku?: string;
  imageUrl?: string;
  stock?: number;
  lowStockThreshold?: number;
  modifierGroupIds?: string[];
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  categoryId?: string;
  sku?: string;
  imageUrl?: string;
  stock?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  modifierGroupIds?: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'void';

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  tableId?: string;
  table?: Table;
  userId: string;
  user?: User;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  modifiers?: OrderModifier[];
  notes?: string;
  subtotal: number;
}

export interface OrderModifier {
  id: string;
  modifierId: string;
  modifier?: Modifier;
  name: string;
  price: number;
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  modifierGroupId: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  tableId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateOrderData {
  tableId?: string;
  items: CreateOrderItemData[];
  notes?: string;
}

export interface CreateOrderItemData {
  productId: string;
  quantity: number;
  modifiers?: { modifierId: string }[];
  notes?: string;
}

export interface CheckoutData {
  payments: PaymentData[];
  taxRate?: number;
  discountAmount?: number;
}

export interface PaymentData {
  method: 'cash' | 'qris' | 'debit' | 'credit';
  amount: number;
  reference?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  payments: PaymentData[];
  total: number;
  paidAmount: number;
  changeAmount: number;
  status: 'completed' | 'pending' | 'failed';
  receiptUrl?: string;
  createdAt: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  orderId?: string;
  position?: { x: number; y: number };
}

export interface CreateTableData {
  name: string;
  capacity: number;
  position?: { x: number; y: number };
}

export interface UpdateTableData {
  name?: string;
  capacity?: number;
  position?: { x: number; y: number };
}

export interface StockOverview {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface StockAlert {
  id: string;
  productId: string;
  product: Product;
  type: 'low' | 'out';
  currentStock: number;
  threshold: number;
}

export interface ReceiveStockData {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  categoryId?: string;
  userId?: string;
}

export interface SalesReport {
  totalOrders: number;
  totalSales: number;
  totalTax: number;
  totalDiscount: number;
  averageOrderValue: number;
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  hourlyBreakdown: { hour: number; orders: number; sales: number }[];
  dailyBreakdown: { date: string; orders: number; sales: number }[];
}

export interface ProductReport {
  products: { productId: string; name: string; quantity: number; revenue: number; avgPrice: number }[];
  categories: { categoryId: string; name: string; quantity: number; revenue: number }[];
}

export interface StaffReport {
  userId: string;
  userName: string;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  percentage: number;
}

export type ModifierGroupType = 'size' | 'extras' | 'topping' | 'custom';

export interface ModifierGroup {
  id: string;
  name: string;
  type: ModifierGroupType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
  createdAt: string;
}

export interface CreateModifierGroupData {
  name: string;
  type: ModifierGroupType;
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
}

export interface UpdateModifierGroupData {
  name?: string;
  type?: ModifierGroupType;
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
}

export interface CreateModifierData {
  name: string;
  priceAdjustment?: number;
  sortOrder?: number;
}

export interface UpdateModifierData {
  name?: string;
  priceAdjustment?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
