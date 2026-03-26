import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext.jsx';

/**
 * Returns { authed, login, logout } from the nearest AuthProvider.
 * Must be called inside a component tree wrapped by <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
