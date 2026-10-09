import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductForm } from '@/components/products';
import { useProduct } from '@/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: product, isLoading, error } = useProduct(id || '');

  // Show loading state
  if (isEditing && isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="aspect-video max-w-md" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      </div>
    );
  }

  // Handle error
  if (isEditing && error) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Produk tidak ditemukan</h2>
          <p className="text-muted-foreground mb-4">
            Produk yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Button asChild>
            <Link to="/products">Kembali ke Daftar Produk</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEditing ? 'Edit Produk' : 'Tambah Produk'}
        </h1>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
