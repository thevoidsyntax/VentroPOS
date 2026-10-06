import { Package, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { useStockOverview, useStockAlerts } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatCurrency } from '@/lib/utils';

export function StockPage() {
  const { data: overview, isLoading: overviewLoading } = useStockOverview();
  const { data: alerts, isLoading: alertsLoading } = useStockAlerts();

  const stats = [
    {
      title: 'Total Produk',
      value: overview?.totalProducts ?? 0,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Stok Tersedia',
      value: overview?.inStock ?? 0,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Stok Rendah',
      value: overview?.lowStock ?? 0,
      icon: AlertTriangle,
      color: 'text-yellow-600',
    },
    {
      title: 'Stok Habis',
      value: overview?.outOfStock ?? 0,
      icon: XCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Stok Barang</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">
                      {overviewLoading ? '-' : formatNumber(stat.value)}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stock Value */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle>Nilai Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(overview.totalValue)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Peringatan Stok
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div>
                    <p className="font-medium">{alert.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.type === 'out' ? 'Stok habis' : `Sisa ${alert.currentStock}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Threshold</p>
                    <p className="font-medium">{alert.threshold}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Tidak ada peringatan stok</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
