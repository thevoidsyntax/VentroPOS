import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cart-store';

describe('useCartStore', () => {
  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear();
    const store = useCartStore.getState();
    store.clearCart();
  });

  describe('addItem', () => {
    it('adds a new item to cart', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.name).toBe('Kopi Hitam');
      expect(state.items[0]?.quantity).toBe(2);
    });

    it('increases quantity when adding same product', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.quantity).toBe(3);
    });

    it('creates separate items for different products', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      store.addItem({
        productId: 'prod-2',
        name: 'Teh Manis',
        quantity: 1,
        unitPrice: 10000,
        modifiers: [],
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
    });
  });

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      const itemId = useCartStore.getState().items[0]?.id;
      if (itemId) {
        store.updateQuantity(itemId, 5);
        expect(useCartStore.getState().items[0]?.quantity).toBe(5);
      }
    });

    it('removes item when quantity becomes zero', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      const itemId = useCartStore.getState().items[0]?.id;
      if (itemId) {
        store.updateQuantity(itemId, 0);
        expect(useCartStore.getState().items).toHaveLength(0);
      }
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      store.addItem({
        productId: 'prod-2',
        name: 'Teh Manis',
        quantity: 1,
        unitPrice: 10000,
        modifiers: [],
      });

      const itemId = useCartStore.getState().items[0]?.id;
      if (itemId) {
        store.removeItem(itemId);
        expect(useCartStore.getState().items).toHaveLength(1);
      }
    });
  });

  describe('clearCart', () => {
    it('clears all items', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      store.clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('calculations', () => {
    it('calculates subtotal correctly', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      expect(store.subtotal()).toBe(30000);
    });

    it('includes modifiers in subtotal', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [{ id: 'mod-1', name: 'Extra Shot', price: 5000 }],
      });

      expect(store.subtotal()).toBe(20000);
    });

    it('calculates tax at 11%', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 100000,
        modifiers: [],
      });

      expect(store.tax()).toBe(11000);
    });

    it('calculates total correctly', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 100000,
        modifiers: [],
      });

      expect(store.total()).toBe(111000); // 100000 + 11000 tax
    });

    it('calculates item count', () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 3,
        unitPrice: 15000,
        modifiers: [],
      });

      store.addItem({
        productId: 'prod-2',
        name: 'Teh Manis',
        quantity: 2,
        unitPrice: 10000,
        modifiers: [],
      });

      expect(store.itemCount()).toBe(5);
    });
  });
});
