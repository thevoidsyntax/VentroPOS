import { useAuthStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Users, Printer, Bell } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Pengaturan</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.email} />
              <AvatarFallback className="text-lg">
                {user ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                {user?.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Manajemen User</p>
                <p className="text-sm text-muted-foreground">Kelola akun kasir dan manager</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Kelola
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Perangkat</p>
                <p className="text-sm text-muted-foreground">Printer, scanner, EDC</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Atur
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Notifikasi</p>
                <p className="text-sm text-muted-foreground">Pengaturan notifikasi</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Atur
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>Tentang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versi</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span>2024.01</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
