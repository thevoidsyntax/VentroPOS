import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartModifier {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  modifiers: CartModifier[];
  notes?: string;
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  setTableId: (tableId: string | null) => void;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
  itemCount: () => number;
}

const TAX_RATE = 0.11; // 11% PPN

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,

      addItem: (item) => {
        const existingItem = get().items.find(
          (i) =>
            i.productId === item.productId &&
            JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
        );

        if (existingItem) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              { ...item, id: crypto.randomUUID() },
            ],
          }));
        }
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        }));
      },

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),

      updateItemNotes: (itemId, notes) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, notes } : i
          ),
        })),

      clearCart: () =>
        set({
          items: [],
          tableId: null,
        }),

      setTableId: (tableId) => set({ tableId }),

      subtotal: () => {
        return get().items.reduce((sum, item) => {
          const modifiersTotal = item.modifiers.reduce(
            (m, mod) => m + mod.price,
            0
          );
          return sum + (item.unitPrice + modifiersTotal) * item.quantity;
        }, 0);
      },

      tax: () => {
        return Math.round(get().subtotal() * TAX_RATE);
      },

      total: () => {
        return get().subtotal() + get().tax();
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'ventropos-cart',
      partialize: (state) => ({
        items: state.items,
        tableId: state.tableId,
      }),
    }
  )
);
