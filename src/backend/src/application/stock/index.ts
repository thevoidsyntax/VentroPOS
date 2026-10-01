// Stock Application Service - Inventory Use Cases
// Simplified DDD: Stock management operations

import type { Product, StockLog } from '../../domain/entities/index.js';
import type { IProductRepository, IStockLogRepository } from '../../domain/repositories/index.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/index.js';

// ============== STOCK ALERT ==============

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  severity: 'warning' | 'critical';
}

export class GetStockAlertsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string): Promise<StockAlert[]> {
    const products = await this.productRepo.findAll(tenantId, { isActive: true, lowStock: true });

    return products.map(product => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQuantity,
      threshold: product.lowStockThreshold,
      severity: product.stockQuantity === 0 ? 'critical' : 'warning',
    }));
  }
}

// ============== RECEIVE STOCK (RESTOCK) ==============

export interface ReceiveStockInput {
  productId: string;
  quantity: number;
  notes?: string;
  referenceNumber?: string;
}

export class ReceiveStockUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    input: ReceiveStockInput
  ): Promise<{ product: Product; stockLog: StockLog }> {
    // Validate product exists
    const product = await this.productRepo.findById(tenantId, input.productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${input.productId}'`);
    }

    if (!product.isActive) {
      throw new BusinessRuleError('Cannot receive stock for inactive product');
    }

    if (input.quantity <= 0) {
      throw new BusinessRuleError('Quantity must be positive');
    }

    // Calculate new stock
    const newQuantity = product.stockQuantity + input.quantity;

    // Update product stock
    const updatedProduct = await this.productRepo.updateStock(tenantId, input.productId, newQuantity);

    // Create stock log
    const stockLog = await this.stockLogRepo.create(tenantId, {
      tenantId,
      productId: input.productId,
      type: 'restock',
      quantity: input.quantity,
      balanceAfter: newQuantity,
      referenceType: 'manual',
      notes: input.notes,
      userId,
    });

    return { product: updatedProduct, stockLog };
  }
}

// ============== ADJUST STOCK (MANUAL CORRECTION) ==============

export interface AdjustStockInput {
  productId: string;
  newQuantity: number;
  reason: string;
  referenceNumber?: string;
}

export class AdjustStockUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    input: AdjustStockInput
  ): Promise<{ product: Product; stockLog: StockLog }> {
    // Validate product exists
    const product = await this.productRepo.findById(tenantId, input.productId);

    if (!product) {
      throw new NotFoundError(`Product with id '${input.productId}'`);
    }

    if (!product.isActive) {
      throw new BusinessRuleError('Cannot adjust stock for inactive product');
    }

    if (input.newQuantity < 0) {
      throw new BusinessRuleError('Stock quantity cannot be negative');
    }

    // Calculate adjustment
    const adjustment = input.newQuantity - product.stockQuantity;

    // Update product stock
    const updatedProduct = await this.productRepo.updateStock(tenantId, input.productId, input.newQuantity);

    // Create stock log
    const stockLog = await this.stockLogRepo.create(tenantId, {
      tenantId,
      productId: input.productId,
      type: 'adjustment',
      quantity: adjustment,
      balanceAfter: input.newQuantity,
      referenceType: 'manual',
      notes: input.reason,
      userId,
    });

    return { product: updatedProduct, stockLog };
  }
}

// ============== GET STOCK HISTORY ==============

export interface GetStockHistoryInput {
  productId?: string;
  fromDate?: Date;
  toDate?: Date;
  type?: StockLog['type'];
}

export class GetStockHistoryUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository
  ) {}

  async execute(tenantId: string, input: GetStockHistoryInput = {}): Promise<{
    logs: StockLog[];
    meta: {
      productName?: string;
    };
  }> {
    let productName: string | undefined;

    // Validate product if specified
    if (input.productId) {
      const product = await this.productRepo.findById(tenantId, input.productId);
      if (!product) {
        throw new NotFoundError(`Product with id '${input.productId}'`);
      }
      productName = product.name;
    }

    const logs = await this.stockLogRepo.findAll(tenantId, {
      productId: input.productId,
      type: input.type,
      fromDate: input.fromDate,
      toDate: input.toDate,
    });

    return {
      logs,
      meta: { productName },
    };
  }
}

// ============== GET STOCK OVERVIEW ==============

export interface StockOverviewItem {
  product: Product;
  lowStock: boolean;
  outOfStock: boolean;
}

export class GetStockOverviewUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string): Promise<{
    items: StockOverviewItem[];
    summary: {
      totalProducts: number;
      inStock: number;
      lowStock: number;
      outOfStock: number;
    };
  }> {
    const products = await this.productRepo.findAll(tenantId, { isActive: true });

    const items: StockOverviewItem[] = products.map(product => ({
      product,
      lowStock: product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold,
      outOfStock: product.stockQuantity === 0,
    }));

    return {
      items,
      summary: {
        totalProducts: items.length,
        inStock: items.filter(i => !i.lowStock && !i.outOfStock).length,
        lowStock: items.filter(i => i.lowStock).length,
        outOfStock: items.filter(i => i.outOfStock).length,
      },
    };
  }
}
