import { Link } from 'react-router-dom';
import { Edit, AlertTriangle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge } from './CategoryBadge';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/api';

interface ProductCardProps {
  product: Product;
  onDuplicate?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductCard({ product, onDuplicate, onDelete: _onDelete }: ProductCardProps) {
  const isLowStock = product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group relative bg-card rounded-lg border overflow-hidden hover:border-primary/30 transition-colors">
      {/* Product Image */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-muted-foreground/50">
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Habis
            </Badge>
          ) : isLowStock ? (
            <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              {product.stock}
            </Badge>
          ) : (
            <Badge variant="secondary">Stok: {product.stock}</Badge>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <div className="space-y-1">
          {product.category && (
            <CategoryBadge category={product.category} />
          )}
          <h3 className="font-medium line-clamp-1">{product.name}</h3>
          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold">
            {formatCurrency(product.price)}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  onDuplicate(product);
                }}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Salin</span>
              </Button>
            )}
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link to={`/products/${product.id}/edit`}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
