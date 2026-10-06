import { useCartStore } from '@/stores';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem } from './cart-item';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onOpenChange, onCheckout }: CartDrawerProps) {
  const { items, subtotal, tax, total, updateQuantity, removeItem } = useCartStore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? 'Keranjang kosong'
              : `${items.length} item${items.length !== 1 ? 's' : ''}`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">Keranjang kosong</p>
            <p className="text-sm">Tekan produk untuk menambahkan</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Summary */}
            <div className="mt-4 space-y-3">
              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pajak (11%)</span>
                  <span>{formatCurrency(tax())}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total())}</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <SheetFooter className="mt-4 -mx-6 px-6 pb-6">
              <Button
                size="lg"
                className="w-full gap-2 min-h-touch-lg"
                onClick={onCheckout}
              >
                Bayar {formatCurrency(total())}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
