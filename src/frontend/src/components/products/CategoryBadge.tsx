import { cn } from '@/lib/utils';
import type { Category } from '@/lib/api';

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted',
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-primary" />
      {category.name}
    </span>
  );
}
