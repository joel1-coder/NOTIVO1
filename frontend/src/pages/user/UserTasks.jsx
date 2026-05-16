import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import { taskAPI } from '../../services/api';
import './user.css';

export default function UserTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  })();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const unifiedTasks = [];
      const userEmail = (user.email || '').toLowerCase();

      // 1. ── Load Assigned Timetables (Forms) ──
      const assignedFormsRaw = JSON.parse(localStorage.getItem(`wf_assigned_${userEmail}`) || '[]');
      assignedFormsRaw.forEach(form => {
        unifiedTasks.push({
          id: form.templateId || Math.random().toString(),
          type: 'Form',
          title: form.name || 'Assigned Form',
          desc: form.description || 'Please fill out this assigned timetable/form.',
          assignedBy: form.assignedBy || 'System Admin',
          priority: form.priority || 'Medium',
          status: form.status === 'submitted' ? 'Completed' : 'Pending',
          dueDate: form.dueDate || '',
          rawItem: form
        });
      });

      // 2. ── Load Regular Tasks (Local) ──
      const localTasksRaw = JSON.parse(localStorage.getItem('wf_local_tasks') || '[]');
      const myLocalTasks = localTasksRaw.filter(t => {
        if (!t.assignedTo) return false;
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        return assignees.some(a => (a.email || '').toLowerCase() === userEmail || (typeof a === 'string' && a.toLowerCase() === userEmail));
      });

      // 3. ── Load Regular Tasks (API) ──
      let myApiTasks = [];
      try {
        const res = await taskAPI.getAllTasks();
        myApiTasks = (res.data || []).filter(t => {
           if (!t.assignedTo) return false;
           const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
           return assignees.some(a => (a.email || '').toLowerCase() === userEmail || (typeof a === 'string' && a.toLowerCase() === userEmail));
        });
      } catch (err) {
        console.warn('API fetch failed, using local tasks only');
      }

      // Merge local and API tasks
      const taskIds = new Set();
      const mergedTasks = [];
      
      [...myLocalTasks, ...myApiTasks].forEach(t => {
        const id = t._id || t.id;
        if (!taskIds.has(id)) {
          taskIds.add(id);
          mergedTasks.push({
            id: id,
            type: 'Task',
            title: t.title || 'Untitled Task',
            desc: t.desc || t.description || 'No description provided.',
            assignedBy: t.assignedBy || 'System Admin',
            priority: t.priority || 'Normal',
            status: t.status || 'Pending',
            dueDate: t.dueDate || '',
            rawItem: t
          });
        }
      });

      // Add them all together
      unifiedTasks.push(...mergedTasks);

      // 4. ── Fallback Demo Data if Completely Empty ──
      if (unifiedTasks.length === 0) {
        unifiedTasks.push(
          {
            id: 'T-DEMO-1',
            type: 'Task',
            title: 'Update HR Documentation',
            desc: 'Review and update the employee handbook for 2026. Make sure to check the new policy changes.',
            assignedBy: 'Alex Sterling (Admin)',
            priority: 'High',
            status: 'Pending',
            dueDate: new Date(Date.now() + 86400000).toISOString()
          },
          {
            id: 'T-DEMO-2',
            type: 'Form',
            title: 'Weekly Status Report',
            desc: 'Please fill out this assigned timetable/form to report your weekly progress.',
            assignedBy: 'Alex Sterling (Admin)',
            priority: 'Medium',
            status: 'Pending',
            dueDate: new Date(Date.now() + 172800000).toISOString()
          }
        );
      }

      setTasks(unifiedTasks);
      setLoading(false);
    };

    load();
  }, []);

  const PRIORITY_CLASS = {
    High:   'u-badge u-badge-high',
    Medium: 'u-badge u-badge-medium',
    Low:    'u-badge u-badge-low',
    Normal: 'u-badge u-badge-low',
  };

  const STATUS_CLASS = {
    Pending:     'u-badge u-badge-pending',
    'In Progress': 'u-badge u-badge-medium',
    Completed:   'u-badge u-badge-done',
  };

  const TYPE_ICON = {
    'Form': '📋',
    'Task': '📌'
  };

  return (
    <UserLayout>
      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {selected && (
        <div className="u-modal-overlay" onClick={() => setSelected(null)}>
          <div className="u-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="u-modal-title">
                {TYPE_ICON[selected.type]} {selected.type === 'Form' ? 'Assigned Form Details' : 'Task Details'}
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ background: '#F0FDF4', borderRadius: 9, padding: 14, marginBottom: 18, border: '1px solid #D1FAE5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Assigned By</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1D4ED8', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {selected.assignedBy.charAt(0).toUpperCase()}
                    </div>
                    {selected.assignedBy}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Due Date</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                    {selected.dueDate ? new Date(selected.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No strict deadline'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Priority</div>
                  <span className={PRIORITY_CLASS[selected.priority] || 'u-badge u-badge-low'}>{selected.priority || 'Normal'}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
                  <span className={STATUS_CLASS[selected.status] || 'u-badge u-badge-pending'}>{selected.status || 'Pending'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20, padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{selected.title}</div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                {selected.desc}
              </div>
            </div>

            {/* Actions based on type */}
            {selected.status !== 'Completed' && (
               <div style={{ background: '#FFFBEB', padding: 14, borderRadius: 8, border: '1px solid #FDE68A', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>Action Required</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                     {selected.type === 'Form' ? (
                        <button className="u-btn u-btn-green" onClick={() => navigate('/user/timetable')}>
                           📝 Go Fill Timetable / Form
                        </button>
                     ) : (
                        <>
                           <button className="u-btn u-btn-outline u-btn-sm" onClick={() => setSelected(null)}>Mark In Progress</button>
                           <button className="u-btn u-btn-green u-btn-sm" onClick={() => setSelected(null)}>Mark Completed</button>
                        </>
                     )}
                  </div>
               </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="u-btn u-btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="u-page-header">
        <div>
          <div className="u-page-title">📋 My Tasks & Forms</div>
          <div className="u-page-sub">All work items and timetables assigned to you by the Admin.</div>
        </div>
        <span className="u-badge u-badge-pending" style={{ fontSize: 13 }}>{tasks.filter(t => t.status !== 'Completed').length} Active Work Items</span>
      </div>

      {loading ? (
        <div className="u-card" style={{ textAlign: 'center', padding: 60 }}>
          <div className="u-empty-icon">⏳</div>
          <div className="u-empty-title">Loading your work items…</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="u-card">
          <div className="u-empty">
            <div className="u-empty-icon">🎉</div>
            <div className="u-empty-title">You're all caught up!</div>
            <div className="u-empty-sub">You have no tasks or forms assigned to you right now.</div>
          </div>
        </div>
      ) : (
        <div className="u-card">
          <div className="u-table-wrap">
            <table className="u-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th style={{ width: '35%' }}>Work Title & Description</th>
                  <th>Assigned By</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={t.id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{TYPE_ICON[t.type]}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{t.type}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {t.desc}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#E2E8F0', color: '#475569', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {t.assignedBy.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{t.assignedBy}</span>
                      </div>
                    </td>
                    <td><span className={PRIORITY_CLASS[t.priority] || 'u-badge u-badge-low'}>{t.priority || 'Normal'}</span></td>
                    <td><span className={STATUS_CLASS[t.status] || 'u-badge u-badge-pending'}>{t.status || 'Pending'}</span></td>
                    <td>
                      {t.type === 'Form' && t.status !== 'Completed' ? (
                        <button className="u-btn u-btn-green u-btn-sm" onClick={() => navigate('/user/timetable')}>📝 Fill Form</button>
                      ) : (
                        <button className="u-btn u-btn-outline u-btn-sm" onClick={() => setSelected(t)}>👁 View</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
