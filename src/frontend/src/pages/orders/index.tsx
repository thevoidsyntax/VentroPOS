import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OrderStatusBadge } from '@/components/orders';
import { useOrders } from '@/hooks';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, RefreshCw } from 'lucide-react';
import type { OrderStatus } from '@/lib/api';

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'preparing', label: 'Sedang Dibuat' },
  { value: 'ready', label: 'Siap' },
  { value: 'completed', label: 'Selesai' },
  { value: 'void', label: 'Dibatalkan' },
];

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const status = searchParams.get('status') as OrderStatus | null;
  const { data, isLoading, refetch, isFetching } = useOrders(
    status ? { status } : undefined
  );

  const orders = data?.data ?? [];

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pesanan</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor pesanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={status ?? 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              searchParams.delete('status');
            } else {
              searchParams.set('status', value);
            }
            setSearchParams(searchParams);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Tidak ada pesanan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block p-4 bg-card rounded-lg border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.total)}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.items.length} item
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
