import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';

describe('OrderStatusBadge', () => {
  it('displays pending status correctly', () => {
    render(<OrderStatusBadge status="pending" />);
    expect(screen.getByText('Menunggu')).toBeInTheDocument();
  });

  it('displays preparing status correctly', () => {
    render(<OrderStatusBadge status="preparing" />);
    expect(screen.getByText('Sedang Dibuat')).toBeInTheDocument();
  });

  it('displays ready status correctly', () => {
    render(<OrderStatusBadge status="ready" />);
    expect(screen.getByText('Siap')).toBeInTheDocument();
  });

  it('displays completed status correctly', () => {
    render(<OrderStatusBadge status="completed" />);
    expect(screen.getByText('Selesai')).toBeInTheDocument();
  });

  it('displays void status correctly', () => {
    render(<OrderStatusBadge status="void" />);
    expect(screen.getByText('Dibatalkan')).toBeInTheDocument();
  });

  it('applies correct variant for each status', () => {
    const { rerender } = render(<OrderStatusBadge status="pending" />);
    expect(screen.getByText('Menunggu').className).toContain('bg-amber');

    rerender(<OrderStatusBadge status="preparing" />);
    expect(screen.getByText('Sedang Dibuat').className).toContain('bg-blue');

    rerender(<OrderStatusBadge status="ready" />);
    expect(screen.getByText('Siap').className).toContain('bg-emerald');

    rerender(<OrderStatusBadge status="completed" />);
    expect(screen.getByText('Selesai').className).toContain('bg-gray');

    rerender(<OrderStatusBadge status="void" />);
    expect(screen.getByText('Dibatalkan').className).toContain('bg-red');
  });
});
