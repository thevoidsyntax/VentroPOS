import type { Product } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const isLowStock = product.stock <= (product.lowStockThreshold || 5);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      quantity: 1,
      unitPrice: product.price,
      modifiers: [],
    });
  };

  return (
    <Card
      className={cn(
        'group relative flex flex-col items-center p-3 cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:border-primary/30',
        'active:scale-[0.98] active:shadow-sm',
        'select-none min-h-[140px]',
        isOutOfStock && 'opacity-60'
      )}
      onClick={() => onSelect?.(product)}
    >
      {/* Product Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted mb-2 flex-shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-2xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Product Name */}
      <span className="text-sm font-medium text-center line-clamp-2 w-full">
        {product.name}
      </span>

      {/* Price */}
      <span className="text-sm font-semibold text-primary mt-1">
        {formatCurrency(product.price)}
      </span>

      {/* Low Stock Badge */}
      {isLowStock && !isOutOfStock && (
        <Badge
          variant="warning"
          className="absolute top-2 right-2 text-xs"
        >
          {product.stock} left
        </Badge>
      )}

      {/* Out of Stock */}
      {isOutOfStock && (
        <Badge
          variant="destructive"
          className="absolute top-2 right-2 text-xs"
        >
          Habis
        </Badge>
      )}

      {/* Add Button */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={cn(
          'absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center',
          'bg-primary text-primary-foreground shadow-sm',
          'hover:bg-primary/90 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95'
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </Card>
  );
}
