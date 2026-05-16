import React, { useState } from 'react';
import UserLayout from './UserLayout';
import './user.css';

export default function UserSettings() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  });

  const [form, setForm]         = useState({ name: user.name || '', email: user.email || '' });
  const [pwForm, setPwForm]     = useState({ current: '', newPw: '', confirm: '' });
  const [toast, setToast]       = useState({ msg: '', type: '' });
  const [notifs, setNotifs]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('u_notif_prefs') || '{}'); }
    catch { return {}; }
  });
  const [theme, setTheme]       = useState(localStorage.getItem('u_theme') || 'light');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);

  const initials = (form.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  // ── Save Profile ────────────────────────────────────────────────────
  const saveProfile = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    const updated = { ...user, name: form.name.trim(), email: form.email.trim() };
    localStorage.setItem('currentUser', JSON.stringify(updated));
    setUser(updated);
    showToast('✅ Profile updated successfully!');
  };

  // ── Change Password (mock) ──────────────────────────────────────────
  const changePassword = (e) => {
    e.preventDefault();
    if (!pwForm.current) { showToast('Enter your current password.', 'error'); return; }
    if (pwForm.newPw.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (pwForm.newPw !== pwForm.confirm) { showToast('Passwords do not match.', 'error'); return; }
    setPwForm({ current: '', newPw: '', confirm: '' });
    showToast('✅ Password changed successfully!');
  };

  // ── Notification prefs ──────────────────────────────────────────────
  const toggleNotif = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    localStorage.setItem('u_notif_prefs', JSON.stringify(updated));
  };

  // ── Theme ────────────────────────────────────────────────────────────
  const switchTheme = (t) => {
    setTheme(t);
    localStorage.setItem('u_theme', t);
    showToast(`Theme set to ${t}.`);
  };

  const EyeIcon = ({ show, toggle }) => (
    <button type="button" onClick={toggle}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
      {show
        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );

  const Section = ({ title, icon, children }) => (
    <div className="u-card" style={{ marginBottom: 20 }}>
      <div className="u-card-header">
        <div className="u-card-title">{icon} {title}</div>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #D1FAE5', borderRadius: 9,
    fontSize: 14, color: '#0F172A', background: '#F8FFFE', outline: 'none',
    fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const Toggle = ({ checked, onChange, label, sub }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F0FDF4' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        type="button"
        onClick={onChange}
        style={{
          width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: checked ? 'linear-gradient(135deg,#16A34A,#22C55E)' : '#D1D5DB',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );

  return (
    <UserLayout>

      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: toast.type === 'error' ? '#FEF2F2' : '#0F172A',
          color: toast.type === 'error' ? '#B91C1C' : '#fff',
          border: toast.type === 'error' ? '1px solid #FCA5A5' : 'none',
          padding: '14px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', animation: 'u-slide-in 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="u-page-header">
        <div>
          <div className="u-page-title">⚙️ Settings</div>
          <div className="u-page-sub">Manage your profile, password and preferences.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Avatar card ─────────────────────────────────────────── */}
        <div>
          <div className="u-card" style={{ marginBottom: 16 }}>
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                color: '#fff', fontSize: 26, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 6px 20px rgba(22,163,74,0.3)',
              }}>
                {initials}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{form.name || 'User'}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{form.email}</div>
              <div style={{ marginTop: 10 }}>
                <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                  {user.role || 'USER'}
                </span>
              </div>
            </div>
          </div>

          {/* Theme picker */}
          <div className="u-card">
            <div className="u-card-header"><div className="u-card-title">🎨 Theme</div></div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['light', 'dark', 'system'].map(t => (
                <button
                  key={t}
                  onClick={() => switchTheme(t)}
                  style={{
                    padding: '9px 14px', borderRadius: 8, border: `1.5px solid ${theme === t ? '#22C55E' : '#E2E8F0'}`,
                    background: theme === t ? '#F0FDF4' : '#fff', color: theme === t ? '#15803D' : '#475569',
                    fontWeight: theme === t ? 700 : 500, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.12s',
                  }}
                >
                  {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {theme === t && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Forms ──────────────────────────────────────────────── */}
        <div>
          {/* Profile */}
          <Section title="My Profile" icon="👤">
            <form onSubmit={saveProfile}>
              <Field label="Full Name">
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                  onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#D1FAE5'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FFFE'; }}
                />
              </Field>
              <Field label="Email Address">
                <input
                  style={{ ...inputStyle, background: '#F1F5F9', color: '#94A3B8', cursor: 'not-allowed' }}
                  value={form.email}
                  readOnly
                />
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>Email cannot be changed. Contact your admin.</div>
              </Field>
              <Field label="Role">
                <input style={{ ...inputStyle, background: '#F1F5F9', color: '#94A3B8', cursor: 'not-allowed' }} value={user.role || 'USER'} readOnly />
              </Field>
              <button type="submit" className="u-btn u-btn-green" style={{ marginTop: 4 }}>
                💾 Save Profile
              </button>
            </form>
          </Section>

          {/* Password */}
          <Section title="Change Password" icon="🔐">
            <form onSubmit={changePassword}>
              <Field label="Current Password">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                    onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#D1FAE5'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FFFE'; }}
                  />
                  <EyeIcon show={showCurrent} toggle={() => setShowCurrent(p => !p)} />
                </div>
              </Field>
              <Field label="New Password">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    value={pwForm.newPw}
                    onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                    placeholder="Min. 6 characters"
                    onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#D1FAE5'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FFFE'; }}
                  />
                  <EyeIcon show={showNew} toggle={() => setShowNew(p => !p)} />
                </div>
                {/* Strength bar */}
                {pwForm.newPw && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 4, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, transition: 'width 0.3s',
                        width: pwForm.newPw.length < 4 ? '25%' : pwForm.newPw.length < 6 ? '50%' : pwForm.newPw.length < 10 ? '75%' : '100%',
                        background: pwForm.newPw.length < 4 ? '#EF4444' : pwForm.newPw.length < 6 ? '#F59E0B' : pwForm.newPw.length < 10 ? '#3B82F6' : '#22C55E',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                      {pwForm.newPw.length < 4 ? 'Weak' : pwForm.newPw.length < 6 ? 'Fair' : pwForm.newPw.length < 10 ? 'Good' : 'Strong'} password
                    </div>
                  </div>
                )}
              </Field>
              <Field label="Confirm New Password">
                <input
                  type="password"
                  style={{ ...inputStyle, borderColor: pwForm.confirm && pwForm.confirm !== pwForm.newPw ? '#FCA5A5' : '#D1FAE5' }}
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Re-enter new password"
                  onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = pwForm.confirm && pwForm.confirm !== pwForm.newPw ? '#FCA5A5' : '#D1FAE5'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FFFE'; }}
                />
                {pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                  <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 4 }}>Passwords do not match</div>
                )}
              </Field>
              <button type="submit" className="u-btn u-btn-green">🔐 Update Password</button>
            </form>
          </Section>

          {/* Notifications */}
          <Section title="Notification Preferences" icon="🔔">
            <Toggle
              label="New Form Assigned"
              sub="Get notified when Admin assigns a new form"
              checked={notifs.newForm !== false}
              onChange={() => toggleNotif('newForm')}
            />
            <Toggle
              label="Submission Reviewed"
              sub="Get notified when Admin reviews your submission"
              checked={notifs.reviewed !== false}
              onChange={() => toggleNotif('reviewed')}
            />
            <Toggle
              label="Deadline Reminders"
              sub="Reminders 24 hours before form due date"
              checked={!!notifs.deadline}
              onChange={() => toggleNotif('deadline')}
            />
            <Toggle
              label="System Announcements"
              sub="Important updates from WorkflowOS"
              checked={notifs.system !== false}
              onChange={() => toggleNotif('system')}
            />
          </Section>

          {/* Danger zone */}
          <Section title="Account" icon="⚠️">
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Clearing your local data will remove all locally stored submissions and assigned templates from this device. This does not affect data saved on the server.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="u-btn u-btn-outline"
                onClick={() => {
                  const email = user.email || '';
                  localStorage.removeItem(`wf_assigned_${email}`);
                  showToast('✅ Local assignment data cleared.');
                }}
              >
                🗑 Clear Local Assignments
              </button>
              <button
                className="u-btn"
                style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}
                onClick={() => {
                  if (window.confirm('This will remove ALL your locally stored submissions from this browser. Continue?')) {
                    const all = JSON.parse(localStorage.getItem('wf_local_submissions') || '[]');
                    const email = (user.email || '').toLowerCase();
                    const filtered = all.filter(s => (s._meta?.userEmail || '').toLowerCase() !== email);
                    localStorage.setItem('wf_local_submissions', JSON.stringify(filtered));
                    showToast('🗑 Local submissions cleared.');
                  }
                }}
              >
                🗑 Clear My Submissions
              </button>
            </div>
          </Section>
        </div>
      </div>

    </UserLayout>
  );
}
