import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await api.auth.login(email, password);
      setAuth(response.user, response.accessToken, response.refreshToken);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Login berhasil',
        description: 'Selamat datang di VentroPOS',
      });
      navigate('/pos');
    },
    onError: (error: { message: string }) => {
      toast({
        variant: 'destructive',
        title: 'Login gagal',
        description: error.message || 'Email atau password salah',
      });
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      logout();
      navigate('/login');
      toast({
        title: 'Logout berhasil',
      });
    },
  });
}
