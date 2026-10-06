// Zod Schemas - API Input Validation
// Barrel file that re-exports all schemas

// Auth schemas
export { registerSchema, loginSchema, refreshTokenSchema } from './auth.js';

// User schemas
export {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
  changePasswordSchema,
  adminResetPasswordSchema,
} from './user.js';

// Product schemas
export {
  createProductSchema,
  updateProductSchema,
  productIdParamsSchema,
  productQuerySchema,
} from './product.js';

// Category schemas
export {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamsSchema,
} from './category.js';

// Table schemas
export {
  createTableSchema,
  updateTableSchema,
  tableIdParamsSchema,
  tableLayoutQuerySchema,
} from './table.js';

// Order schemas
export {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParamsSchema,
  orderQuerySchema,
  getOrdersQuerySchema,
  checkoutSchema,
  voidOrderSchema,
} from './order.js';

// Modifier schemas
export {
  createModifierGroupSchema,
  updateModifierGroupSchema,
  modifierGroupIdParamsSchema,
  createModifierSchema,
  updateModifierSchema,
  modifierIdParamsSchema,
} from './modifier.js';
