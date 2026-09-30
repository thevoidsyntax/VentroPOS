// Unit Tests for Domain Entities
import { describe, it, expect } from 'vitest';

// Mock types for testing without external dependencies
type UserRole = 'owner' | 'manager' | 'kasir' | 'kitchen';
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'voided' | 'held';
type PaymentMethod = 'cash' | 'qris' | 'debit' | 'credit';

describe('Domain Types', () => {
  describe('UserRole', () => {
    const validRoles: UserRole[] = ['owner', 'manager', 'kasir', 'kitchen'];

    it('should have all required roles', () => {
      expect(validRoles).toContain('owner');
      expect(validRoles).toContain('manager');
      expect(validRoles).toContain('kasir');
      expect(validRoles).toContain('kitchen');
    });

    it('should have 4 roles total', () => {
      expect(validRoles.length).toBe(4);
    });
  });

  describe('OrderStatus', () => {
    const validStatuses: OrderStatus[] = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'served',
      'paid',
      'voided',
      'held',
    ];

    it('should have all required statuses', () => {
      expect(validStatuses).toContain('pending');
      expect(validStatuses).toContain('paid');
      expect(validStatuses).toContain('voided');
    });

    it('should have 8 statuses total', () => {
      expect(validStatuses.length).toBe(8);
    });
  });

  describe('PaymentMethod', () => {
    const validMethods: PaymentMethod[] = ['cash', 'qris', 'debit', 'credit'];

    it('should support cash payment', () => {
      expect(validMethods).toContain('cash');
    });

    it('should support QRIS payment', () => {
      expect(validMethods).toContain('qris');
    });

    it('should have 4 payment methods', () => {
      expect(validMethods.length).toBe(4);
    });
  });
});

describe('Order Status Transitions', () => {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
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

  it('pending can transition to held', () => {
    expect(validTransitions.pending).toContain('held');
  });

  it('pending can be voided', () => {
    expect(validTransitions.pending).toContain('voided');
  });

  it('paid cannot transition to any status', () => {
    expect(validTransitions.paid).toHaveLength(0);
  });

  it('voided cannot transition to any status', () => {
    expect(validTransitions.voided).toHaveLength(0);
  });

  it('held can transition back to pending', () => {
    expect(validTransitions.held).toContain('pending');
  });

  it('served must go to paid', () => {
    expect(validTransitions.served).toEqual(['paid']);
  });
});

describe('Price Calculations', () => {
  const TAX_RATE = 0.11; // 11% PPN Indonesia

  function calculateOrderTotal(
    items: Array<{ price: number; quantity: number }>,
    discount?: { type: 'percentage' | 'fixed'; value: number }
  ): { subtotal: number; discountAmount: number; taxAmount: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountAmount = 0;
    if (discount) {
      discountAmount =
        discount.type === 'percentage'
          ? (subtotal * discount.value) / 100
          : discount.value;
    }

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * TAX_RATE * 100) / 100;
    const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

    return { subtotal, discountAmount, taxAmount, total };
  }

  it('should calculate correct subtotal', () => {
    const items = [
      { price: 25000, quantity: 2 }, // Latte
      { price: 18000, quantity: 1 }, // Americano
    ];

    const result = calculateOrderTotal(items);
    expect(result.subtotal).toBe(68000); // (25000*2) + (18000*1)
  });

  it('should calculate percentage discount correctly', () => {
    const items = [{ price: 100000, quantity: 1 }];
    const result = calculateOrderTotal(items, { type: 'percentage', value: 10 });

    expect(result.discountAmount).toBe(10000);
  });

  it('should calculate fixed discount correctly', () => {
    const items = [{ price: 100000, quantity: 1 }];
    const result = calculateOrderTotal(items, { type: 'fixed', value: 15000 });

    expect(result.discountAmount).toBe(15000);
  });

  it('should calculate tax on discounted amount', () => {
    const items = [{ price: 100000, quantity: 1 }];
    const result = calculateOrderTotal(items, { type: 'fixed', value: 10000 });

    // taxable = 100000 - 10000 = 90000
    // tax = 90000 * 0.11 = 9900
    expect(result.taxAmount).toBe(9900);
    expect(result.total).toBe(99900);
  });

  it('should handle no discount', () => {
    const items = [{ price: 50000, quantity: 1 }];
    const result = calculateOrderTotal(items);

    expect(result.discountAmount).toBe(0);
    expect(result.taxAmount).toBe(5500); // 50000 * 0.11
    expect(result.total).toBe(55000);
  });
});

describe('Order Number Generation', () => {
  function generateOrderNumber(date: Date, sequence: number): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = sequence.toString().padStart(4, '0');
    return `ORD-${dateStr}-${seq}`;
  }

  it('should generate correct order number format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const orderNumber = generateOrderNumber(date, 1);

    expect(orderNumber).toBe('ORD-20240115-0001');
  });

  it('should pad sequence to 4 digits', () => {
    const date = new Date();
    expect(generateOrderNumber(date, 42)).toMatch(/00042$/);
    expect(generateOrderNumber(date, 999)).toMatch(/0999$/);
    expect(generateOrderNumber(date, 1234)).toMatch(/1234$/);
  });

  it('should include date in order number', () => {
    const date = new Date('2024-03-20T12:00:00Z');
    const orderNumber = generateOrderNumber(date, 1);

    expect(orderNumber).toContain('20240320');
  });
});

describe('Stock Validation', () => {
  function validateStockOperation(
    currentStock: number,
    operation: 'sale' | 'restock' | 'adjustment',
    quantity: number
  ): { valid: boolean; newStock: number; error?: string } {
    if (quantity < 0) {
      return { valid: false, newStock: currentStock, error: 'Quantity must be positive' };
    }

    if (operation === 'sale' && quantity > currentStock) {
      return { valid: false, newStock: currentStock, error: 'Insufficient stock' };
    }

    if (operation === 'adjustment' && currentStock + quantity < 0) {
      return { valid: false, newStock: currentStock, error: 'Stock cannot be negative' };
    }

    const newStock =
      operation === 'sale'
        ? currentStock - quantity
        : operation === 'restock'
        ? currentStock + quantity
        : quantity; // adjustment sets directly

    return { valid: true, newStock };
  }

  it('should allow sale within stock limit', () => {
    const result = validateStockOperation(10, 'sale', 5);
    expect(result.valid).toBe(true);
    expect(result.newStock).toBe(5);
  });

  it('should reject sale exceeding stock', () => {
    const result = validateStockOperation(5, 'sale', 10);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Insufficient stock');
  });

  it('should allow restock', () => {
    const result = validateStockOperation(5, 'restock', 10);
    expect(result.valid).toBe(true);
    expect(result.newStock).toBe(15);
  });

  it('should reject negative quantity', () => {
    const result = validateStockOperation(10, 'sale', -5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Quantity must be positive');
  });

  it('should allow adjustment to zero', () => {
    const result = validateStockOperation(5, 'adjustment', 0);
    expect(result.valid).toBe(true);
    expect(result.newStock).toBe(0);
  });
});

describe('Email Validation', () => {
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  it('should accept valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@domain.co.id')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('no@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('Password Validation', () => {
  function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return { valid: errors.length === 0, errors };
  }

  it('should accept strong password', () => {
    const result = validatePassword('SecurePass123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject short password', () => {
    const result = validatePassword('Pass1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject password without uppercase', () => {
    const result = validatePassword('password123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('PasswordOnly');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should return multiple errors', () => {
    const result = validatePassword('short');
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
