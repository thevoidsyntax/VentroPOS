import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCategories, useCreateCategory, useUpdateCategory } from '@/hooks';
import type { Category, CreateCategoryData } from '@/lib/api';
import { toast } from 'sonner';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSuccess?: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: _categories } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setDescription(category.description || '');
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nama kategori harus diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateCategoryData = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      if (category) {
        await updateCategory.mutateAsync({ id: category.id, data });
        toast.success('Kategori berhasil diperbarui');
      } else {
        await createCategory.mutateAsync(data);
        toast.success('Kategori berhasil dibuat');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error('Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Kategori' : 'Tambah Kategori'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kategori *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Makanan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi kategori..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : category ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Category List Component
interface CategoryListProps {
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
}

export function CategoryList({ selectedId, onSelect }: CategoryListProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Memuat...</div>;
  }

  if (!categories || categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada kategori. Tambahkan kategori baru untuk melanjutkan.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={selectedId === undefined ? 'secondary' : 'outline'}
        size="sm"
        onClick={() => onSelect(undefined)}
      >
        Semua
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          type="button"
          variant={selectedId === category.id ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}
