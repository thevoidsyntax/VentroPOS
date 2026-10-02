// Unit Tests for Stock Use Cases
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GetStockAlertsUseCase,
  ReceiveStockUseCase,
  AdjustStockUseCase,
  GetStockHistoryUseCase,
  GetStockOverviewUseCase,
  CreateStockOpnameUseCase,
  RecordStockCountUseCase,
  SubmitStockOpnameUseCase,
  CancelStockOpnameUseCase,
  GetStockOpnameUseCase,
} from '../../src/application/stock/index.js';
import type { IProductRepository, IStockLogRepository, IStockOpnameRepository } from '../../src/domain/repositories/index.js';
import type { Product, StockLog, StockOpname, StockOpnameItem } from '../../src/domain/entities/index.js';
import { NotFoundError, BusinessRuleError } from '../../src/shared/errors/index.js';

describe('GetStockAlertsUseCase', () => {
  let mockProductRepo: IProductRepository;
  let useCase: GetStockAlertsUseCase;

  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      tenantId: 'tenant-1',
      name: 'Coffee Beans',
      price: 50000,
      cost: 30000,
      stockQuantity: 5,
      lowStockThreshold: 10,
      isActive: true,
      isSerialized: false,
      modifierGroupIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod-2',
      tenantId: 'tenant-1',
      name: 'Milk',
      price: 20000,
      cost: 10000,
      stockQuantity: 0,
      lowStockThreshold: 5,
      isActive: true,
      isSerialized: false,
      modifierGroupIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod-3',
      tenantId: 'tenant-1',
      name: 'Sugar',
      price: 10000,
      cost: 5000,
      stockQuantity: 20,
      lowStockThreshold: 5,
      isActive: true,
      isSerialized: false,
      modifierGroupIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockProductRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetStockAlertsUseCase(mockProductRepo);
  });

  it('should return low stock and out of stock alerts', async () => {
    vi.mocked(mockProductRepo.findAll).mockResolvedValue(
      mockProducts.filter(p => p.stockQuantity <= p.lowStockThreshold)
    );

    const alerts = await useCase.execute('tenant-1');

    expect(alerts).toHaveLength(2);
    expect(alerts[0].productId).toBe('prod-1');
    expect(alerts[0].severity).toBe('warning');
    expect(alerts[1].productId).toBe('prod-2');
    expect(alerts[1].severity).toBe('critical');
  });

  it('should mark zero stock as critical severity', async () => {
    vi.mocked(mockProductRepo.findAll).mockResolvedValue([mockProducts[1]]);

    const alerts = await useCase.execute('tenant-1');

    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].currentStock).toBe(0);
  });
});

describe('ReceiveStockUseCase', () => {
  let mockProductRepo: IProductRepository;
  let mockStockLogRepo: IStockLogRepository;
  let useCase: ReceiveStockUseCase;

  const mockProduct: Product = {
    id: 'prod-1',
    tenantId: 'tenant-1',
    name: 'Coffee Beans',
    price: 50000,
    cost: 30000,
    stockQuantity: 10,
    lowStockThreshold: 10,
    isActive: true,
    isSerialized: false,
    modifierGroupIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockProductRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      delete: vi.fn(),
    };

    mockStockLogRepo = {
      create: vi.fn(),
      findByProduct: vi.fn(),
      findAll: vi.fn(),
    };

    useCase = new ReceiveStockUseCase(mockProductRepo, mockStockLogRepo);
  });

  it('should add stock and create stock log', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProduct);
    vi.mocked(mockProductRepo.updateStock).mockResolvedValue({
      ...mockProduct,
      stockQuantity: 25,
    });
    vi.mocked(mockStockLogRepo.create).mockResolvedValue({
      id: 'log-1',
      tenantId: 'tenant-1',
      productId: 'prod-1',
      type: 'restock',
      quantity: 15,
      balanceAfter: 25,
      createdAt: new Date(),
    });

    const result = await useCase.execute('tenant-1', 'user-1', {
      productId: 'prod-1',
      quantity: 15,
      notes: 'Monthly restock',
    });

    expect(result.product.stockQuantity).toBe(25);
    expect(result.stockLog.type).toBe('restock');
    expect(result.stockLog.quantity).toBe(15);
  });

  it('should throw NotFoundError for non-existent product', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('tenant-1', 'user-1', {
        productId: 'non-existent',
        quantity: 10,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BusinessRuleError for inactive product', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue({
      ...mockProduct,
      isActive: false,
    });

    await expect(
      useCase.execute('tenant-1', 'user-1', {
        productId: 'prod-1',
        quantity: 10,
      })
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw BusinessRuleError for non-positive quantity', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProduct);

    await expect(
      useCase.execute('tenant-1', 'user-1', {
        productId: 'prod-1',
        quantity: 0,
      })
    ).rejects.toThrow(BusinessRuleError);
  });
});

