import type { OrderStatus } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'pending' | 'preparing' | 'ready' | 'completed' | 'void' }> = {
  pending: { label: 'Menunggu', variant: 'pending' },
  preparing: { label: 'Sedang Dibuat', variant: 'preparing' },
  ready: { label: 'Siap', variant: 'ready' },
  completed: { label: 'Selesai', variant: 'completed' },
  void: { label: 'Dibatalkan', variant: 'void' },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
