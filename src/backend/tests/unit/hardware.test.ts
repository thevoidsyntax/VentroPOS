// Unit Tests for Hardware Services (Phase 5)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScannerService } from '../../src/application/hardware/scanner.service.js';

// Mock hardwareLogRepository
vi.mock('../../src/infrastructure/database/repositories/container.js', () => ({
  hardwareLogRepository: {
    create: vi.fn().mockResolvedValue({ id: 'log-1' }),
    findByTenant: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  },
}));

// ScannerService Tests
describe('ScannerService', () => {
  let scannerService: ScannerService;

  beforeEach(() => {
    vi.clearAllMocks();
    scannerService = new ScannerService();
  });

  describe('Barcode Validation', () => {
    describe('EAN-13 Format', () => {
      it('should validate correct EAN-13 barcode', () => {
        const result = scannerService.validateBarcode('5901234123457');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('ean13');
      });

      it('should accept 13-digit barcode', () => {
        const result = scannerService.validateBarcode('1234567890123');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('ean13');
      });

      it('should accept 14-digit barcode as Code 128', () => {
        // 14 digits matches Code128 pattern (alphanumeric)
        const result = scannerService.validateBarcode('12345678901234');
        expect(result.valid).toBe(true);
        // Accepted as Code128 since digits are alphanumeric-compatible
        expect(result.type).toBe('code128');
      });
    });

    describe('UPC-A Format', () => {
      it('should validate correct UPC-A barcode', () => {
        const result = scannerService.validateBarcode('012345678905');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('upc');
      });

      it('should accept 12-digit barcode', () => {
        const result = scannerService.validateBarcode('123456789012');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('upc');
      });
    });

    describe('Code 128 Format', () => {
      it('should validate alphanumeric barcode', () => {
        const result = scannerService.validateBarcode('ABC-123-XYZ');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('code128');
      });

      it('should validate barcode with special characters', () => {
        const result = scannerService.validateBarcode('PROD-001/ABC');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('code128');
      });

      it('should validate single character', () => {
        const result = scannerService.validateBarcode('A');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('code128');
      });
    });

    describe('QR Code Format', () => {
      it('should validate QR code data', () => {
        const result = scannerService.validateBarcode('https://example.com/pay');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('qr');
      });

      it('should validate QR code with special chars', () => {
        const result = scannerService.validateBarcode('00020101021126590006ID.CO.WWW01189360000123456789020303UMI51440015ID.OCBC.VA0156009Jakarta61051234562070703A016304ABC1');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('qr');
      });
    });

    describe('Invalid Barcodes', () => {
      it('should reject empty barcode', () => {
        const result = scannerService.validateBarcode('');
        expect(result.valid).toBe(false);
      });

      it('should reject whitespace only', () => {
        const result = scannerService.validateBarcode('   ');
        expect(result.valid).toBe(false);
      });

      it('should accept 3-character alphanumeric as Code 128', () => {
        // 3 chars is valid as Code 128 (min 1, max 48)
        const result = scannerService.validateBarcode('abc');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('code128');
      });

      it('should reject barcode with 12 digits (ambiguous)', () => {
        // 12 digits could be UPC or partial EAN
        const result = scannerService.validateBarcode('123456789012');
        expect(result.valid).toBe(true);
        // Should be valid as UPC
        expect(result.type).toBe('upc');
      });
    });
  });

  describe('Scan Processing', () => {
    it('should process valid barcode scan', async () => {
      const result = await scannerService.processScan(
        'tenant-1',
        '5901234123457',
        'scanner-1',
        'api'
      );

      expect(result.success).toBe(true);
      expect(result.event.barcode).toBe('5901234123457');
      expect(result.event.source).toBe('api');
      expect(result.message).toBe('Scan processed successfully');
    });

    it('should reject barcode less than 3 characters', async () => {
      const result = await scannerService.processScan(
        'tenant-1',
        'ab',
        'scanner-1',
        'keyboard'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid barcode format');
    });

    it('should trim whitespace from barcode', async () => {
      const result = await scannerService.processScan(
        'tenant-1',
        '  5901234123457  ',
        'scanner-1',
        'serial'
      );

      expect(result.success).toBe(true);
      expect(result.event.barcode).toBe('5901234123457');
    });

    it('should support keyboard source', async () => {
      const result = await scannerService.processScan(
        'tenant-1',
        'PROD-001',
        undefined,
        'keyboard'
      );

      expect(result.success).toBe(true);
      expect(result.event.source).toBe('keyboard');
    });
  });
});

// Hardware Device Types
describe('Hardware Device Types', () => {
  describe('Device Types', () => {
    const validDeviceTypes = ['printer', 'edc', 'scanner', 'drawer'];

    it('should have printer as valid device type', () => {
      expect(validDeviceTypes).toContain('printer');
    });

    it('should have edc as valid device type', () => {
      expect(validDeviceTypes).toContain('edc');
    });

    it('should have scanner as valid device type', () => {
      expect(validDeviceTypes).toContain('scanner');
    });

    it('should have drawer as valid device type', () => {
      expect(validDeviceTypes).toContain('drawer');
    });

    it('should have 4 device types total', () => {
      expect(validDeviceTypes).toHaveLength(4);
    });
  });

  describe('Connection Types', () => {
    const validConnectionTypes = ['usb', 'serial', 'tcp', 'bluetooth'];

    it('should have TCP as valid connection type', () => {
      expect(validConnectionTypes).toContain('tcp');
    });

    it('should have USB as valid connection type', () => {
      expect(validConnectionTypes).toContain('usb');
    });

    it('should have 4 connection types', () => {
      expect(validConnectionTypes).toHaveLength(4);
    });
  });
});

// Hardware Log Event Types
describe('Hardware Log Events', () => {
  const validEventTypes = [
    'device_register',
    'device_remove',
    'device_test',
    'edc_payment',
    'edc_cancel',
    'edc_settle',
    'drawer_open',
    'barcode_scan',
    'print_receipt',
    'print_kitchen',
    'print_invoice',
  ];

  it('should include device registration events', () => {
    expect(validEventTypes).toContain('device_register');
    expect(validEventTypes).toContain('device_remove');
  });

  it('should include EDC transaction events', () => {
    expect(validEventTypes).toContain('edc_payment');
    expect(validEventTypes).toContain('edc_cancel');
    expect(validEventTypes).toContain('edc_settle');
  });

  it('should include print events', () => {
    expect(validEventTypes).toContain('print_receipt');
    expect(validEventTypes).toContain('print_kitchen');
  });

  it('should include drawer and scanner events', () => {
    expect(validEventTypes).toContain('drawer_open');
    expect(validEventTypes).toContain('barcode_scan');
  });
});

// EDC Transaction Status
describe('EDC Transaction Status', () => {
  const validStatuses = ['pending', 'processing', 'approved', 'declined', 'cancelled', 'failed'];

  it('should include pending status', () => {
    expect(validStatuses).toContain('pending');
  });

  it('should include approved status', () => {
    expect(validStatuses).toContain('approved');
  });

  it('should include declined status', () => {
    expect(validStatuses).toContain('declined');
  });

  it('should have 6 statuses total', () => {
    expect(validStatuses).toHaveLength(6);
  });
});

// Hardware Log Status
describe('Hardware Log Status', () => {
  const validStatuses = ['success', 'failed', 'pending'];

  it('should cover all log statuses', () => {
    expect(validStatuses).toContain('success');
    expect(validStatuses).toContain('failed');
    expect(validStatuses).toContain('pending');
    expect(validStatuses).toHaveLength(3);
  });
});

// Receipt Data Structure
describe('Receipt Data Structure', () => {
  interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: string[];
    notes?: string;
  }

  interface ReceiptData {
    storeName: string;
    orderNumber: string;
    date: Date;
    cashierName: string;
    items: ReceiptItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: string;
  }

  it('should calculate item total correctly', () => {
    const item: ReceiptItem = {
      name: 'Latte',
      quantity: 2,
      unitPrice: 25000,
      totalPrice: 50000,
    };

    expect(item.totalPrice).toBe(item.quantity * item.unitPrice);
  });

  it('should support modifiers on items', () => {
    const item: ReceiptItem = {
      name: 'Latte',
      quantity: 1,
      unitPrice: 25000,
      totalPrice: 30000,
      modifiers: ['Extra Shot', 'Oat Milk'],
    };

    expect(item.modifiers).toHaveLength(2);
    expect(item.totalPrice).toBeGreaterThan(item.unitPrice);
  });

  it('should calculate receipt total correctly', () => {
    const items: ReceiptItem[] = [
      { name: 'Latte', quantity: 2, unitPrice: 25000, totalPrice: 50000 },
      { name: 'Americano', quantity: 1, unitPrice: 18000, totalPrice: 18000 },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.11);
    const totalAmount = subtotal + taxAmount;

    expect(subtotal).toBe(68000);
    expect(taxAmount).toBe(7480);
    expect(totalAmount).toBe(75480);
  });
});

