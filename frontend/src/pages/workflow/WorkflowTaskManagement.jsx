import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from './WorkflowLayout';
import { taskAPI } from '../../services/api';
import './workflow.css';

const STATUS_BADGE = {
  'IN PROGRESS': 'badge badge-blue',
  'COMPLETED': 'badge badge-green',
  'PENDING': 'badge badge-yellow',
};

const MOCK_TASKS = [
  { id: 'TASK-1024', title: 'Update Infrastructure API', user: 'Alex Rivera', initials: 'AR', userBg: '#DBEAFE', category: 'Development', status: 'IN PROGRESS', date: 'Oct 24, 2023' },
  { id: 'TASK-1025', title: 'Design System Documentation', user: 'Sarah Chen', initials: 'SC', userBg: '#F3E8FF', category: 'Design', status: 'COMPLETED', date: 'Oct 20, 2023' },
  { id: 'TASK-1026', title: 'Q4 Market Research', user: 'Michael Scott', initials: 'MS', userBg: '#FEF3C7', category: 'Marketing', status: 'PENDING', date: 'Oct 30, 2023' },
  { id: 'TASK-1027', title: 'Client Feedback Review', user: 'Elena Rodriguez', initials: 'ER', userBg: '#F0FDF4', category: 'Sales', status: 'IN PROGRESS', date: 'Oct 28, 2023' },
];

export default function WorkflowTaskManagement() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const data = await taskAPI.getAllTasks();
        setTasks(data.data || MOCK_TASKS);
      } catch (err) {
        console.error('Error loading tasks:', err);
        // Fallback to mock data
        setTasks(MOCK_TASKS);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.user.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchCat = categoryFilter === 'All' || t.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <WorkflowLayout>
      <div className="wf-page-header">
        <div>
          <div className="wf-page-title">Task Management</div>
          <div className="wf-page-sub">Monitor and manage all enterprise-wide activities from one central hub.</div>
        </div>
        <div className="wf-header-actions">
          <button className="btn btn-outline">↓ Export</button>
          <button className="btn btn-blue">⚡ Bulk Actions</button>
        </div>
      </div>

      {/* Mini stats */}
      <div className="wf-grid-4 mb-24">
        {[
          { label: 'Total Tasks', value: '1,284', icon: '📋', bg: '#EFF6FF' },
          { label: 'Pending', value: '432', icon: '⏳', bg: '#FEF3C7' },
          { label: 'Completed', value: '712', icon: '✅', bg: '#F0FDF4' },
          { label: 'Overdue', value: '140', icon: '⏱️', bg: '#FEF2F2' },
        ].map(s => (
          <div key={s.label} className="wf-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="wf-card p-0" style={{ marginBottom: 24, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="wf-toolbar">
          <div className="wf-search-box" style={{ width: 240 }}>
            <svg width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Filter by title..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
            Status:
            <select className="wf-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option><option>IN PROGRESS</option><option>COMPLETED</option><option>PENDING</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
            Category:
            <select className="wf-filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option>All</option><option>Development</option><option>Design</option><option>Marketing</option><option>Sales</option>
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>≡ Advanced Filters</button>
        </div>

        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned User</th>
                <th>Category</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>Loading tasks...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>No tasks match your filters.</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>ID: {t.id}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.userBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#374151' }}>{t.initials}</div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{t.user}</span>
                      </div>
                    </td>
                    <td><span style={{ background: '#F1F5F9', padding: '3px 9px', borderRadius: 5, fontSize: 12, fontWeight: 500 }}>{t.category}</span></td>
                    <td><span className={STATUS_BADGE[t.status]}>{t.status}</span></td>
                    <td style={{ fontSize: 13, color: '#475569' }}>{t.date}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/task-detail')} title="View">👁</button>
                      <button className="btn btn-ghost btn-sm" title="Edit">✎</button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        title="Share QR"
                        onClick={() => {
                          const publicUrl = `${window.location.origin}/public/view/${t.id}`;
                          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;
                          window.open(qrUrl, '_blank', 'width=400,height=400');
                        }}
                      >
                        📱
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>Showing 1 to 10 of 256 entries</span>
          <div className="wf-pagination">
            <button className="wf-page-btn">&lt;</button>
            {[1,2,3,'…',26].map((p, i) => (
              <button key={i} className={`wf-page-btn ${p === page ? 'active' : ''}`} onClick={() => typeof p === 'number' && setPage(p)}>{p}</button>
            ))}
            <button className="wf-page-btn">&gt;</button>
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="wf-grid-2">
        <div className="wf-card" style={{ display: 'flex', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📈</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Performance Insights</div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 10 }}>View detailed analytics on team productivity and task completion rates over the last 30 days.</div>
            <button className="wf-link">Analyze trends →</button>
          </div>
        </div>
        <div className="wf-card" style={{ display: 'flex', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🔌</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Integration Hub</div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 10 }}>Connect your task management workflow with external tools like Slack, Jira, and GitHub.</div>
            <button className="wf-link">Manage apps →</button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/create-task')} style={{ position: 'fixed', bottom: 32, right: 32, width: 52, height: 52, borderRadius: '50%', background: '#2563EB', color: 'white', border: 'none', fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </WorkflowLayout>
  );
}
