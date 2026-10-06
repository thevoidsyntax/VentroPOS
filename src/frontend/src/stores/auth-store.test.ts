import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  });

  describe('setAuth', () => {
    it('sets user, token, and refreshToken', () => {
      const { result } = useAuthStore();

      result.setAuth(
        { id: 'user-1', email: 'test@test.com', name: 'Test User', role: 'admin', tenantId: 'tenant-1', isActive: true, createdAt: new Date().toISOString() },
        'access-token',
        'refresh-token'
      );

      expect(result.isAuthenticated).toBe(true);
      expect(result.token).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user?.email).toBe('test@test.com');
    });
  });

  describe('updateUser', () => {
    it('updates user data', () => {
      const { result } = useAuthStore();

      result.setAuth(
        { id: 'user-1', email: 'test@test.com', name: 'Test User', role: 'admin', tenantId: 'tenant-1', isActive: true, createdAt: new Date().toISOString() },
        'access-token',
        'refresh-token'
      );

      result.updateUser({ name: 'Updated Name' });

      expect(result.user?.name).toBe('Updated Name');
      expect(result.user?.email).toBe('test@test.com');
    });
  });

  describe('logout', () => {
    it('clears all auth data', () => {
      const { result } = useAuthStore();

      result.setAuth(
        { id: 'user-1', email: 'test@test.com', name: 'Test User', role: 'admin', tenantId: 'tenant-1', isActive: true, createdAt: new Date().toISOString() },
        'access-token',
        'refresh-token'
      );

      result.logout();

      expect(result.isAuthenticated).toBe(false);
      expect(result.token).toBeNull();
      expect(result.refreshToken).toBeNull();
      expect(result.user).toBeNull();
    });
  });
});
