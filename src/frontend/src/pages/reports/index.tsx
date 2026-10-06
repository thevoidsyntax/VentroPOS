import { useState } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useSalesReport, useProductReport, useStaffReport } from '@/hooks';

const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });

  const { data: salesData, isLoading: salesLoading } = useSalesReport(dateRange);
  const { data: productData, isLoading: productLoading } = useProductReport(dateRange);
  const { data: staffData, isLoading: staffLoading } = useStaffReport(dateRange);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Laporan</h1>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-auto"
              />
            </div>
            <div className="space-y-2">
              <Label>Sampai Tanggal</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Penjualan</p>
            <p className="text-2xl font-bold text-primary">
              {salesLoading ? '-' : formatCurrency(salesData?.totalSales ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Jumlah Pesanan</p>
            <p className="text-2xl font-bold">
              {salesLoading ? '-' : formatNumber(salesData?.totalOrders ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rata-rata Pesanan</p>
            <p className="text-2xl font-bold">
              {salesLoading ? '-' : formatCurrency(salesData?.averageOrderValue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Pajak</p>
            <p className="text-2xl font-bold">
              {salesLoading ? '-' : formatCurrency(salesData?.totalTax ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Penjualan</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : salesData?.topProducts && salesData.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {salesData.topProducts.slice(0, 10).map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(product.quantity)} terjual
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performa Produk</CardTitle>
            </CardHeader>
            <CardContent>
              {productLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : productData?.products && productData.products.length > 0 ? (
                <div className="space-y-3">
                  {productData.products.slice(0, 10).map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(product.quantity)} terjual @ {formatCurrency(product.avgPrice)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performa Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : staffData && staffData.length > 0 ? (
                <div className="space-y-3">
                  {staffData.map((staff) => (
                    <div
                      key={staff.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="font-medium">{staff.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(staff.totalOrders)} pesanan
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(staff.totalSales)}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {formatCurrency(staff.averageOrderValue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
