import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from './WorkflowLayout';
import { taskAPI } from '../../services/api';
import './workflow.css';

const stats = [
  { label: 'TOTAL TASKS', value: '1,284', change: '+12%', changePos: true, iconBg: '#EFF6FF', iconColor: '#2563EB', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg> },
  { label: 'PENDING TASKS', value: '142', change: '- Stable', changePos: null, iconBg: '#FEF3C7', iconColor: '#D97706', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg> },
  { label: 'IN PROGRESS', value: '86', change: '+4.2%', changePos: true, iconBg: '#ECFDF5', iconColor: '#059669', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg> },
  { label: 'COMPLETED', value: '1,056', change: '+18%', changePos: true, iconBg: '#F0FDF4', iconColor: '#16A34A', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
];

const barData = [
  { label: 'Marketing', height: 55, color: '#BFDBFE' },
  { label: 'Engineering', height: 100, color: '#3B82F6' },
  { label: 'Sales', height: 40, color: '#93C5FD' },
  { label: 'HR', height: 75, color: '#60A5FA' },
  { label: 'Finance', height: 50, color: '#BFDBFE' },
];

const activities = [
  { icon: '✓', bg: '#DCFCE7', color: '#15803D', user: 'John Doe', action: 'moved', target: 'Q4 Marketing Campaign', suffix: 'to Completed', time: '2 minutes ago' },
  { icon: '+', bg: '#DBEAFE', color: '#1D4ED8', user: 'New task', action: 'UI Redesign Audit', target: 'created by', suffix: 'Sarah Jenkins', time: '45 minutes ago' },
  { icon: '💬', bg: '#F3E8FF', color: '#7C3AED', user: 'Michael Chen', action: 'added a comment on', target: 'API Integration Docs', suffix: '', time: '2 hours ago' },
  { icon: '↑', bg: '#FEF3C7', color: '#D97706', user: 'Priority increased for', action: 'Server Migration', target: 'by Admin', suffix: '', time: '5 hours ago' },
  { icon: '👋', bg: '#F0FDF4', color: '#16A34A', user: 'David Wilson', action: 'joined the', target: 'Sales Engineering team', suffix: '', time: 'Yesterday' },
];

export default function WorkflowSystemOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'TOTAL TASKS', value: '1,284', change: '+12%', changePos: true, iconBg: '#EFF6FF', iconColor: '#2563EB', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg> },
    { label: 'PENDING TASKS', value: '142', change: '- Stable', changePos: null, iconBg: '#FEF3C7', iconColor: '#D97706', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg> },
    { label: 'IN PROGRESS', value: '86', change: '+4.2%', changePos: true, iconBg: '#ECFDF5', iconColor: '#059669', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg> },
    { label: 'COMPLETED', value: '1,056', change: '+18%', changePos: true, iconBg: '#F0FDF4', iconColor: '#16A34A', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await taskAPI.getAllTasks();
        // Update stats based on real data if needed
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await taskAPI.getAllTasks();
      // Simulate refresh
      setTimeout(() => setLoading(false), 500);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <WorkflowLayout>
      <div className="wf-page-header">
        <div>
          <div className="wf-page-title">System Overview</div>
          <div className="wf-page-sub">Real-time performance tracking and operational health dashboard.</div>
        </div>
        <div className="wf-header-actions">
          <button className="btn btn-outline">Export Report</button>
          <button className="btn btn-blue" onClick={handleRefresh} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Data'}</button>
        </div>
      </div>

      {/* Stats */}
      <div className="wf-stats-grid">
        {stats.map(s => (
          <div key={s.label} className="wf-stat-card">
            <div className="wf-stat-top">
              <div className="wf-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
              <span className="wf-stat-badge" style={{
                background: s.changePos === true ? '#DCFCE7' : s.changePos === false ? '#FEE2E2' : '#F1F5F9',
                color: s.changePos === true ? '#15803D' : s.changePos === false ? '#B91C1C' : '#475569'
              }}>
                {s.change}
              </span>
            </div>
            <div className="wf-stat-label">{s.label}</div>
            <div className="wf-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        {/* Bar Chart */}
        <div className="wf-card">
          <div className="wf-flex-between mb-16">
            <div>
              <div className="wf-section-title" style={{marginBottom:2}}>Tasks by Category</div>
              <div className="wf-text-muted">Distribution across departments</div>
            </div>
            <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '4px 10px', borderRadius: 5, fontWeight: 500 }}>Last 30 Days</span>
          </div>
          <div className="wf-bar-chart">
            {barData.map(b => (
              <div key={b.label} className="wf-bar-col">
                <div className="wf-bar" style={{ height: b.height, background: b.color }} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div className="wf-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="wf-section-title" style={{ alignSelf: 'flex-start', marginBottom: 20 }}>Task Status</div>
          <div className="wf-donut">
            <div className="wf-donut-label">
              <span>1,284</span>
              <span>TOTAL</span>
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start', width: '100%' }}>
            {[['#10B981', 'Completed (75%)'], ['#F59E0B', 'Pending (15%)'], ['#8B5CF6', 'In Progress (10%)']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="wf-card">
        <div className="wf-flex-between mb-16">
          <div className="wf-section-title" style={{marginBottom:0}}>Recent Activity</div>
          <button className="wf-link">View All Updates</button>
        </div>
        {activities.map((a, i) => (
          <div key={i} className="wf-activity-item">
            <div className="wf-activity-dot" style={{ background: a.bg, color: a.color, fontWeight: 700, fontSize: 12 }}>
              {a.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#334155' }}>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{a.user}</span>{' '}
                {a.action}{' '}
                <span style={{ color: '#2563EB', fontWeight: 500 }}>{a.target}</span>{' '}
                {a.suffix}
              </div>
              <div className="wf-activity-meta">{a.time}</div>
            </div>
            <button className="btn btn-ghost btn-sm">⋯</button>
          </div>
        ))}
      </div>
    </WorkflowLayout>
  );
}
