import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import './user.css';

// Mock user credentials (same DB, role: USER / MOD)
const MOCK_USERS = [
  { email: 'jordan.smith@workflow.admin', password: 'user123', name: 'Jordan Smith',   role: 'USER', initials: 'JS' },
  { email: 'amara.m@workflow.admin',       password: 'user123', name: 'Amara Miller',   role: 'MOD',  initials: 'AM' },
  { email: 'david.wright@workflow.admin',  password: 'user123', name: 'David Wright',  role: 'USER', initials: 'DW' },
  { email: 'elena.l@workflow.admin',       password: 'user123', name: 'Elena Lopez',   role: 'USER', initials: 'EL' },
];

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }

    setLoading(true);

    // Try backend first
    try {
      const response = await userAPI.login(email, password);
      if (response.success) {
        const user = response.user || { email };
        // Block admin from using user portal
        if (user.role === 'admin' || user.role === 'ADMIN') {
          setError('Admin accounts must use the Admin Login portal.');
          setLoading(false);
          return;
        }
        localStorage.setItem('userToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setTimeout(() => { setLoading(false); navigate('/user/dashboard'); }, 500);
        return;
      }
    } catch (_) { /* backend may be down, fall through to mock */ }

    // Fallback: check mock users
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      localStorage.setItem('userToken', 'mock-user-token-' + Date.now());
      localStorage.setItem('currentUser', JSON.stringify({ email: found.email, name: found.name, role: found.role, initials: found.initials }));
      setTimeout(() => { setLoading(false); navigate('/user/dashboard'); }, 500);
    } else {
      setError('Invalid email or password. Check the demo credentials below.');
      setLoading(false);
    }
  };

  const fillDemo = (u) => { setEmail(u.email); setPassword('user123'); setError(''); };

  return (
    <div className="u-auth-page">
      {/* Left decorative panel */}
      <div className="u-auth-panel">
        <div className="u-panel-glow" />
        <div className="u-panel-content">
          <div className="u-panel-logo">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="12" fill="white" fillOpacity="0.15"/>
              <path d="M10 22C10 15.373 15.373 10 22 10C28.627 10 34 15.373 34 22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 34C22 34 14 29 14 22C14 17.582 17.582 14 22 14C26.418 14 30 17.582 30 22C30 29 22 34 22 34Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2"/>
              <circle cx="22" cy="22" r="3" fill="white"/>
            </svg>
            <span>WorkflowOS</span>
          </div>
          <h2>Your Work,<br/>Your Way.</h2>
          <p>Access your assigned timetables, track tasks, and submit completed work — all in one place.</p>
          <div className="u-panel-features">
            <div className="u-panel-feat"><span>📋</span> View assigned timetables</div>
            <div className="u-panel-feat"><span>✅</span> Submit completed tasks</div>
            <div className="u-panel-feat"><span>📊</span> Track your progress</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="u-auth-form-side">
        <div className="u-auth-card">
          <div className="u-auth-header">
            <div className="u-auth-badge">USER PORTAL</div>
            <h1>Welcome back</h1>
            <p>Sign in to access your assigned work</p>
          </div>

          {error && (
            <div className="u-alert u-alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="u-form">
            <div className="u-field">
              <label htmlFor="u-email">Email Address</label>
              <div className="u-input-wrap">
                <svg className="u-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input
                  id="u-email"
                  type="email"
                  className="u-input"
                  placeholder="your.name@workflow.admin"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="u-field">
              <label htmlFor="u-password">Password</label>
              <div className="u-input-wrap">
                <svg className="u-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="u-password"
                  type={showPw ? 'text' : 'password'}
                  className="u-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="u-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" className="u-btn-primary" disabled={loading}>
              {loading
                ? <><span className="u-spinner"/>&nbsp;Signing in...</>
                : <>Sign in to Portal &nbsp;→</>
              }
            </button>
          </form>

          {/* Demo quick-fill */}
          <div className="u-demo-section">
            <div className="u-demo-label">— Demo Accounts —</div>
            <div className="u-demo-chips">
              {MOCK_USERS.map(u => (
                <button key={u.email} className="u-demo-chip" onClick={() => fillDemo(u)}>
                  <span className="u-demo-av">{u.initials}</span>
                  <span>{u.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="u-auth-footer">
            <a href="#" className="u-footer-link">Forgot password?</a>
            <span>·</span>
            <a href="/login" className="u-footer-link">Admin Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}
