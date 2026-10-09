import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useProducts, useCategories, useDeleteProduct } from '@/hooks';
import { ProductCard } from '@/components/products';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/api';

const ITEMS_PER_PAGE = 24;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const categoryId = searchParams.get('categoryId') || undefined;
  const isActive = searchParams.get('isActive');

  const { data, isLoading, refetch, isFetching } = useProducts({
    categoryId,
    isActive: isActive ? isActive === 'true' : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const { data: categories } = useCategories();
  const deleteProductMutation = useDeleteProduct();

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  // Filter by search term (client-side)
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast.success('Data produk diperbarui');
    } catch {
      toast.error('Gagal memperbarui data');
    }
  }, [refetch]);

  const handleDuplicate = (product: Product) => {
    // Navigate to create page with pre-filled data
    // For now, just show a toast
    toast.info(`Duplikat "${product.name}" - Fitur akan dikembangkan`);
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      await deleteProductMutation.mutateAsync(deleteProduct.id);
      toast.success('Produk berhasil dihapus');
      setDeleteProduct(null);
    } catch {
      toast.error('Gagal menghapus produk');
    }
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = !!(categoryId || isActive);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produk</h1>
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
            <Link to="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau SKU produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={categoryId || 'all'}
          onValueChange={(value) => {
            setPage(1);
            if (value === 'all') {
              searchParams.delete('categoryId');
            } else {
              searchParams.set('categoryId', value);
            }
            setSearchParams(searchParams);
          }}
        >
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={isActive || 'all'}
          onValueChange={(value) => {
            setPage(1);
            if (value === 'all') {
              searchParams.delete('isActive');
            } else {
              searchParams.set('isActive', value);
            }
            setSearchParams(searchParams);
          }}
        >
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState hasFilters={!!search || hasActiveFilters} onClearFilters={clearFilters} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard
                  product={product}
                  onDuplicate={handleDuplicate}
                  onDelete={(p) => setDeleteProduct(p)}
                />
              </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus "{deleteProduct?.name}"? Tindakan ini tidak dapat
              dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
        Menampilkan {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, total)} dari{' '}
        {total}
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

// Empty State Component
function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Tidak ada produk</h3>
      <p className="text-muted-foreground mb-4">
        {hasFilters ? 'Tidak ada produk yang sesuai dengan filter yang dipilih' : 'Belum ada produk yang tercatat'}
      </p>
      {hasFilters ? (
        <Button variant="outline" onClick={onClearFilters}>
          Hapus Filter
        </Button>
      ) : (
        <Button asChild>
          <Link to="/products/new">Tambah Produk</Link>
        </Button>
      )}
    </div>
  );
}
