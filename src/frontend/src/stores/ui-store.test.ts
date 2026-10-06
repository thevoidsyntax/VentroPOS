import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      cartDrawerOpen: false,
      checkoutModalOpen: false,
      receiptModalOpen: false,
      receiptData: null,
      offline: false,
    });
  });

  describe('sidebar', () => {
    it('toggles sidebar collapsed state', () => {
      const { result } = useUIStore();

      expect(result.sidebarCollapsed).toBe(false);

      result.toggleSidebar();
      expect(result.sidebarCollapsed).toBe(true);

      result.toggleSidebar();
      expect(result.sidebarCollapsed).toBe(false);
    });

    it('toggles sidebar mobile open state', () => {
      const { result } = useUIStore();

      expect(result.sidebarMobileOpen).toBe(false);

      result.toggleSidebarMobile();
      expect(result.sidebarMobileOpen).toBe(true);

      result.toggleSidebarMobile();
      expect(result.sidebarMobileOpen).toBe(false);
    });

    it('sets sidebar collapsed state', () => {
      const { result } = useUIStore();

      result.setSidebarCollapsed(true);
      expect(result.sidebarCollapsed).toBe(true);

      result.setSidebarCollapsed(false);
      expect(result.sidebarCollapsed).toBe(false);
    });
  });

  describe('cart drawer', () => {
    it('opens cart drawer', () => {
      const { result } = useUIStore();

      expect(result.cartDrawerOpen).toBe(false);

      result.setCartDrawerOpen(true);
      expect(result.cartDrawerOpen).toBe(true);
    });
  });

  describe('receipt', () => {
    it('opens receipt with data', () => {
      const { result } = useUIStore();

      const receiptData = {
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        items: [{ name: 'Kopi', quantity: 2, unitPrice: 15000 }],
        subtotal: 30000,
        tax: 3300,
        total: 33300,
        paymentMethod: 'cash',
        paidAmount: 35000,
        change: 1700,
        timestamp: new Date(),
      };

      result.openReceipt(receiptData);

      expect(result.receiptModalOpen).toBe(true);
      expect(result.receiptData?.orderNumber).toBe('ORD-001');
    });

    it('closes receipt', () => {
      const { result } = useUIStore();

      result.openReceipt({
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: 'cash',
        paidAmount: 0,
        change: 0,
        timestamp: new Date(),
      });

      result.closeReceipt();

      expect(result.receiptModalOpen).toBe(false);
      expect(result.receiptData).toBeNull();
    });
  });

  describe('offline', () => {
    it('sets offline state', () => {
      const { result } = useUIStore();

      expect(result.offline).toBe(false);

      result.setOffline(true);
      expect(result.offline).toBe(true);
    });
  });
});
