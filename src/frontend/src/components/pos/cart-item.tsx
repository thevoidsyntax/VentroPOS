import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '@/stores';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.price, 0);
  const itemTotal = (item.unitPrice + modifiersTotal) * item.quantity;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Product Image */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span>🍽️</span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.name}</p>
            {item.modifiers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {item.modifiers.map((m) => m.name).join(', ')}
              </p>
            )}
          </div>
          <span className="font-semibold text-sm whitespace-nowrap">
            {formatCurrency(itemTotal)}
          </span>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