describe('AdjustStockUseCase', () => {
  let mockProductRepo: IProductRepository;
  let mockStockLogRepo: IStockLogRepository;
  let useCase: AdjustStockUseCase;

  const mockProduct: Product = {
    id: 'prod-1',
    tenantId: 'tenant-1',
    name: 'Coffee Beans',
    price: 50000,
    cost: 30000,
    stockQuantity: 10,
    lowStockThreshold: 5,
    isActive: true,
    isSerialized: false,
    modifierGroupIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockProductRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      delete: vi.fn(),
    };

    mockStockLogRepo = {
      create: vi.fn(),
      findByProduct: vi.fn(),
      findAll: vi.fn(),
    };

    useCase = new AdjustStockUseCase(mockProductRepo, mockStockLogRepo);
  });

  it('should adjust stock to new value', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProduct);
    vi.mocked(mockProductRepo.updateStock).mockResolvedValue({
      ...mockProduct,
      stockQuantity: 8,
    });
    vi.mocked(mockStockLogRepo.create).mockResolvedValue({
      id: 'log-1',
      tenantId: 'tenant-1',
      productId: 'prod-1',
      type: 'adjustment',
      quantity: -2,
      balanceAfter: 8,
      createdAt: new Date(),
    });

    const result = await useCase.execute('tenant-1', 'user-1', {
      productId: 'prod-1',
      newQuantity: 8,
      reason: 'Damaged goods found',
    });

    expect(result.product.stockQuantity).toBe(8);
    expect(result.stockLog.type).toBe('adjustment');
    expect(result.stockLog.quantity).toBe(-2); // 8 - 10 = -2
  });

  it('should throw BusinessRuleError for negative quantity', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProduct);

    await expect(
      useCase.execute('tenant-1', 'user-1', {
        productId: 'prod-1',
        newQuantity: -5,
        reason: 'Test',
      })
    ).rejects.toThrow(BusinessRuleError);
  });
});

