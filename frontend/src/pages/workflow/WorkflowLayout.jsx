import React, { useState } from 'react';

import { NavLink, useNavigate } from 'react-router-dom';
import './workflow.css';

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 1116 0A8 8 0 012 10zm9-4a1 1 0 00-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/></svg> },
  { label: 'Create Task', path: '/create-task', icon: <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg> },
  { label: 'Manage Tasks', path: '/tasks', icon: <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg> },
  { label: 'Form Builder', path: '/form-builder', icon: <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg> },
  { label: 'Saved Templates', path: '/saved-templates', icon: <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg> },
  { label: 'Submissions', path: '/responses', icon: <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg> },
  { label: 'Users', path: '/users', icon: <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg> },
];

export default function WorkflowLayout({ children, active }) {
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);

  const NOTIFICATIONS = [
    { id: 1, title: 'New Submission', desc: 'Jordan Smith submitted "New Timetable".', time: '10 mins ago', unread: true },
    { id: 2, title: 'Task Completed', desc: 'Amara Miller completed "System Upgrade".', time: '2 hours ago', unread: true },
    { id: 3, title: 'Database Alert', desc: 'MongoDB connection lost.', time: '1 day ago', unread: false },
  ];

  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <div className="wf-layout">
      {/* Sidebar */}
      <aside className="wf-sidebar">
        <div className="wf-sidebar-brand">
          <div className="wf-sidebar-brand-icon">
            <svg viewBox="0 0 20 20"><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/></svg>
          </div>
          <div className="wf-sidebar-brand-text">
            <h2>WorkflowOS</h2>
            <span>Enterprise Admin</span>
          </div>
        </div>

        <nav className="wf-nav">
          {NAV.map(n => (
            <NavLink key={n.path} to={n.path} className={({ isActive }) => `wf-nav-item${isActive ? ' active' : ''}`}>
              {n.icon}
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="wf-sidebar-footer">
          <button className="wf-nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor" style={{width:16,height:16}}><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>
            Settings
          </button>
          <button className="wf-nav-item" onClick={() => navigate('/login')}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{width:16,height:16}}><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="wf-main">
        {/* Top Bar */}
        <header className="wf-topbar" style={{ position: 'relative' }}>
          <div className="wf-search-box">
            <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search tasks, users, or workflows..." />
          </div>
          <div className="wf-topbar-right">
            
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button className="wf-notif-btn" onClick={() => setShowNotif(!showNotif)}>
                <svg width="16" height="16" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, background: '#EF4444', borderRadius: '50%', border: '2px solid #fff' }} />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotif && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowNotif(false)} />
                  <div style={{ position: 'absolute', top: 40, right: 0, width: 320, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Notifications ({unreadCount})</span>
                      <button style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {NOTIFICATIONS.map(n => (
                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: n.unread ? '#EEF2FF' : '#fff', display: 'flex', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.unread ? '#4F46E5' : 'transparent', marginTop: 6, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: '#4B5563', margin: '2px 0' }}>{n.desc}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{n.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="wf-user-chip" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div className="wf-user-info">
                <div className="wf-user-info-name">Alex Sterling</div>
                <div className="wf-user-info-role">System Architect</div>
              </div>
              <div className="wf-user-avatar">AS</div>
            </div>
          </div>
        </header>

        <div className="wf-content">{children}</div>
      </div>
    </div>
  );
}
