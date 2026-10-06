// Print Service - Receipt Generation and Printing
import { ESCPOSDriver, QRCodeGenerator } from '../../infrastructure/hardware/drivers/escpos.driver.js';
import type { HardwareDevice, HardwareConfig } from '../../domain/entities/index.js';
import { DEFAULT_HARDWARE_TIMEOUT_MS, THERMAL_PRINTER_WIDTH } from '../../shared/constants/index.js';

// Receipt data structure
export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  orderNumber: string;
  date: Date;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  amountPaid?: number;
  change?: number;
  qrCode?: string; // For QRIS payments
  footerMessage?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: string[];
  notes?: string;
}

// Kitchen ticket data
export interface KitchenTicketData {
  orderNumber: string;
  tableNumber?: string;
  date: Date;
  items: KitchenItem[];
  notes?: string;
  priority?: 'normal' | 'rush';
}

export interface KitchenItem {
  name: string;
  quantity: number;
  modifiers?: string[];
  notes?: string;
}

// Invoice data
export interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate?: Date;
  customerName?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  notes?: string;
}

export interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export class PrintService {
  private driver: ESCPOSDriver | null = null;

  async initializeDriver(device: HardwareDevice): Promise<void> {
    if (device.connectionType !== 'tcp') {
      throw new Error(`ESC/POS driver only supports TCP connection. Got: ${device.connectionType}`);
    }

    const config: HardwareConfig = device.config;
    if (!config.ip || !config.port) {
      throw new Error('Printer config must include IP address and port');
    }

    this.driver = new ESCPOSDriver({
      ip: config.ip,
      port: config.port,
      timeout: config.timeout ?? DEFAULT_HARDWARE_TIMEOUT_MS,
    });

    await this.driver.connect();
    await this.driver.initialize();
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.disconnect();
      this.driver = null;
    }
  }

  // ============== RECEIPT PRINTING ==============

  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.driver) {
      throw new Error('Printer not initialized. Call initializeDriver first.');
    }

    const width = THERMAL_PRINTER_WIDTH; // Standard 80mm thermal printer width

    // Header
    await this.driver.printText(data.storeName, { align: 'center', bold: true, fontSize: 'double' });
    if (data.storeAddress) {
      await this.driver.printText(data.storeAddress, { align: 'center' });
    }
    if (data.storePhone) {
      await this.driver.printText('Telp: ' + data.storePhone, { align: 'center' });
    }

    await this.driver.printDivider();

    // Order info
    await this.driver.printText(`No. Order : ${data.orderNumber}`, { width });
    await this.driver.printText(`Tanggal   : ${this.formatDate(data.date)}`, { width });
    await this.driver.printText(`Kasir     : ${data.cashierName}`, { width });

    await this.driver.printDivider();

    // Items header
    await this.driver.printText('ITEM', { width, bold: true });
    await this.driver.printLine('-', width);

    // Items
    for (const item of data.items) {
      const qtyName = `${item.quantity}x ${item.name}`;
      const price = this.formatCurrency(item.totalPrice);
      await this.driver.printText(qtyName, { width });
      await this.driver.printText(price, { width, align: 'right' });

      // Modifiers
      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          await this.driver.printText(`   + ${mod}`, { width, fontSize: 'normal' });
        }
      }

      // Notes
      if (item.notes) {
        await this.driver.printText(`   Note: ${item.notes}`, { width, fontSize: 'normal' });
      }
    }

    await this.driver.printDivider();

    // Totals
    await this.driver.printText(`Subtotal    : ${this.formatCurrency(data.subtotal)}`, { width, align: 'right' });

    if (data.discountAmount && data.discountAmount > 0) {
      await this.driver.printText(`Diskon      : -${this.formatCurrency(data.discountAmount)}`, { width, align: 'right' });
    }

    if (data.taxRate) {
      await this.driver.printText(`Pajak (${(data.taxRate * 100).toFixed(0)}%)  : ${this.formatCurrency(data.taxAmount)}`, { width, align: 'right' });
    } else {
      await this.driver.printText(`Pajak       : ${this.formatCurrency(data.taxAmount)}`, { width, align: 'right' });
    }

    await this.driver.printDivider();

    // Total
    await this.driver.printText(`TOTAL       : ${this.formatCurrency(data.totalAmount)}`, {
      width,
      align: 'right',
      bold: true,
      fontSize: 'double'
    });

    await this.driver.printLine();

    // Payment info
    await this.driver.printText(`Pembayaran  : ${data.paymentMethod}`, { width });
    if (data.amountPaid) {
      await this.driver.printText(`Tunai       : ${this.formatCurrency(data.amountPaid)}`, { width, align: 'right' });
    }
    if (data.change !== undefined) {
      await this.driver.printText(`Kembalian   : ${this.formatCurrency(data.change)}`, { width, align: 'right' });
    }

    // QR Code for QRIS
    if (data.qrCode) {
      await this.driver.printLine();
      await this.driver.printText('Scan QRIS untuk bayar', { align: 'center' });
      const qrBuffer = QRCodeGenerator.generate(data.qrCode, { size: 6 });
      await this.driver.send(qrBuffer);
      await this.driver.printLine();
    }

    await this.driver.printDivider();

    // Footer
    if (data.footerMessage) {
      await this.driver.printText(data.footerMessage, { align: 'center' });
    }

    await this.driver.printText('Terima Kasih', { align: 'center', bold: true });
    await this.driver.printText('Atas Kunjungan Anda', { align: 'center' });

    await this.driver.feedLines(4);
    await this.driver.cutPaper();
  }

  // ============== KITCHEN TICKET ==============

  async printKitchenTicket(data: KitchenTicketData): Promise<void> {
    if (!this.driver) {
      throw new Error('Printer not initialized. Call initializeDriver first.');
    }

    // Header with priority
    if (data.priority === 'rush') {
      await this.driver.printText('=== RUSH ORDER ===', { align: 'center', bold: true, fontSize: 'double' });
    }

    await this.driver.printText('KITCHEN ORDER', { align: 'center', bold: true, fontSize: 'double' });
    await this.driver.printDivider();

    // Order info
    await this.driver.printText(`No. Order : ${data.orderNumber}`, { bold: true });
    if (data.tableNumber) {
      await this.driver.printText(`Meja      : ${data.tableNumber}`, { bold: true });
    }
    await this.driver.printText(`Waktu     : ${this.formatTime(data.date)}`, { bold: true });

    await this.driver.printDivider();

    // Items - Large and clear
    for (const item of data.items) {
      await this.driver.printLine();
      await this.driver.printText(`${item.quantity}x`, { bold: true, fontSize: 'quadruple' });
      await this.driver.printText(item.name, { bold: true, fontSize: 'double' });

      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          await this.driver.printText(`  - ${mod}`, { bold: true });
        }
      }

      if (item.notes) {
        await this.driver.printText(`  ** ${item.notes} **`, { bold: true, underline: true });
      }
    }

    // Notes
    if (data.notes) {
      await this.driver.printDivider();
      await this.driver.printText(`Catatan: ${data.notes}`, { bold: true });
    }

    await this.driver.beep();
    await this.driver.feedLines(4);
    await this.driver.cutPaper(true);
  }

  // ============== INVOICE PRINTING ==============

  async printInvoice(data: InvoiceData): Promise<void> {
    if (!this.driver) {
      throw new Error('Printer not initialized. Call initializeDriver first.');
    }

    const width = THERMAL_PRINTER_WIDTH;

    // Header
    await this.driver.printText('INVOICE', { align: 'center', bold: true, fontSize: 'double' });
    await this.driver.printDivider();

    // Invoice info
    await this.driver.printText(`No. Invoice : ${data.invoiceNumber}`, { width });
    await this.driver.printText(`Tanggal     : ${this.formatDate(data.date)}`, { width });
    if (data.dueDate) {
      await this.driver.printText(`Jatuh Tempo : ${this.formatDate(data.dueDate)}`, { width });
    }

    if (data.customerName) {
      await this.driver.printText(`Pelanggan   : ${data.customerName}`, { width });
    }
    if (data.customerAddress) {
      await this.driver.printText(`            : ${data.customerAddress}`, { width });
    }

    await this.driver.printDivider();

    // Items
    await this.driver.printText('ITEM', { bold: true });
    await this.driver.printLine('-', width);

    for (const item of data.items) {
      await this.driver.printText(`${item.quantity}x ${item.name}`, { width });
      await this.driver.printText(`    @ ${this.formatCurrency(item.unitPrice)}`, { width, fontSize: 'normal' });
      await this.driver.printText(`    = ${this.formatCurrency(item.totalPrice)}`, { width, align: 'right' });
    }

    await this.driver.printDivider();

    // Totals
    await this.driver.printText(`Subtotal    : ${this.formatCurrency(data.subtotal)}`, { width, align: 'right' });
    await this.driver.printText(`Pajak       : ${this.formatCurrency(data.taxAmount)}`, { width, align: 'right' });
    await this.driver.printDivider();
    await this.driver.printText(`TOTAL       : ${this.formatCurrency(data.totalAmount)}`, {
      width,
      align: 'right',
      bold: true,
      fontSize: 'double'
    });

    // Payment status
    await this.driver.printLine();
    const statusText = data.paymentStatus === 'paid' ? 'LUNAS' :
                       data.paymentStatus === 'partial' ? 'SEBAGIAN DIBAYAR' : 'BELUM DIBAYAR';
    await this.driver.printText(`Status: ${statusText}`, { align: 'center', bold: true });

    // Notes
    if (data.notes) {
      await this.driver.printDivider();
      await this.driver.printText(data.notes, { align: 'center' });
    }

    await this.driver.feedLines(4);
    await this.driver.cutPaper();
  }

  // ============== HELPER METHODS ==============

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }
}
