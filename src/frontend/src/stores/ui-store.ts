import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  cartDrawerOpen: boolean;
  checkoutModalOpen: boolean;
  receiptModalOpen: boolean;
  receiptData: ReceiptData | null;
  offline: boolean;
  $reset: () => void;
  toggleSidebar: () => void;
  toggleSidebarMobile: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setCheckoutModalOpen: (open: boolean) => void;
  openReceipt: (data: ReceiptData) => void;
  closeReceipt: () => void;
  setOffline: (offline: boolean) => void;
}

interface ReceiptData {
  orderId: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  change: number;
  timestamp: Date;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  cartDrawerOpen: false,
  checkoutModalOpen: false,
  receiptModalOpen: false,
  receiptData: null,
  offline: false,

  $reset: () => set({
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    cartDrawerOpen: false,
    checkoutModalOpen: false,
    receiptModalOpen: false,
    receiptData: null,
    offline: false,
  }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleSidebarMobile: () =>
    set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),

  setCheckoutModalOpen: (open) => set({ checkoutModalOpen: open }),

  openReceipt: (data) => set({ receiptModalOpen: true, receiptData: data }),

  closeReceipt: () => set({ receiptModalOpen: false, receiptData: null }),

  setOffline: (offline) => set({ offline }),
}));