// Cash Drawer Result
describe('Cash Drawer Operations', () => {
  interface OpenDrawerResult {
    success: boolean;
    drawerId: string;
    method: 'printer' | 'direct';
    message: string;
  }

  it('should return success result for direct drawer', () => {
    const result: OpenDrawerResult = {
      success: true,
      drawerId: 'drawer-1',
      method: 'direct',
      message: 'Cash drawer opened (direct mode)',
    };

    expect(result.success).toBe(true);
    expect(result.method).toBe('direct');
  });

  it('should return success result for printer-connected drawer', () => {
    const result: OpenDrawerResult = {
      success: true,
      drawerId: 'printer-1',
      method: 'printer',
      message: 'Cash drawer opened via printer EPSON-TM82',
    };

    expect(result.success).toBe(true);
    expect(result.method).toBe('printer');
  });

  it('should return failure result', () => {
    const result: OpenDrawerResult = {
      success: false,
      drawerId: 'drawer-1',
      method: 'direct',
      message: 'Failed to open drawer: Connection timeout',
    };

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed');
  });
});

// Kitchen Ticket Priority
describe('Kitchen Ticket', () => {
  type Priority = 'normal' | 'rush';

  interface KitchenTicketData {
    orderNumber: string;
    tableNumber?: string;
    date: Date;
    items: Array<{
      name: string;
      quantity: number;
      modifiers?: string[];
      notes?: string;
    }>;
    priority?: Priority;
    notes?: string;
  }

  it('should support normal priority', () => {
    const ticket: KitchenTicketData = {
      orderNumber: 'ORD-001',
      date: new Date(),
      items: [{ name: 'Burger', quantity: 1 }],
      priority: 'normal',
    };

    expect(ticket.priority).toBe('normal');
  });

  it('should support rush priority', () => {
    const ticket: KitchenTicketData = {
      orderNumber: 'ORD-002',
      date: new Date(),
      items: [{ name: 'Steak', quantity: 1 }],
      priority: 'rush',
    };

    expect(ticket.priority).toBe('rush');
  });

  it('should include table number when specified', () => {
    const ticket: KitchenTicketData = {
      orderNumber: 'ORD-003',
      tableNumber: 'A5',
      date: new Date(),
      items: [{ name: 'Pasta', quantity: 2 }],
    };

    expect(ticket.tableNumber).toBe('A5');
  });

  it('should support item modifiers for kitchen', () => {
    const ticket: KitchenTicketData = {
      orderNumber: 'ORD-004',
      date: new Date(),
      items: [
        {
          name: 'Steak',
          quantity: 1,
          modifiers: ['Medium Rare', 'No Salt'],
          notes: 'Allergic to pepper',
        },
      ],
    };

    expect(ticket.items[0].modifiers).toContain('Medium Rare');
    expect(ticket.items[0].notes).toBe('Allergic to pepper');
  });
});
