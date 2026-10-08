import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OrderStatusBadge } from '@/components/orders';
import { useOrders, useUsers } from '@/hooks';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/api';
import { toast } from 'sonner';

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'preparing', label: 'Sedang Dibuat' },
  { value: 'ready', label: 'Siap' },
  { value: 'completed', label: 'Selesai' },
  { value: 'void', label: 'Dibatalkan' },
];

const ITEMS_PER_PAGE = 20;

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const status = searchParams.get('status') as OrderStatus | null;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const userId = searchParams.get('userId') || undefined;

  const { data, isLoading, refetch, isFetching } = useOrders({
    status: status ?? undefined,
    startDate,
    endDate,
    userId: userId ?? undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const { data: users } = useUsers();

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast.success('Data pesanan diperbarui');
    } catch {
      toast.error('Gagal memperbarui data');
    }
  }, [refetch]);

  const clearFilters = () => {
    setSearchParams({});
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = !!(status || startDate || endDate || userId);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pesanan</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/pos">
              <Plus className="h-4 w-4 mr-2" />
              Pesanan Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
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
            setPage(1);
            if (value === 'all') {
              searchParams.delete('status');
            } else {
              searchParams.set('status', value);
            }
            setSearchParams(searchParams);
          }}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
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

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(date) => {
            setPage(1);
            if (date) searchParams.set('startDate', date);
            else searchParams.delete('startDate');
            setSearchParams(searchParams);
          }}
          onEndDateChange={(date) => {
            setPage(1);
            if (date) searchParams.set('endDate', date);
            else searchParams.delete('endDate');
            setSearchParams(searchParams);
          }}
        />

        {users && users.length > 0 && (
          <Select
            value={userId ?? 'all'}
            onValueChange={(value) => {
              setPage(1);
              if (value === 'all') searchParams.delete('userId');
              else searchParams.set('userId', value);
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Kasir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kasir</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <OrdersSkeleton />
      ) : filteredOrders.length === 0 ? (
        <EmptyState hasFilters={!!search || hasActiveFilters} onClearFilters={clearFilters} />
      ) : (
        <>
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
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {order.user && <span>{order.user.name}</span>}
                      {order.table && <span>Meja {order.table.name}</span>}
                    </div>
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

// Date Range Filter Component
interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string | undefined) => void;
  onEndDateChange: (date: string | undefined) => void;
}

function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (range: { from?: Date; to?: Date }) => {
    if (range.from) {
      onStartDateChange(formatDate(range.from));
    }
    if (range.to) {
      onEndDateChange(formatDate(range.to));
      setOpen(false);
    }
  };

  const displayValue = startDate || endDate
    ? `${startDate || '...'} - ${endDate || '...'}`
    : 'Tanggal';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full lg:w-[240px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className={cn(!startDate && !endDate && 'text-muted-foreground')}>
            {displayValue}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: startDate ? new Date(startDate) : undefined,
            to: endDate ? new Date(endDate) : undefined,
          }}
          onSelect={handleSelect}
          numberOfMonths={1}
        />
      </PopoverContent>
    </Popover>
  );
}

// Pagination Component
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Menampilkan {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, total)} dari {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Halaman {page} dari {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Skeleton Component
function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 bg-card rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Tidak ada pesanan</h3>
      <p className="text-muted-foreground mb-4">
        {hasFilters
          ? 'Tidak ada pesanan yang sesuai dengan filter yang dipilih'
          : 'Belum ada pesanan yang tercatat'}
      </p>
      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Hapus Filter
        </Button>
      )}
    </div>
  );
}
