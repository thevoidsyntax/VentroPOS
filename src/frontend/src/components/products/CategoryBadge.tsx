import { cn } from '@/lib/utils';
import type { Category } from '@/lib/api';

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

// Color variants for common categories
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  makanan: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400' },
  minuman: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400' },
  coffee: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-400' },
  snack: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-400' },
  dessert: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400' },
 主食: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400' },
};

function getCategoryColor(name: string): { bg: string; text: string } {
  const normalized = name.toLowerCase();
  return CATEGORY_COLORS[normalized] || { bg: 'bg-muted', text: 'text-muted-foreground' };
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const colors = getCategoryColor(category.name);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        colors.bg,
        colors.text,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {category.name}
    </span>
  );
}
