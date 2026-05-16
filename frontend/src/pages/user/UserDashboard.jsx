import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import './user.css';

export default function UserDashboard() {
  const navigate = useNavigate();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  })();

  const [stats, setStats]       = useState({ assigned: 0, submitted: 0, reviewed: 0, pending: 0 });
  const [recent, setRecent]     = useState([]);
  const [templates, setTemplates] = useState([]);
  const [timeStr, setTimeStr]   = useState('');

  useEffect(() => {
    // Live clock greeting
    const tick = () => {
      const h = new Date().getHours();
      setTimeStr(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
    };
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const email = (user.email || '').toLowerCase();

    // Assigned templates
    const assigned = JSON.parse(localStorage.getItem(`wf_assigned_${email}`) || '[]');
    setTemplates(assigned);

    // Local submissions by this user
    const allSubs = JSON.parse(localStorage.getItem('wf_local_submissions') || '[]');
    const mine = allSubs.filter(s =>
      (s._meta?.userEmail || '').toLowerCase() === email
    );

    const submitted = mine.length;
    const reviewed  = mine.filter(s => s.status === 'Reviewed').length;
    const pending   = mine.filter(s => s.status === 'Pending').length;

    setStats({ assigned: assigned.length, submitted, reviewed, pending });

    // Recent 4 submissions
    const sorted = [...mine].sort((a, b) =>
      new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
    );
    setRecent(sorted.slice(0, 4).map(s => ({
      id:          s.submissionId || s._id,
      template:    s._meta?.templateName || 'Timetable',
      submittedAt: s._meta?.submittedAt || new Date(s.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      status:      s.status || 'Pending',
    })));
  }, []);

  const STATUS_COLOR = {
    Pending:  { bg: '#FEF3C7', color: '#92400E' },
    Reviewed: { bg: '#DCFCE7', color: '#15803D' },
    Rejected: { bg: '#FEE2E2', color: '#B91C1C' },
  };

  const KPI = [
    { label: 'Forms Assigned',  value: stats.assigned,  icon: '📋', bg: '#EFF6FF', iconBg: '#DBEAFE', color: '#1D4ED8' },
    { label: 'Submitted',       value: stats.submitted, icon: '📤', bg: '#F0FDF4', iconBg: '#DCFCE7', color: '#15803D' },
    { label: 'Reviewed',        value: stats.reviewed,  icon: '✅', bg: '#F0FDF4', iconBg: '#BBF7D0', color: '#15803D' },
    { label: 'Pending Review',  value: stats.pending,   icon: '⏳', bg: '#FFFBEB', iconBg: '#FEF3C7', color: '#92400E' },
  ];

  const QUICK = [
    { label: 'Fill My Timetable', icon: '📋', path: '/user/timetable', color: '#15803D', bg: 'linear-gradient(135deg,#16A34A,#22C55E)' },
    { label: 'My Submissions',    icon: '📄', path: '/user/submissions', color: '#1D4ED8', bg: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' },
    { label: 'My Progress',       icon: '📊', path: '/user/progress',   color: '#7C3AED', bg: 'linear-gradient(135deg,#7C3AED,#8B5CF6)' },
    { label: 'Settings',          icon: '⚙️', path: '/user/settings',   color: '#475569', bg: 'linear-gradient(135deg,#475569,#64748B)' },
  ];

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <UserLayout>

      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F4C35 0%, #15803D 50%, #22C55E 100%)',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.06)', top:-60, right:80 }} />
        <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.08)', bottom:-50, right:20 }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>{timeStr} 👋</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            {user.name || 'User'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{today}</div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative' }}>
          {templates.filter(t => t.status !== 'submitted').length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 18px', backdropFilter: 'blur(6px)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>PENDING FORMS</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                {templates.filter(t => t.status !== 'submitted').length}
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/user/timetable')}
            style={{ background: '#fff', color: '#15803D', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', alignSelf: 'center', transition: 'all 0.15s' }}
            onMouseOver={e => e.target.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
          >
            📋 Open Timetable →
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {KPI.map(k => (
          <div key={k.label} style={{ background: k.bg, border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ width: 36, height: 36, background: k.iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 12 }}>
              {k.icon}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Quick Actions */}
        <div className="u-card" style={{ marginBottom: 0 }}>
          <div className="u-card-header">
            <div className="u-card-title">⚡ Quick Actions</div>
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {QUICK.map(q => (
              <button
                key={q.label}
                onClick={() => navigate(q.path)}
                style={{
                  background: q.bg,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '16px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{q.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{q.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="u-card" style={{ marginBottom: 0 }}>
          <div className="u-card-header">
            <div className="u-card-title">🕐 Recent Submissions</div>
            <button
              onClick={() => navigate('/user/submissions')}
              style={{ fontSize: 12, color: '#15803D', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="u-empty" style={{ padding: '32px 20px' }}>
              <div className="u-empty-icon">📭</div>
              <div className="u-empty-title">No submissions yet</div>
              <div className="u-empty-sub">Submit your first timetable to see it here.</div>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {recent.map((r, i) => {
                const sc = STATUS_COLOR[r.status] || STATUS_COLOR.Pending;
                return (
                  <div key={r.id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < recent.length - 1 ? '1px solid #F0FDF4' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.template}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{r.submittedAt}</div>
                    </div>
                    <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Assigned Templates Status ────────────────────────────────────── */}
      {templates.length > 0 && (
        <div className="u-card" style={{ marginTop: 20 }}>
          <div className="u-card-header">
            <div className="u-card-title">📋 My Assigned Forms</div>
            <button
              onClick={() => navigate('/user/timetable')}
              style={{ fontSize: 12, color: '#15803D', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Go Fill →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 14, padding: 20 }}>
            {templates.map((t, i) => {
              const done = t.status === 'submitted';
              return (
                <div
                  key={t.templateId || i}
                  onClick={() => navigate('/user/timetable')}
                  style={{
                    background: done ? '#F0FDF4' : '#FFFBEB',
                    border: `1.5px solid ${done ? '#86EFAC' : '#FDE68A'}`,
                    borderRadius: 12,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.07)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{done ? '✅' : '📝'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: done ? '#15803D' : '#92400E', fontWeight: 600 }}>
                    {done ? 'Submitted ✓' : 'Not submitted yet'}
                  </div>
                  {t.priority && (
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Priority: {t.priority}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </UserLayout>
  );
}
