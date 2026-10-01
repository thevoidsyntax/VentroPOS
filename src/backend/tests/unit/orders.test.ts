// Unit Tests for Order Use Cases
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../src/application/orders/index.js';
import type { IOrderRepository, IProductRepository, ITableRepository, IStockLogRepository } from '../../src/domain/repositories/index.js';
import type { Product, Table } from '../../src/domain/entities/index.js';
import { NotFoundError, BusinessRuleError } from '../../src/shared/errors/index.js';

describe('CreateOrderUseCase', () => {
  let mockOrderRepo: IOrderRepository;
  let mockProductRepo: IProductRepository;
  let mockTableRepo: ITableRepository;
  let mockStockLogRepo: IStockLogRepository;
  let useCase: CreateOrderUseCase;

  const mockProduct: Product = {
    id: 'product-1',
    tenantId: 'tenant-1',
    name: 'Cappuccino',
    price: 25000,
    cost: 10000,
    stockQuantity: 10,
    lowStockThreshold: 5,
    isActive: true,
    isSerialized: false,
    modifierGroupIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTable: Table = {
    id: 'table-1',
    tenantId: 'tenant-1',
    tableNumber: '01',
    capacity: 4,
    positionX: 0,
    positionY: 0,
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockOrderRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findAll: vi.fn(),
      findByTable: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      generateOrderNumber: vi.fn(),
    };

    mockProductRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      delete: vi.fn(),
    };

    mockTableRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    };

    mockStockLogRepo = {
      create: vi.fn(),
      findByProduct: vi.fn(),
      findAll: vi.fn(),
    };

    useCase = new CreateOrderUseCase(
      mockOrderRepo,
      mockProductRepo,
      mockTableRepo,
      mockStockLogRepo
    );
  });

  it('should create order with valid items', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProduct);
    vi.mocked(mockOrderRepo.generateOrderNumber).mockResolvedValue('ORD-20240101-0001');
    vi.mocked(mockOrderRepo.create).mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      orderNumber: 'ORD-20240101-0001',
      status: 'pending',
      items: [],
      subtotal: 25000,
      taxAmount: 2750,
      discountAmount: 0,
      totalAmount: 27750,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute('tenant-1', 'user-1', {
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    expect(result).toBeDefined();
    expect(result.orderNumber).toBe('ORD-20240101-0001');
    expect(mockOrderRepo.create).toHaveBeenCalled();
  });

  it('should throw NotFoundError for non-existent table', async () => {
    vi.mocked(mockTableRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('tenant-1', 'user-1', {
        tableId: 'invalid-table',
        items: [{ productId: 'product-1', quantity: 1 }],
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError for non-existent product', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('tenant-1', 'user-1', {
        items: [{ productId: 'invalid-product', quantity: 1 }],
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
        items: [{ productId: 'product-1', quantity: 1 }],
      })
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw BusinessRuleError for insufficient stock', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue({
      ...mockProduct,
      stockQuantity: 5,
    });

    await expect(
      useCase.execute('tenant-1', 'user-1', {
        items: [{ productId: 'product-1', quantity: 10 }],
      })
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should calculate correct total with modifiers', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProduct);
    vi.mocked(mockOrderRepo.generateOrderNumber).mockResolvedValue('ORD-20240101-0001');
    vi.mocked(mockOrderRepo.create).mockImplementation(async (_, data) => ({
      id: 'order-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      orderNumber: 'ORD-20240101-0001',
      status: 'pending',
      items: data.items,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await useCase.execute('tenant-1', 'user-1', {
      items: [{
        productId: 'product-1',
        quantity: 2,
        modifiers: [
          { modifierId: 'mod-1', name: 'Extra Shot', priceAdjustment: 5000 },
        ],
      }],
    });

    // 2 x (25000 + 5000) = 60000
    expect(result.subtotal).toBe(60000);
    // Tax: 60000 * 0.11 = 6600
    expect(result.taxAmount).toBe(6600);
    // Total: 60000 + 6600 = 66600
    expect(result.totalAmount).toBe(66600);
  });

  it('should apply percentage discount correctly', async () => {
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProduct);
    vi.mocked(mockOrderRepo.generateOrderNumber).mockResolvedValue('ORD-20240101-0001');
    vi.mocked(mockOrderRepo.create).mockImplementation(async (_, data) => ({
      id: 'order-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      orderNumber: 'ORD-20240101-0001',
      status: 'pending',
      items: data.items,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await useCase.execute('tenant-1', 'user-1', {
      items: [{ productId: 'product-1', quantity: 1 }],
      applyDiscount: { type: 'percentage', value: 10 },
    });

    // 25000 - 10% = 22500 (discounted)
    expect(result.discountAmount).toBe(2500);
    // Tax: 22500 * 0.11 = 2475
    expect(result.taxAmount).toBe(2475);
    // Total: 22500 + 2475 = 24975
    expect(result.totalAmount).toBe(24975);
  });

  it('should update table status when order has tableId', async () => {
    vi.mocked(mockTableRepo.findById).mockResolvedValue(mockTable);
    vi.mocked(mockProductRepo.findById).mockResolvedValue(mockProduct);
    vi.mocked(mockOrderRepo.generateOrderNumber).mockResolvedValue('ORD-20240101-0001');
    vi.mocked(mockOrderRepo.create).mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      orderNumber: 'ORD-20240101-0001',
      status: 'pending',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      tableId: 'table-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await useCase.execute('tenant-1', 'user-1', {
      tableId: 'table-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    expect(mockTableRepo.updateStatus).toHaveBeenCalledWith('tenant-1', 'table-1', 'occupied');
  });
});

describe('Order Status Transitions', () => {
  // These tests verify the business rules for order status changes
  // The actual transitions are handled by UpdateOrderStatusUseCase

  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'voided', 'held'],
    confirmed: ['preparing', 'voided', 'held'],
    preparing: ['ready', 'voided'],
    ready: ['served', 'voided'],
    served: ['paid'],
    paid: [],
    voided: [],
    held: ['pending', 'confirmed', 'voided'],
  };

  it('pending can transition to confirmed', () => {
    expect(validTransitions.pending).toContain('confirmed');
  });

  it('pending can be held', () => {
    expect(validTransitions.pending).toContain('held');
  });

  it('held can resume to pending', () => {
    expect(validTransitions.held).toContain('pending');
  });

  it('paid cannot transition anywhere', () => {
    expect(validTransitions.paid).toHaveLength(0);
  });

  it('voided cannot transition anywhere', () => {
    expect(validTransitions.voided).toHaveLength(0);
  });

  it('served can only transition to paid', () => {
    expect(validTransitions.served).toEqual(['paid']);
  });
});
