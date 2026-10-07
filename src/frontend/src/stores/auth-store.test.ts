import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear();
    const store = useAuthStore.getState();
    store.logout(); // Use logout to reset (it clears all auth state)
  });

  describe('setAuth', () => {
    it('sets user, token, and refreshToken', () => {
      const store = useAuthStore.getState();
      store.setAuth(
        { id: 'user-1', email: 'test@test.com', name: 'Test User', role: 'admin', tenantId: 'tenant-1', isActive: true, createdAt: new Date().toISOString() },
        'access-token',
        'refresh-token'
      );

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.user?.email).toBe('test@test.com');
    });
  });

  describe('updateUser', () => {
    it('updates user data', () => {
      const store = useAuthStore.getState();
      store.setAuth(
        { id: 'user-1', email: 'test@test.com', name: 'Test User', role: 'admin', tenantId: 'tenant-1', isActive: true, createdAt: new Date().toISOString() },
        'access-token',
        'refresh-token'
      );

      store.updateUser({ name: 'Updated Name' });

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.email).toBe('test@test.com');
    });
  });

  describe('logout', () => {
    it('clears all auth data', () => {
      const store = useAuthStore.getState();
      store.setAuth(
        { id: 'user-1', email: 'test@test.com', name: 'Test User', role: 'admin', tenantId: 'tenant-1', isActive: true, createdAt: new Date().toISOString() },
        'access-token',
        'refresh-token'
      );

      store.logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
    });
  });
});
