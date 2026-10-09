import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from './ImageUpload';
import { PriceInput } from './PriceInput';
import { ModifierGroupEditor } from './ModifierGroupEditor';
import { CategoryDialog } from './CategoryDialog';
import { useCategories, useCreateProduct, useUpdateProduct } from '@/hooks';
import { toast } from 'sonner';
import type { Product, CreateProductData, UpdateProductData } from '@/lib/api';

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const navigate = useNavigate();
  const isEditing = !!product;

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [modifierGroupIds, setModifierGroupIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // UI state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku || '');
      setCategoryId(product.categoryId);
      setPrice(product.price.toString());
      setCost(product.cost?.toString() || '');
      setStock(product.stock.toString());
      setLowStockThreshold(product.lowStockThreshold.toString());
      setDescription(product.description || '');
      setImageUrl(product.imageUrl);
      setIsActive(product.isActive);
    }
  }, [product]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nama produk harus diisi';
    } else if (name.length > 100) {
      newErrors.name = 'Nama produk maksimal 100 karakter';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Kategori harus dipilih';
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum)) {
      newErrors.price = 'Harga harus diisi';
    } else if (priceNum <= 0) {
      newErrors.price = 'Harga harus lebih dari 0';
    }

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      newErrors.stock = 'Stok harus angka positif';
    }

    const thresholdNum = parseInt(lowStockThreshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      newErrors.lowStockThreshold = 'Batas bawah stok harus angka positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const priceNum = parseFloat(price);
      const stockNum = parseInt(stock);
      const thresholdNum = parseInt(lowStockThreshold);
      const costNum = cost ? parseFloat(cost) : undefined;

      if (isEditing) {
        const data: UpdateProductData = {
          name: name.trim(),
          sku: sku.trim() || undefined,
          categoryId,
          price: priceNum,
          cost: costNum,
          stock: stockNum,
          lowStockThreshold: thresholdNum,
          description: description.trim() || undefined,
          imageUrl,
          isActive,
        };

        await updateProduct.mutateAsync({ id: product.id, data });
        toast.success('Produk berhasil diperbarui');
      } else {
        const data: CreateProductData = {
          name: name.trim(),
          sku: sku.trim() || undefined,
          categoryId,
          price: priceNum,
          cost: costNum,
          stock: stockNum,
          lowStockThreshold: thresholdNum,
          description: description.trim() || undefined,
          imageUrl,
          modifierGroupIds,
        };

        await createProduct.mutateAsync(data);
        toast.success('Produk berhasil dibuat');
      }

      navigate('/products');
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Foto Produk</Label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>

        <Separator />

        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Americano"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="PROD-001"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category" className={errors.categoryId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId}</p>
            )}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-6 p-0 text-xs"
              onClick={() => setCategoryDialogOpen(true)}
            >
              + Tambah Kategori Baru
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Harga *</Label>
            <PriceInput
              value={price}
              onChange={setPrice}
              error={!!errors.price}
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cost">Harga Pokok</Label>
            <PriceInput
              value={cost}
              onChange={setCost}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stok</Label>
            <Input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={errors.stock ? 'border-destructive' : ''}
              min="0"
            />
            {errors.stock && (
              <p className="text-xs text-destructive">{errors.stock}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Batas Bawah Stok</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className={errors.lowStockThreshold ? 'border-destructive' : ''}
              min="0"
            />
            {errors.lowStockThreshold && (
              <p className="text-xs text-destructive">{errors.lowStockThreshold}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi produk..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {description.length}/500
          </p>
        </div>

        {/* Modifier Groups */}
        {!isEditing && (
          <>
            <Separator />
            <div className="space-y-4">
              <Label>Grup Modifier</Label>
              <ModifierGroupEditor
                selectedGroups={modifierGroupIds}
                onChange={setModifierGroupIds}
              />
            </div>
          </>
        )}

        {/* Status Toggle (for edit) */}
        {isEditing && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Produk aktif
              </Label>
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/products')}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Produk'}
          </Button>
        </div>
      </form>

      {/* Category Dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSuccess={() => {
          // Refresh categories
        }}
      />
    </>
  );
}
