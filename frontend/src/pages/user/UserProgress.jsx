import React, { useState, useEffect } from 'react';
import UserLayout from './UserLayout';
import './user.css';

export default function UserProgress() {
  const [items, setItems] = useState([]);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  })();

  useEffect(() => {
    const email    = currentUser.email || '';
    const assigned = JSON.parse(localStorage.getItem(`wf_assigned_${email}`) || '[]');
    const local    = JSON.parse(localStorage.getItem('wf_local_submissions') || '[]');

    const rows = assigned.map(tpl => {
      const submitted = local.find(s =>
        (s._meta?.templateName === tpl.name || s.template === tpl.templateId) &&
        (s._meta?.userEmail || '').toLowerCase() === email.toLowerCase()
      );
      const isSubmitted = !!submitted || tpl.status === 'submitted';
      return {
        id:          tpl.templateId,
        name:        tpl.name,
        priority:    tpl.priority || 'Medium',
        assignedAt:  tpl.assignedAt ? new Date(tpl.assignedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—',
        status:      isSubmitted ? 'SUBMITTED' : 'PENDING',
        percent:     isSubmitted ? 100 : 0,
        adminStatus: submitted?.status || (isSubmitted ? 'Pending' : '—'),
      };
    });

    setItems(rows.length > 0 ? rows : MOCK_ROWS);
  }, []);

  const MOCK_ROWS = [
    { id: 'TB-001', name: 'Enterprise Migration Phase 1', priority: 'High',   assignedAt: 'Oct 24, 2023', status: 'SUBMITTED', percent: 100, adminStatus: 'Reviewed' },
    { id: 'TB-002', name: 'Q4 Marketing Campaign',        priority: 'Medium', assignedAt: 'Oct 28, 2023', status: 'PENDING',   percent: 0,   adminStatus: '—'        },
  ];

  const submitted  = items.filter(i => i.status === 'SUBMITTED').length;
  const pending    = items.filter(i => i.status === 'PENDING').length;
  const avgPercent = items.length ? Math.round(items.reduce((s, i) => s + i.percent, 0) / items.length) : 0;

  const PRIORITY_CLR = { High: 'u-badge-high', Medium: 'u-badge-medium', Low: 'u-badge-low' };
  const ADMIN_CLR    = { Reviewed: '#15803D', Rejected: '#B91C1C', Pending: '#B45309' };

  return (
    <UserLayout>
      <div className="u-page-header">
        <div>
          <div className="u-page-title">📊 My Progress</div>
          <div className="u-page-sub">Track submission status of all your assigned timetables.</div>
        </div>
      </div>

      {/* Stats */}
      <div className="u-stats-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { icon: '📋', label: 'Assigned',   val: items.length,  color: '#1D4ED8', bg: '#EFF6FF' },
          { icon: '✅', label: 'Submitted',  val: submitted,     color: '#15803D', bg: '#DCFCE7' },
          { icon: '⏳', label: 'Pending',    val: pending,       color: '#B45309', bg: '#FEF3C7' },
          { icon: '📈', label: 'Completion', val: `${avgPercent}%`, color: '#7C3AED', bg: '#EDE9FE' },
        ].map(({ icon, label, val, color, bg }) => (
          <div className="u-stat-card" key={label}>
            <div className="u-stat-icon" style={{ background: bg }}>{icon}</div>
            <div className="u-stat-label">{label}</div>
            <div className="u-stat-value" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Overall bar */}
      <div className="u-card" style={{ marginBottom: 20, padding: '18px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Overall Submission Rate</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#15803D' }}>{avgPercent}%</div>
        </div>
        <div style={{ height: 10, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${avgPercent}%`, background: 'linear-gradient(90deg,#16A34A,#22C55E)', borderRadius: 6, transition: 'width 1s ease' }} />
        </div>
      </div>

      {/* Per-template rows */}
      <div className="u-card">
        <div className="u-card-header">
          <div className="u-card-title">Timetable Breakdown</div>
          <span style={{ fontSize: 12, color: '#64748B' }}>{items.length} assigned</span>
        </div>

        {items.length === 0 ? (
          <div className="u-empty" style={{ padding: 40 }}>
            <div className="u-empty-icon">📭</div>
            <div className="u-empty-title">No assignments yet</div>
          </div>
        ) : (
          <div style={{ padding: '0 20px' }}>
            {items.map((item, i) => (
              <div className="u-progress-row" key={item.id}>
                {/* Index bubble */}
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: item.status === 'SUBMITTED' ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: item.status === 'SUBMITTED' ? '#15803D' : '#B45309', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Info */}
                <div className="u-progress-info">
                  <div className="u-progress-task">{item.name}</div>
                  <div className="u-progress-meta" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    <span className={`u-badge ${PRIORITY_CLR[item.priority] || 'u-badge-medium'}`}>{item.priority}</span>
                    <span>Assigned: {item.assignedAt}</span>
                    {item.adminStatus !== '—' && (
                      <span style={{ color: ADMIN_CLR[item.adminStatus] || '#94A3B8', fontWeight: 600 }}>
                        Admin: {item.adminStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ flex: '0 0 180px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 5 }}>
                    <span>Completion</span>
                    <span style={{ fontWeight: 700, color: item.percent === 100 ? '#15803D' : '#B45309' }}>{item.percent}%</span>
                  </div>
                  <div className="u-progress-bar-wrap">
                    <div className="u-progress-bar" style={{ width: `${item.percent}%`, background: item.percent === 100 ? 'linear-gradient(90deg,#15803D,#22C55E)' : 'linear-gradient(90deg,#F59E0B,#FCD34D)' }} />
                  </div>
                </div>

                {/* Status */}
                <div style={{ flexShrink: 0 }}>
                  <span className={`u-badge ${item.status === 'SUBMITTED' ? 'u-badge-done' : 'u-badge-pending'}`}>
                    {item.status === 'SUBMITTED' ? '✓ Submitted' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
