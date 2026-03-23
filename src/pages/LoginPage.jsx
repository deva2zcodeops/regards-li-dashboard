import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      localStorage.setItem('auth_token', data.token);
      onLogin();
    } catch {
      setError('Unable to reach server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 340,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: 'var(--green)',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 3,
          }}>
            LI_SCRAPER
          </div>
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 10,
            letterSpacing: 1.5,
            marginTop: 6,
          }}>
            DASHBOARD LOGIN
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10, letterSpacing: 1.2, color: 'var(--text-muted)' }}>
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                color: 'var(--text)',
                fontSize: 12,
                padding: '8px 10px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 10, letterSpacing: 1.2, color: 'var(--text-muted)' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                color: 'var(--text)',
                fontSize: 12,
                padding: '8px 10px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 11,
              color: 'var(--red)',
              letterSpacing: 0.5,
              padding: '6px 8px',
              background: 'var(--red-dim)',
              borderRadius: 3,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              background: 'var(--green)',
              color: '#0a0f0a',
              border: 'none',
              borderRadius: 3,
              padding: '9px 0',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  );
}
