import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './user.css';

const NAV_MAIN = [
  {
    label: 'Dashboard',
    path: '/user/dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
      </svg>
    ),
  },
  {
    label: 'My Tasks',
    path: '/user/tasks',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    label: 'My Timetable',
    path: '/user/timetable',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    label: 'My Submissions',
    path: '/user/submissions',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    label: 'My Progress',
    path: '/user/progress',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
      </svg>
    ),
  },
];

const NAV_ACCOUNT = [
  {
    label: 'Settings',
    path: '/user/settings',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
      </svg>
    ),
  },
];

export default function UserLayout({ children }) {
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  })();

  const initials = user.initials || (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
    navigate('/user/login');
  };

  const NOTIFICATIONS = [
    { id: 1, title: 'Form Assigned', desc: 'Admin assigned "New Timetable" to you.', time: 'Just now', unread: true },
    { id: 2, title: 'Submission Reviewed', desc: 'Admin reviewed your submission.', time: '3 hours ago', unread: true },
    { id: 3, title: 'Task Deadline', desc: 'Task "Update UI" is due tomorrow.', time: '1 day ago', unread: false },
  ];

  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <div className="u-layout">
      {/* Sidebar */}
      <aside className="u-sidebar">
        <div className="u-sidebar-brand">
          <div className="u-sidebar-brand-icon">
            <svg viewBox="0 0 20 20">
              <rect x="2" y="2" width="7" height="7" rx="1"/>
              <rect x="11" y="2" width="7" height="7" rx="1"/>
              <rect x="2" y="11" width="7" height="7" rx="1"/>
              <rect x="11" y="11" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div className="u-sidebar-brand-text">
            <h2>WorkflowOS</h2>
            <span>User Portal</span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <div className="u-nav-label">My Workspace</div>
          {NAV_MAIN.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) => `u-nav-item${isActive ? ' active' : ''}`}
            >
              {n.icon}
              {n.label}
            </NavLink>
          ))}
          <div className="u-nav-label">Account</div>
          {NAV_ACCOUNT.map(n => (
            <NavLink
              key={n.path}
              to={n.path}
              className={({ isActive }) => `u-nav-item${isActive ? ' active' : ''}`}
            >
              {n.icon}
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="u-sidebar-footer">
          {/* User info */}
          <div className="u-sidebar-user">
            <div className="u-sidebar-av">{initials}</div>
            <div>
              <div className="u-sidebar-user-name">{user.name || 'User'}</div>
              <div className="u-sidebar-user-role">{user.role || 'USER'}</div>
            </div>
          </div>
          <button className="u-nav-item" onClick={handleLogout}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="u-main">
        {/* Topbar */}
        <header className="u-topbar" style={{ position: 'relative' }}>
          <span className="u-topbar-title">WorkflowOS — User Portal</span>
          <div className="u-topbar-right">
            
            {/* Notification Bell */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => setShowNotif(!showNotif)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#475569', position: 'relative' }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#EF4444', borderRadius: '50%', border: '2px solid #fff' }} />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotif && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowNotif(false)} />
                  <div style={{ position: 'absolute', top: 40, right: 0, width: 320, background: '#fff', border: '1px solid #D1FAE5', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #D1FAE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDF4' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>Notifications ({unreadCount})</span>
                      <button style={{ background: 'none', border: 'none', color: '#16A34A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {NOTIFICATIONS.map(n => (
                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F0FDF4', background: n.unread ? '#F8FFFE' : '#fff', display: 'flex', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.unread ? '#22C55E' : 'transparent', marginTop: 6, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>{n.desc}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{n.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="u-topbar-chip" style={{ cursor: 'pointer' }} onClick={() => navigate('/user/settings')}>
              <div style={{ textAlign: 'right', marginRight: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{user.name || 'User'}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{user.email || ''}</div>
              </div>
              <div className="u-topbar-av">{initials}</div>
            </div>
          </div>
        </header>

        <div className="u-content">{children}</div>
      </div>
    </div>
  );
}
