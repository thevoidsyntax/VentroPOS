import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cart-store';

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [], tableId: null });
  });

  describe('addItem', () => {
    it('adds a new item to cart', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Kopi Hitam');
      expect(result.items[0]?.quantity).toBe(2);
    });

    it('increases quantity when adding same product', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.quantity).toBe(3);
    });

    it('creates separate items for different products', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      result.addItem({
        productId: 'prod-2',
        name: 'Teh Manis',
        quantity: 1,
        unitPrice: 10000,
        modifiers: [],
      });

      expect(result.items).toHaveLength(2);
    });

    it('creates separate items for different modifiers', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [{ id: 'mod-1', name: 'Extra Shot', price: 5000 }],
      });

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      expect(result.items).toHaveLength(2);
    });
  });

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      const itemId = result.items[0]?.id;
      if (itemId) {
        result.updateQuantity(itemId, 5);
        expect(result.items[0]?.quantity).toBe(5);
      }
    });

    it('removes item when quantity becomes zero', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      const itemId = result.items[0]?.id;
      if (itemId) {
        result.updateQuantity(itemId, 0);
        expect(result.items).toHaveLength(0);
      }
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [],
      });

      result.addItem({
        productId: 'prod-2',
        name: 'Teh Manis',
        quantity: 1,
        unitPrice: 10000,
        modifiers: [],
      });

      const itemId = result.items[0]?.id;
      if (itemId) {
        result.removeItem(itemId);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.name).toBe('Teh Manis');
      }
    });
  });

  describe('clearCart', () => {
    it('clears all items', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      result.clearCart();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('calculations', () => {
    it('calculates subtotal correctly', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 2,
        unitPrice: 15000,
        modifiers: [],
      });

      expect(result.subtotal()).toBe(30000);
    });

    it('includes modifiers in subtotal', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 15000,
        modifiers: [{ id: 'mod-1', name: 'Extra Shot', price: 5000 }],
      });

      expect(result.subtotal()).toBe(20000);
    });

    it('calculates tax at 11%', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 100000,
        modifiers: [],
      });

      expect(result.tax()).toBe(11000);
    });

    it('calculates total correctly', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 1,
        unitPrice: 100000,
        modifiers: [],
      });

      expect(result.total()).toBe(111000); // 100000 + 11000 tax
    });

    it('calculates item count', () => {
      const { result } = useCartStore();

      result.addItem({
        productId: 'prod-1',
        name: 'Kopi Hitam',
        quantity: 3,
        unitPrice: 15000,
        modifiers: [],
      });

      result.addItem({
        productId: 'prod-2',
        name: 'Teh Manis',
        quantity: 2,
        unitPrice: 10000,
        modifiers: [],
      });

      expect(result.itemCount()).toBe(5);
    });
  });
});
