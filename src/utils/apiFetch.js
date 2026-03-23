const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export { API_BASE };

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new Event('auth:logout'));
    throw new Error('Unauthorized');
  }
  return res;
}