describe('GetStockOverviewUseCase', () => {
  let mockProductRepo: IProductRepository;
  let useCase: GetStockOverviewUseCase;

  const mockProducts: Product[] = [
    { id: 'prod-1', tenantId: 'tenant-1', name: 'In Stock', price: 10000, cost: 5000, stockQuantity: 20, lowStockThreshold: 5, isActive: true, isSerialized: false, modifierGroupIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'prod-2', tenantId: 'tenant-1', name: 'Low Stock', price: 10000, cost: 5000, stockQuantity: 3, lowStockThreshold: 5, isActive: true, isSerialized: false, modifierGroupIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'prod-3', tenantId: 'tenant-1', name: 'Out of Stock', price: 10000, cost: 5000, stockQuantity: 0, lowStockThreshold: 5, isActive: true, isSerialized: false, modifierGroupIds: [], createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(() => {
    mockProductRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetStockOverviewUseCase(mockProductRepo);
  });

  it('should return correct summary counts', async () => {
    vi.mocked(mockProductRepo.findAll).mockResolvedValue(mockProducts);

    const result = await useCase.execute('tenant-1');

    expect(result.summary.totalProducts).toBe(3);
    expect(result.summary.inStock).toBe(1);
    expect(result.summary.lowStock).toBe(1);
    expect(result.summary.outOfStock).toBe(1);
  });

  it('should mark items correctly', async () => {
    vi.mocked(mockProductRepo.findAll).mockResolvedValue(mockProducts);

    const result = await useCase.execute('tenant-1');

    const inStock = result.items.find(i => i.product.name === 'In Stock');
    const lowStock = result.items.find(i => i.product.name === 'Low Stock');
    const outOfStock = result.items.find(i => i.product.name === 'Out of Stock');

    expect(inStock?.lowStock).toBe(false);
    expect(inStock?.outOfStock).toBe(false);
    expect(lowStock?.lowStock).toBe(true);
    expect(lowStock?.outOfStock).toBe(false);
    expect(outOfStock?.lowStock).toBe(false);
    expect(outOfStock?.outOfStock).toBe(true);
  });
});

describe('CreateStockOpnameUseCase', () => {
  let mockProductRepo: IProductRepository;
  let mockStockOpnameRepo: IStockOpnameRepository;
  let useCase: CreateStockOpnameUseCase;

  const mockProducts: Product[] = [
    { id: 'prod-1', tenantId: 'tenant-1', name: 'Coffee', price: 25000, cost: 15000, stockQuantity: 10, lowStockThreshold: 5, isActive: true, isSerialized: false, modifierGroupIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'prod-2', tenantId: 'tenant-1', name: 'Milk', price: 15000, cost: 8000, stockQuantity: 5, lowStockThreshold: 3, isActive: true, isSerialized: false, modifierGroupIds: [], createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(() => {
    mockProductRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      delete: vi.fn(),
    };

    mockStockOpnameRepo = {
      create: vi.fn(),
      createItem: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateItem: vi.fn(),
      getItems: vi.fn(),
      updateItemBatch: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CreateStockOpnameUseCase(mockProductRepo, mockStockOpnameRepo);
  });

  it('should create stock opname with all active products', async () => {
    vi.mocked(mockProductRepo.findAll).mockResolvedValue(mockProducts);
    vi.mocked(mockStockOpnameRepo.create).mockResolvedValue({
      id: 'opname-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'in_progress',
      items: [],
      createdAt: new Date(),
    });
    vi.mocked(mockStockOpnameRepo.createItem).mockResolvedValue({
      id: 'item-1',
      opnameId: 'opname-1',
      productId: 'prod-1',
      systemQuantity: 10,
      actualQuantity: 10,
      variance: 0,
    });
    vi.mocked(mockStockOpnameRepo.updateItemBatch).mockResolvedValue([
      { id: 'item-2', opnameId: 'opname-1', productId: 'prod-2', systemQuantity: 5, actualQuantity: 5, variance: 0 },
    ]);

    const result = await useCase.execute('tenant-1', 'user-1', {});

    expect(result.opname.status).toBe('in_progress');
    expect(result.items).toHaveLength(2);
  });

  it('should create stock opname with selected products only', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProducts[0]);
    vi.mocked(mockStockOpnameRepo.create).mockResolvedValue({
      id: 'opname-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'in_progress',
      items: [],
      createdAt: new Date(),
    });
    vi.mocked(mockStockOpnameRepo.createItem).mockResolvedValue({
      id: 'item-1',
      opnameId: 'opname-1',
      productId: 'prod-1',
      systemQuantity: 10,
      actualQuantity: 10,
      variance: 0,
    });

    const result = await useCase.execute('tenant-1', 'user-1', {
      productIds: ['prod-1'],
    });

    expect(result.items).toHaveLength(1);
    expect(mockProductRepo.findAll).not.toHaveBeenCalled();
  });

  it('should throw BusinessRuleError when no products found', async () => {
    vi.mocked(mockProductRepo.findAll).mockResolvedValue([]);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('tenant-1', 'user-1', {})
    ).rejects.toThrow(BusinessRuleError);
  });
});

describe('RecordStockCountUseCase', () => {
  let mockStockOpnameRepo: IStockOpnameRepository;
  let useCase: RecordStockCountUseCase;

  const mockItems: StockOpnameItem[] = [
    { id: 'item-1', opnameId: 'opname-1', productId: 'prod-1', systemQuantity: 10, actualQuantity: 10, variance: 0 },
    { id: 'item-2', opnameId: 'opname-1', productId: 'prod-2', systemQuantity: 5, actualQuantity: 5, variance: 0 },
  ];

  beforeEach(() => {
    mockStockOpnameRepo = {
      create: vi.fn(),
      createItem: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateItem: vi.fn(),
      getItems: vi.fn(),
      updateItemBatch: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new RecordStockCountUseCase(mockStockOpnameRepo);
  });

  it('should record actual quantity and calculate variance', async () => {
    vi.mocked(mockStockOpnameRepo.getItems).mockResolvedValue(mockItems);
    vi.mocked(mockStockOpnameRepo.updateItem).mockResolvedValue({
      id: 'item-1',
      opnameId: 'opname-1',
      productId: 'prod-1',
      systemQuantity: 10,
      actualQuantity: 8,
      variance: -2,
      notes: 'Found damaged items',
    });

    const result = await useCase.execute('tenant-1', 'opname-1', {
      productId: 'prod-1',
      actualQuantity: 8,
      notes: 'Found damaged items',
    });

    expect(result.actualQuantity).toBe(8);
    expect(result.variance).toBe(-2);
  });

  it('should throw NotFoundError for product not in opname', async () => {
    vi.mocked(mockStockOpnameRepo.getItems).mockResolvedValue(mockItems);

    await expect(
      useCase.execute('tenant-1', 'opname-1', {
        productId: 'non-existent',
        actualQuantity: 5,
      })
    ).rejects.toThrow(NotFoundError);
  });
});

describe('SubmitStockOpnameUseCase', () => {
  let mockProductRepo: IProductRepository;
  let mockStockLogRepo: IStockLogRepository;
  let mockStockOpnameRepo: IStockOpnameRepository;
  let useCase: SubmitStockOpnameUseCase;

  const mockOpname: StockOpname = {
    id: 'opname-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    status: 'in_progress',
    items: [],
    createdAt: new Date(),
  };

  const mockItems: StockOpnameItem[] = [
    { id: 'item-1', opnameId: 'opname-1', productId: 'prod-1', systemQuantity: 10, actualQuantity: 8, variance: -2 },
    { id: 'item-2', opnameId: 'opname-1', productId: 'prod-2', systemQuantity: 5, actualQuantity: 5, variance: 0 },
  ];

  beforeEach(() => {
    mockProductRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      delete: vi.fn(),
    };

    mockStockLogRepo = {
      create: vi.fn(),
      findByProduct: vi.fn(),
      findAll: vi.fn(),
    };

    mockStockOpnameRepo = {
      create: vi.fn(),
      createItem: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateItem: vi.fn(),
      getItems: vi.fn(),
      updateItemBatch: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new SubmitStockOpnameUseCase(mockProductRepo, mockStockLogRepo, mockStockOpnameRepo);
  });

  it('should submit and apply adjustments', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue(mockOpname);
    vi.mocked(mockStockOpnameRepo.getItems).mockResolvedValue(mockItems);
    vi.mocked(mockProductRepo.updateStock).mockResolvedValue({} as Product);
    vi.mocked(mockStockLogRepo.create).mockResolvedValue({} as StockLog);
    vi.mocked(mockStockOpnameRepo.update).mockResolvedValue({
      ...mockOpname,
      status: 'completed',
      completedAt: new Date(),
    });

    const result = await useCase.execute('tenant-1', 'user-1', 'opname-1', {
      applyAdjustments: true,
    });

    expect(result.opname.status).toBe('completed');
    expect(result.adjustments).toHaveLength(1);
    expect(result.adjustments[0].productId).toBe('prod-1');
    expect(result.adjustments[0].oldQty).toBe(10);
    expect(result.adjustments[0].newQty).toBe(8);
  });

  it('should submit without applying adjustments', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue(mockOpname);
    vi.mocked(mockStockOpnameRepo.getItems).mockResolvedValue(mockItems);
    vi.mocked(mockStockOpnameRepo.update).mockResolvedValue({
      ...mockOpname,
      status: 'completed',
      completedAt: new Date(),
    });

    const result = await useCase.execute('tenant-1', 'user-1', 'opname-1', {
      applyAdjustments: false,
    });

    expect(result.opname.status).toBe('completed');
    expect(result.adjustments).toHaveLength(0);
    expect(mockProductRepo.updateStock).not.toHaveBeenCalled();
  });

  it('should throw error for already completed opname', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue({
      ...mockOpname,
      status: 'completed',
    });

    await expect(
      useCase.execute('tenant-1', 'user-1', 'opname-1', {
        applyAdjustments: true,
      })
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw error for cancelled opname', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue({
      ...mockOpname,
      status: 'cancelled',
    });

    await expect(
      useCase.execute('tenant-1', 'user-1', 'opname-1', {
        applyAdjustments: true,
      })
    ).rejects.toThrow(BusinessRuleError);
  });
});

