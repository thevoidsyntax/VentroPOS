// Repository Container - Singleton Dependency Injection
// Centralized repository instances for consistent state across the application

import {
  PostgresTenantRepository,
  PostgresUserRepository,
  PostgresProductRepository,
  PostgresCategoryRepository,
  PostgresTableRepository,
  PostgresModifierGroupRepository,
  PostgresModifierRepository,
  PostgresOrderRepository,
  PostgresTransactionRepository,
  PostgresStockLogRepository,
  PostgresIdempotencyKeyRepository,
} from './index.js';

// Singleton instances - created once, reused across all requests
export const tenantRepository = new PostgresTenantRepository();
export const userRepository = new PostgresUserRepository();
export const productRepository = new PostgresProductRepository();
export const categoryRepository = new PostgresCategoryRepository();
export const tableRepository = new PostgresTableRepository();
export const modifierGroupRepository = new PostgresModifierGroupRepository();
export const modifierRepository = new PostgresModifierRepository();
export const orderRepository = new PostgresOrderRepository();
export const transactionRepository = new PostgresTransactionRepository();
export const stockLogRepository = new PostgresStockLogRepository();
export const idempotencyKeyRepository = new PostgresIdempotencyKeyRepository();
