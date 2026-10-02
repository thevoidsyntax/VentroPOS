// Stock Application Service - Inventory Use Cases
// Simplified DDD: Stock management operations

import type { Product, StockLog, StockOpname, StockOpnameItem, StockOpnameStatus } from '../../domain/entities/index.js';
import type { IProductRepository, IStockLogRepository, IStockOpnameRepository } from '../../domain/repositories/index.js';
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

// ============== STOCK OPNAME USE CASES ==============

// Create Stock Opname (Start new stocktake session)
export interface CreateStockOpnameInput {
  notes?: string;
  productIds?: string[]; // If empty, include all active products
}

export class CreateStockOpnameUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockOpnameRepo: IStockOpnameRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    input: CreateStockOpnameInput = {}
  ): Promise<{ opname: StockOpname; items: StockOpnameItem[] }> {
    // Get products to include in opname
    const products = input.productIds?.length
      ? await Promise.all(
          input.productIds.map(id => this.productRepo.findById(tenantId, id))
        )
      : await this.productRepo.findAll(tenantId, { isActive: true });

    const validProducts = products.filter((p): p is Product => p !== null);

    if (validProducts.length === 0) {
      throw new BusinessRuleError('No products found for stock opname');
    }

    // Create stock opname
    const opname = await this.stockOpnameRepo.create(tenantId, {
      tenantId,
      userId,
      status: 'in_progress',
      items: [],
      notes: input.notes,
    });

    // Create items for each product with system quantity
    const items = await this.stockOpnameRepo.createItem(tenantId, {
      opnameId: opname.id,
      productId: validProducts[0].id,
      systemQuantity: validProducts[0].stockQuantity,
      actualQuantity: validProducts[0].stockQuantity,
      variance: 0,
    });

    // Batch create remaining items
    const remainingItems = validProducts.length > 1
      ? await this.stockOpnameRepo.updateItemBatch(
          tenantId,
          opname.id,
          validProducts.slice(1).map(p => ({
            productId: p.id,
            actualQuantity: p.stockQuantity,
          }))
        )
      : [];

    return {
      opname,
      items: [items, ...remainingItems],
    };
  }
}

// Record Stock Count (Update actual count for an item)
export interface RecordStockCountInput {
  productId: string;
  actualQuantity: number;
  notes?: string;
}

export class RecordStockCountUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(
    tenantId: string,
    opnameId: string,
    input: RecordStockCountInput
  ): Promise<StockOpnameItem> {
    const items = await this.stockOpnameRepo.getItems(tenantId, opnameId);
    const item = items.find(i => i.productId === input.productId);

    if (!item) {
      throw new NotFoundError(`Product '${input.productId}' not found in stock opname`);
    }

    const updatedItem = await this.stockOpnameRepo.updateItem(tenantId, item.id, {
      actualQuantity: input.actualQuantity,
      notes: input.notes,
      variance: input.actualQuantity - item.systemQuantity,
    });

    return updatedItem;
  }
}

// Batch Record Stock Counts
export class BatchRecordStockCountUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(
    tenantId: string,
    opnameId: string,
    counts: Array<{ productId: string; actualQuantity: number; notes?: string }>
  ): Promise<StockOpnameItem[]> {
    return this.stockOpnameRepo.updateItemBatch(tenantId, opnameId, counts);
  }
}

// Submit Stock Opname (Complete and apply adjustments)
export interface SubmitStockOpnameInput {
  applyAdjustments: boolean;
}

export class SubmitStockOpnameUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLogRepo: IStockLogRepository,
    private stockOpnameRepo: IStockOpnameRepository
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    opnameId: string,
    input: SubmitStockOpnameInput
  ): Promise<{ opname: StockOpname; adjustments: Array<{ productId: string; oldQty: number; newQty: number }> }> {
    const opname = await this.stockOpnameRepo.findById(tenantId, opnameId);

    if (!opname) {
      throw new NotFoundError(`Stock opname '${opnameId}' not found`);
    }

    if (opname.status === 'completed') {
      throw new BusinessRuleError('Stock opname is already completed');
    }

    if (opname.status === 'cancelled') {
      throw new BusinessRuleError('Stock opname is cancelled');
    }

    const items = await this.stockOpnameRepo.getItems(tenantId, opnameId);

    const adjustments: Array<{ productId: string; oldQty: number; newQty: number }> = [];

    if (input.applyAdjustments) {
      for (const item of items) {
        if (item.actualQuantity !== item.systemQuantity) {
          await this.productRepo.updateStock(tenantId, item.productId, item.actualQuantity);

          await this.stockLogRepo.create(tenantId, {
            tenantId,
            productId: item.productId,
            type: 'adjustment',
            quantity: item.variance,
            balanceAfter: item.actualQuantity,
            referenceType: 'stock_opname',
            referenceId: opnameId,
            notes: `Stock opname adjustment: ${item.notes || 'Physical count differs from system'}`,
            userId,
          });

          adjustments.push({
            productId: item.productId,
            oldQty: item.systemQuantity,
            newQty: item.actualQuantity,
          });
        }
      }
    }

    const completedOpname = await this.stockOpnameRepo.update(tenantId, opnameId, {
      status: 'completed',
      completedAt: new Date(),
    });

    return {
      opname: completedOpname,
      adjustments,
    };
  }
}

// Cancel Stock Opname
export class CancelStockOpnameUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(tenantId: string, opnameId: string): Promise<StockOpname> {
    const opname = await this.stockOpnameRepo.findById(tenantId, opnameId);

    if (!opname) {
      throw new NotFoundError(`Stock opname '${opnameId}' not found`);
    }

    if (opname.status === 'completed') {
      throw new BusinessRuleError('Cannot cancel a completed stock opname');
    }

    return this.stockOpnameRepo.update(tenantId, opnameId, {
      status: 'cancelled',
    });
  }
}

// Get Stock Opname Details
export class GetStockOpnameUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockOpnameRepo: IStockOpnameRepository
  ) {}

  async execute(tenantId: string, opnameId: string): Promise<{
    opname: StockOpname;
    items: Array<StockOpnameItem & { productName?: string }>;
  }> {
    const opname = await this.stockOpnameRepo.findById(tenantId, opnameId);

    if (!opname) {
      throw new NotFoundError(`Stock opname '${opnameId}' not found`);
    }

    const items = await this.stockOpnameRepo.getItems(tenantId, opnameId);

    const enrichedItems = await Promise.all(
      items.map(async item => {
        const product = await this.productRepo.findById(tenantId, item.productId);
        return {
          ...item,
          productName: product?.name || item.productName,
        };
      })
    );

    return {
      opname,
      items: enrichedItems,
    };
  }
}

// List Stock Opnames
export class ListStockOpnamesUseCase {
  constructor(private stockOpnameRepo: IStockOpnameRepository) {}

  async execute(tenantId: string, filters?: { status?: StockOpnameStatus; fromDate?: Date; toDate?: Date }): Promise<{
    opnames: StockOpname[];
  }> {
    const opnames = await this.stockOpnameRepo.findAll(tenantId, filters);
    return { opnames };
  }
}
