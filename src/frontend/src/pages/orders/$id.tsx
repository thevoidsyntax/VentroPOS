import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, XCircle, MoreVertical } from 'lucide-react';
import { useOrder, useVoidOrder } from '@/hooks';
import { OrderStatusBadge } from '@/components/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);
  const voidOrder = useVoidOrder();
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');

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

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Item Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <div className="flex-1">
                <p className="font-medium">{item.product?.name ?? 'Product'}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity}x {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p className="font-medium">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pajak</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diskon</span>
                <span className="text-green-600">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Void Reason */}
      {order.status === 'void' && order.voidReason && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Alasan Pembatalan</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{order.voidReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Void Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Pembatalan</Label>
              <Input
                id="reason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Masukkan alasan pembatalan"
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
              Batalkan Pesanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
