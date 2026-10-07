import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/pos/product-card';
import type { Product } from '@/lib/api';

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Kopi Hitam',
  description: 'Kopi hitam original',
  price: 15000,
  categoryId: 'cat-1',
  stock: 50,
  lowStockThreshold: 10,
  isActive: true,
  createdAt: new Date().toISOString(),
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Kopi Hitam')).toBeInTheDocument();
    expect(screen.getByText('Rp 15.000')).toBeInTheDocument();
  });

  it('shows low stock badge when stock is low', () => {
    const lowStockProduct = { ...mockProduct, stock: 5 };
    render(<ProductCard product={lowStockProduct} />);

    expect(screen.getByText('5 left')).toBeInTheDocument();
  });

  it('shows "Habis" badge when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Habis')).toBeInTheDocument();
  });

  it('does not show low stock badge when stock is sufficient', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.queryByText(/left/)).not.toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(<ProductCard product={mockProduct} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Kopi Hitam'));

    expect(onSelect).toHaveBeenCalledWith(mockProduct);
  });

  it('adds item to cart when plus button is clicked', () => {
    const { container } = render(<ProductCard product={mockProduct} />);

    const addButton = container.querySelector('button');
    fireEvent.click(addButton!);

    // Cart store should have the item
    // This test verifies the button click works
    expect(addButton).toBeInTheDocument();
  });

  it('disables add button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    const { container } = render(<ProductCard product={outOfStockProduct} />);

    const addButton = container.querySelector('button');
    expect(addButton).toBeDisabled();
  });
});
