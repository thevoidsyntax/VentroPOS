import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, XCircle, CreditCard, Banknote, QrCode } from 'lucide-react';
import { useOrder, useVoidOrder } from '@/hooks';
import { OrderStatusBadge } from '@/components/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

const voidReasonPresets = [
  'Pelanggan membatalkan',
  'Item salah input',
  'Error sistem',
  'Double charge',
  'Lainnya',
];

const paymentMethodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  qris: <QrCode className="h-4 w-4" />,
  debit: <CreditCard className="h-4 w-4" />,
  credit: <CreditCard className="h-4 w-4" />,
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  debit: 'Debit',
  credit: 'Kredit',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id!);
  const voidOrder = useVoidOrder();
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: string) => {
    if (preset === 'Lainnya') {
      setVoidReason('');
      setSelectedPreset(null);
    } else {
      setVoidReason(preset);
      setSelectedPreset(preset);
    }
  };

  const handleVoid = async () => {
    if (!id || !voidReason.trim()) return;

    try {
      await voidOrder.mutateAsync({ orderId: id, reason: voidReason });
      toast.success('Pesanan berhasil dibatalkan');
      setVoidDialogOpen(false);
    } catch {
      toast.error('Gagal membatalkan pesanan');
    }
  };

  const handlePrint = async () => {
    toast.success('Struk sedang dicetak');
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-6 text-center">
        <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {order.status !== 'void' && order.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setVoidDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Batalkan
            </Button>
          )}
        </div>
      </div>

      {/* Order Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informasi Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {order.user && (
              <div>
                <p className="text-muted-foreground">Kasir</p>
                <p className="font-medium">{order.user.name}</p>
              </div>
            )}
            {order.table && (
              <div>
                <p className="text-muted-foreground">Meja</p>
                <p className="font-medium">{order.table.name}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Items</p>
              <p className="font-medium">{order.items.length} item</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{order.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Item Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <p className="font-medium">
                    {item.quantity}x {item.product?.name ?? 'Product'}
                  </p>
                  <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(item.unitPrice)} per item
                </p>

                {/* Modifiers */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {item.modifiers.map((mod) => (
                      <div
                        key={mod.id}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span>{mod.name}</span>
                        {mod.price > 0 && (
                          <span className="text-xs">+{formatCurrency(mod.price)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Item notes */}
                {item.notes && (
                  <p className="text-sm italic text-muted-foreground ml-4">
                    Catatan: {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pajak (11%)</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diskon</span>
                <span className="text-green-600">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Void Reason */}
      {order.status === 'void' && order.voidReason && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive text-base">Alasan Pembatalan</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{order.voidReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Cetak Struk
        </Button>
        {order.status !== 'void' && order.status !== 'completed' && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setVoidDialogOpen(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Batalkan Pesanan
          </Button>
        )}
      </div>

      {/* Void Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat
              dibatalkan dan stok akan dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alasan Pembatalan</Label>
              <div className="flex flex-wrap gap-2">
                {voidReasonPresets.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={selectedPreset === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Keterangan Tambahan</Label>
              <Textarea
                id="reason"
                value={voidReason}
                onChange={(e) => {
                  setVoidReason(e.target.value);
                  setSelectedPreset(null);
                }}
                placeholder="Masukkan alasan pembatalan atau keterangan tambahan..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={!voidReason.trim() || voidOrder.isPending}
            >
              {voidOrder.isPending ? 'Memproses...' : 'Batalkan Pesanan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
