// Checkout Use Case Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutUseCase } from '../../src/application/orders/checkout.js';
import { BusinessRuleError, NotFoundError } from '../../src/shared/errors/index.js';

// Mock repositories
const mockOrderRepo = {
  findById: vi.fn(),
  updateStatus: vi.fn(),
};

const mockTxRepo = {
  create: vi.fn(),
};

const mockProductRepo = {
  findByIds: vi.fn(),
  batchUpdateStock: vi.fn(),
};

const mockLogRepo = {
  create: vi.fn(),
};

const mockIdemRepo = {
  checkAndLock: vi.fn(),
  create: vi.fn(),
};

// Test fixtures
const mockOrder = {
  id: 'order-123',
  tenantId: 'tenant-456',
  orderNumber: 'ORD-20260118-0001',
  status: 'pending' as const,
  subtotal: 50000,
  taxAmount: 5000,
  discountAmount: 0,
  totalAmount: 55000,
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      productName: 'Coffee',
      quantity: 2,
      unitPrice: 25000,
      totalPrice: 50000,
      modifiers: [],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransaction = {
  id: 'tx-123',
  tenantId: 'tenant-456',
  orderId: 'order-123',
  amount: 55000,
  changeAmount: 5000,
  paymentMethod: 'cash' as const,
  paymentDetails: {},
  referenceNumber: null,
  userId: 'user-123',
  createdAt: new Date(),
};

const mockProduct = {
  id: 'product-1',
  tenantId: 'tenant-456',
  name: 'Coffee',
  sku: 'COF001',
  price: 25000,
  cost: 10000,
  stockQuantity: 100,
  lowStockThreshold: 10,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CheckoutUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Order Validation', () => {
    it('should throw NotFoundError for non-existent order', async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      await expect(
        useCase.execute('tenant-456', 'user-123', {
          orderId: 'nonexistent-order',
          paymentMethod: 'cash',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BusinessRuleError for already paid order', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'paid' });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      await expect(
        useCase.execute('tenant-456', 'user-123', {
          orderId: 'order-123',
          paymentMethod: 'cash',
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw BusinessRuleError for voided order', async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: 'voided' });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      await expect(
        useCase.execute('tenant-456', 'user-123', {
          orderId: 'order-123',
          paymentMethod: 'cash',
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Cash Payment', () => {
    it('should throw error for insufficient cash', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      await expect(
        useCase.execute('tenant-456', 'user-123', {
          orderId: 'order-123',
          paymentMethod: 'cash',
          cashReceived: 30000, // less than 55000
        })
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw error for zero cash received', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      await expect(
        useCase.execute('tenant-456', 'user-123', {
          orderId: 'order-123',
          paymentMethod: 'cash',
          cashReceived: 0,
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Split Payment', () => {
    it('should throw error when split total is less than order amount', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      await expect(
        useCase.execute('tenant-456', 'user-123', {
          orderId: 'order-123',
          paymentMethod: 'cash',
          splitPayments: [
            { method: 'cash', amount: 20000 },
            { method: 'qris', amount: 20000 },
          ],
        })
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Successful Checkout', () => {
    it('should checkout successfully with sufficient cash', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockOrderRepo.updateStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockTxRepo.create.mockResolvedValue({
        ...mockTransaction,
        changeAmount: 5000,
      });
      mockProductRepo.findByIds.mockResolvedValue([mockProduct]);
      mockProductRepo.batchUpdateStock.mockResolvedValue(undefined);
      mockLogRepo.create.mockResolvedValue({ id: 'log-1' });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      const result = await useCase.execute('tenant-456', 'user-123', {
        orderId: 'order-123',
        paymentMethod: 'cash',
        cashReceived: 60000,
      });

      expect(result.transaction.amount).toBe(55000);
      expect(result.changeAmount).toBe(5000);
      expect(mockTxRepo.create).toHaveBeenCalled();
      expect(mockProductRepo.batchUpdateStock).toHaveBeenCalled();
    });

    it('should checkout successfully with card payment', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockOrderRepo.updateStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockTxRepo.create.mockResolvedValue({ ...mockTransaction, paymentMethod: 'card' });
      mockProductRepo.findByIds.mockResolvedValue([mockProduct]);
      mockProductRepo.batchUpdateStock.mockResolvedValue(undefined);
      mockLogRepo.create.mockResolvedValue({ id: 'log-1' });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      const result = await useCase.execute('tenant-456', 'user-123', {
        orderId: 'order-123',
        paymentMethod: 'card',
        referenceNumber: 'REF123456',
      });

      expect(result.transaction.paymentMethod).toBe('card');
      expect(mockTxRepo.create).toHaveBeenCalled();
    });

    it('should checkout successfully with exact cash (no change)', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockOrderRepo.updateStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockTxRepo.create.mockResolvedValue({ ...mockTransaction, changeAmount: 0 });
      mockProductRepo.findByIds.mockResolvedValue([mockProduct]);
      mockProductRepo.batchUpdateStock.mockResolvedValue(undefined);
      mockLogRepo.create.mockResolvedValue({ id: 'log-1' });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      const result = await useCase.execute('tenant-456', 'user-123', {
        orderId: 'order-123',
        paymentMethod: 'cash',
        cashReceived: 55000, // exact amount
      });

      expect(result.changeAmount).toBeUndefined(); // no change when exact
      expect(result.transaction.changeAmount).toBe(0);
    });

    it('should deduct stock on successful checkout', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockOrderRepo.updateStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
      mockTxRepo.create.mockResolvedValue(mockTransaction);
      mockProductRepo.findByIds.mockResolvedValue([mockProduct]);
      mockProductRepo.batchUpdateStock.mockResolvedValue(undefined);
      mockLogRepo.create.mockResolvedValue({ id: 'log-1' });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo
      );

      await useCase.execute('tenant-456', 'user-123', {
        orderId: 'order-123',
        paymentMethod: 'cash',
        cashReceived: 60000,
      });

      expect(mockProductRepo.batchUpdateStock).toHaveBeenCalledWith(
        'tenant-456',
        expect.arrayContaining([expect.objectContaining({ id: 'product-1' })])
      );
      expect(mockLogRepo.create).toHaveBeenCalled();
    });
  });

  describe('Idempotency', () => {
    it('should return cached result for duplicate idempotency key', async () => {
      const cachedResult = {
        transaction: mockTransaction,
        order: { ...mockOrder, status: 'paid' },
        changeAmount: 5000,
      };
      mockIdemRepo.checkAndLock.mockResolvedValue({ response: cachedResult });

      const useCase = new CheckoutUseCase(
        mockOrderRepo,
        mockTxRepo,
        mockProductRepo,
        mockLogRepo,
        mockIdemRepo
      );

      const result = await useCase.execute('tenant-456', 'user-123', {
        orderId: 'order-123',
        paymentMethod: 'cash',
        cashReceived: 60000,
        idempotencyKey: 'idem-key-123',
      });

      expect(result).toEqual(cachedResult);
      expect(mockOrderRepo.findById).not.toHaveBeenCalled();
      expect(mockTxRepo.create).not.toHaveBeenCalled();
    });
  });
});
