import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import './workflow.css';

export default function WorkflowLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@notivo1.com');
  const [password, setPassword] = useState('admin123');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { 
      setError('Please fill in all fields.'); 
      return; 
    }
    
    setLoading(true);
    try {
      const response = await userAPI.login(email, password);
      
      if (response.success) {
        // Store token and user info
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user || { email }));
        
        if (remember) {
          localStorage.setItem('rememberEmail', email);
        }
        
        setTimeout(() => {
          setLoading(false);
          navigate('/dashboard');
        }, 500);
      } else {
        setError(response.message || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure backend is running on http://localhost:5000');
      setLoading(false);
      console.error('Login error:', err);
    }
  };

  return (
    <div className="wf-auth-page">
      <div className="wf-auth-card">
        {/* Logo */}
        <div className="wf-auth-logo">
          <div className="wf-auth-logo-icon">
            <span /><span /><span />
          </div>
          <h1>WorkflowAdmin</h1>
        </div>
        <p className="wf-auth-subtitle">Enterprise Suite Management Portal</p>

        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:7, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#B91C1C' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="wf-form-group">
            <label className="wf-form-label">Email Address</label>
            <input
              type="email"
              className="wf-input"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="wf-form-group">
            <div className="wf-form-label-row">
              <span className="wf-form-label" style={{margin:0}}>Password</span>
              <a href="#">Forgot Password?</a>
            </div>
            <input
              type="password"
              className="wf-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="wf-checkbox-row">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <label htmlFor="remember">Remember Me</label>
          </div>

          <button type="submit" className="wf-btn-primary" style={{marginBottom:20}} disabled={loading}>
            {loading ? 'Signing in...' : 'Login to Dashboard →'}
          </button>

          <div className="wf-divider">Identity Provider</div>

          <button type="button" className="wf-btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Single Sign-On
          </button>
        </form>

        <div className="wf-auth-footer">
          <div className="wf-auth-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#" className="accent">⊕ Contact Support</a>
          </div>
          <div>© 2024 WorkflowAdmin Enterprise Suite. All rights reserved.</div>
          <div style={{ marginTop: 12 }}>
            <a href="/user/login" style={{ color: '#16A34A', fontWeight: 600, fontSize: 13 }}>
              👤 Go to User Portal →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
