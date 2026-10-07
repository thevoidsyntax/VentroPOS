import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store to default state
    const store = useUIStore.getState();
    // Manually reset all states
    store.setSidebarCollapsed(false);
    store.setCartDrawerOpen(false);
    store.closeReceipt();
    store.setOffline(false);
  });

  describe('sidebar', () => {
    it('toggles sidebar collapsed state', () => {
      const store = useUIStore.getState();
      expect(store.sidebarCollapsed).toBe(false);

      store.toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      store.toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('toggles sidebar mobile open state', () => {
      const store = useUIStore.getState();
      expect(store.sidebarMobileOpen).toBe(false);

      store.toggleSidebarMobile();
      expect(useUIStore.getState().sidebarMobileOpen).toBe(true);

      store.toggleSidebarMobile();
      expect(useUIStore.getState().sidebarMobileOpen).toBe(false);
    });

    it('sets sidebar collapsed state', () => {
      const store = useUIStore.getState();
      store.setSidebarCollapsed(true);
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      store.setSidebarCollapsed(false);
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('cart drawer', () => {
    it('opens cart drawer', () => {
      const store = useUIStore.getState();
      expect(store.cartDrawerOpen).toBe(false);

      store.setCartDrawerOpen(true);
      expect(useUIStore.getState().cartDrawerOpen).toBe(true);
    });
  });

  describe('receipt', () => {
    it('opens receipt with data', () => {
      const store = useUIStore.getState();
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

      store.openReceipt(receiptData);

      const state = useUIStore.getState();
      expect(state.receiptModalOpen).toBe(true);
      expect(state.receiptData?.orderNumber).toBe('ORD-001');
    });

    it('closes receipt', () => {
      const store = useUIStore.getState();
      store.openReceipt({
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

      store.closeReceipt();

      const state = useUIStore.getState();
      expect(state.receiptModalOpen).toBe(false);
      expect(state.receiptData).toBeNull();
    });
  });

  describe('offline', () => {
    it('sets offline state', () => {
      const store = useUIStore.getState();
      expect(store.offline).toBe(false);

      store.setOffline(true);
      expect(useUIStore.getState().offline).toBe(true);
    });
  });
});
