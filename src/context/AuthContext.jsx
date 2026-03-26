import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

/**
 * Owns the authentication state for the entire app.
 * Exposes { authed, login, logout } via context.
 */
export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('auth_token'));

  // Listen for the 401 event fired by apiFetch on unauthorized responses.
  useEffect(() => {
    const onLogout = () => setAuthed(false);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  function login() {
    setAuthed(true);
  }

  function logout() {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new Event('auth:logout'));
  }

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
