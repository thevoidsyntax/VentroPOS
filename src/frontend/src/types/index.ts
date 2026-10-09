// Re-export types from API
export type {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Table,
  Transaction,
  ProductFilters,
  CreateProductData,
  UpdateProductData,
  CreateOrderData,
  CheckoutData,
  PaymentData,
  AuthResponse,
  RegisterData,
  ReportFilters,
  SalesReport,
  ProductReport,
  StaffReport,
  CategoryBreakdown,
  PaginatedResponse,
  Modifier,
  ModifierGroup,
  CreateModifierGroupData,
  UpdateModifierGroupData,
  CreateModifierData,
  UpdateModifierData,
} from '@/lib/api';

// Cart types are exported from cart-store
export type { CartItem, CartModifier } from '@/stores/cart-store';