describe('CancelStockOpnameUseCase', () => {
  let mockStockOpnameRepo: IStockOpnameRepository;
  let useCase: CancelStockOpnameUseCase;

  beforeEach(() => {
    mockStockOpnameRepo = {
      create: vi.fn(),
      createItem: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateItem: vi.fn(),
      getItems: vi.fn(),
      updateItemBatch: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CancelStockOpnameUseCase(mockStockOpnameRepo);
  });

  it('should cancel in_progress opname', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue({
      id: 'opname-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'in_progress',
      items: [],
      createdAt: new Date(),
    });
    vi.mocked(mockStockOpnameRepo.update).mockResolvedValue({
      id: 'opname-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'cancelled',
      items: [],
      createdAt: new Date(),
    });

    const result = await useCase.execute('tenant-1', 'opname-1');

    expect(result.status).toBe('cancelled');
  });

  it('should throw error for completed opname', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue({
      id: 'opname-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'completed',
      items: [],
      createdAt: new Date(),
    });

    await expect(
      useCase.execute('tenant-1', 'opname-1')
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw NotFoundError for non-existent opname', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('tenant-1', 'non-existent')
    ).rejects.toThrow(NotFoundError);
  });
});

describe('GetStockOpnameUseCase', () => {
  let mockProductRepo: IProductRepository;
  let mockStockOpnameRepo: IStockOpnameRepository;
  let useCase: GetStockOpnameUseCase;

  beforeEach(() => {
    mockProductRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      delete: vi.fn(),
    };

    mockStockOpnameRepo = {
      create: vi.fn(),
      createItem: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateItem: vi.fn(),
      getItems: vi.fn(),
      updateItemBatch: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new GetStockOpnameUseCase(mockProductRepo, mockStockOpnameRepo);
  });

  it('should return opname with enriched product names', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue({
      id: 'opname-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'in_progress',
      items: [],
      createdAt: new Date(),
    });
    vi.mocked(mockStockOpnameRepo.getItems).mockResolvedValue([
      { id: 'item-1', opnameId: 'opname-1', productId: 'prod-1', systemQuantity: 10, actualQuantity: 8, variance: -2 },
    ]);
    vi.mocked(mockProductRepo.findById).mockResolvedValue({
      id: 'prod-1',
      tenantId: 'tenant-1',
      name: 'Coffee',
      price: 25000,
      cost: 15000,
      stockQuantity: 10,
      lowStockThreshold: 5,
      isActive: true,
      isSerialized: false,
      modifierGroupIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute('tenant-1', 'opname-1');

    expect(result.opname.id).toBe('opname-1');
    expect(result.items[0].productName).toBe('Coffee');
  });

  it('should throw NotFoundError for non-existent opname', async () => {
    vi.mocked(mockStockOpnameRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('tenant-1', 'non-existent')
    ).rejects.toThrow(NotFoundError);
  });
});
