import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard, CategoryTabs, CartDrawer } from '@/components/pos';
import { useProducts, useCategories, useCreateOrder, useCheckoutOrder } from '@/hooks';
import { useCartStore, useUIStore } from '@/stores';

export function POSPage() {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Queries
  const { data: productsData, isLoading: productsLoading } = useProducts(
    selectedCategoryId ? { categoryId: selectedCategoryId } : undefined
  );
  const { data: categoriesData } = useCategories();

  // Cart
  const { items, total, itemCount, clearCart } = useCartStore();
  const cartDrawerOpen = useUIStore((state) => state.cartDrawerOpen);
  const setCartDrawerOpen = useUIStore((state) => state.setCartDrawerOpen);

  // Mutations
  const createOrder = useCreateOrder();
  const checkoutOrder = useCheckoutOrder();

  const products = productsData?.data ?? [];
  const categories = categoriesData ?? [];

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      // Create order
      const order = await createOrder.mutateAsync({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          modifiers: item.modifiers.map((m) => ({ modifierId: m.id })),
          notes: item.notes,
        })),
      });

      // Process checkout
      await checkoutOrder.mutateAsync({
        orderId: order.id,
        data: {
          payments: [{ method: 'cash', amount: total() }],
        },
      });

      toast.success('Pembayaran berhasil!');
      setCartDrawerOpen(false);
      clearCart();

      // Navigate to receipt or print
      navigate(`/orders/${order.id}`);
    } catch {
      toast.error('Gagal memproses pembayaran');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Category Tabs */}
      <div className="border-b bg-background">
        <CategoryTabs
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-auto">
        {productsLoading ? (
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center p-3 bg-card rounded-lg border">
                <div className="w-20 h-20 rounded-lg bg-muted animate-pulse mb-3" />
                <div className="h-4 w-16 rounded bg-muted animate-pulse mb-2" />
                <div className="h-4 w-12 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg">Tidak ada produk</p>
            <p className="text-sm">Pilih kategori lain atau tambah produk</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Cart Button (Floating) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Button
          size="lg"
          className="gap-2 shadow-lg min-h-touch-lg px-6"
          onClick={() => setCartDrawerOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Lihat Keranjang</span>
          {itemCount() > 0 && (
            <span className="bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-sm font-bold">
              {itemCount()}
            </span>
          )}
        </Button>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
