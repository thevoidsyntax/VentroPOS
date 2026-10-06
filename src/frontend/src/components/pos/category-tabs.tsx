import type { Category } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CategoryTabsProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 p-3 overflow-x-auto scrollbar-hide">
      {/* All Products */}
      <Button
        variant={selectedId === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(null)}
        className={cn(
          'flex-shrink-0 gap-2 min-h-touch',
          selectedId === null && 'bg-primary text-primary-foreground'
        )}
      >
        <span className="text-lg">🍽️</span>
        Semua
      </Button>

      {/* Category Buttons */}
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedId === category.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(category.id)}
          className={cn(
            'flex-shrink-0 gap-2 min-h-touch',
            selectedId === category.id && 'bg-primary text-primary-foreground'
          )}
        >
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt=""
              className="w-5 h-5 rounded object-cover"
            />
          ) : (
            <span className="text-lg">
              {category.name.charAt(0).toUpperCase()}
            </span>
          )}
          {category.name}
        </Button>
      ))}
    </div>
  );
}
