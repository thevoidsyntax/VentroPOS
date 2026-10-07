import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTabs } from '@/components/pos/category-tabs';
import type { Category } from '@/lib/api';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Kopi', sortOrder: 1, isActive: true },
  { id: 'cat-2', name: 'Teh', sortOrder: 2, isActive: true },
  { id: 'cat-3', name: 'Makanan', sortOrder: 3, isActive: true },
];

describe('CategoryTabs', () => {
  it('renders all categories', () => {
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedId={null}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Semua')).toBeInTheDocument();
    expect(screen.getByText('Kopi')).toBeInTheDocument();
    expect(screen.getByText('Teh')).toBeInTheDocument();
    expect(screen.getByText('Makanan')).toBeInTheDocument();
  });

  it('renders empty when no categories', () => {
    render(
      <CategoryTabs
        categories={[]}
        selectedId={null}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Semua')).toBeInTheDocument();
    expect(screen.queryByText('Kopi')).not.toBeInTheDocument();
  });

  it('calls onSelect with null when "Semua" is clicked', () => {
    const onSelect = vi.fn();
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedId="cat-1"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Semua'));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('calls onSelect with category id when category is clicked', () => {
    const onSelect = vi.fn();
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedId={null}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Kopi'));

    expect(onSelect).toHaveBeenCalledWith('cat-1');
  });

  it('highlights selected category', () => {
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedId="cat-2"
        onSelect={vi.fn()}
      />
    );

    const tehButton = screen.getByText('Teh').closest('button');
    expect(tehButton).toHaveClass(/bg-primary/);
  });
});
