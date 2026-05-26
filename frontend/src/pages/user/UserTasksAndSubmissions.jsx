import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import { taskAPI, submissionAPI } from '../../services/api';
import './user.css';

// ── Parse flat submission data into rows × columns ──────────────────────────
function parseFormData(data) {
  const rowMap   = {};
  const colOrder = [];
  const colSeen  = new Set();

  Object.entries(data || {}).forEach(([key, val]) => {
    let sep = ' — ';
    let si  = key.indexOf(sep);
    if (si < 0) { sep = ' – '; si = key.indexOf(sep); }
    if (si < 0) { sep = ' - '; si = key.indexOf(sep); }

    if (si > 0) {
      const prefix   = key.substring(0, si);
      const colName  = key.substring(si + sep.length);
      const rowMatch = prefix.match(/^Row (\d+)$/);
      if (rowMatch) {
        const rn = parseInt(rowMatch[1]);
        if (!colSeen.has(colName)) { colSeen.add(colName); colOrder.push(colName); }
        if (!rowMap[rn]) rowMap[rn] = { rowNum: rn };
        rowMap[rn][colName] = val;
      }
    }
  });

  const cols = colOrder;
  const rows = Object.keys(rowMap)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => rowMap[k]);
  return { cols, rows };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function UserTasksAndSubmissions() {
  const navigate = useNavigate();

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'submissions'

  // ── Tasks state ──
  const [tasks, setTasks]     = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  // ── Submissions state ──
  const [submissions, setSubmissions]   = useState([]);
  const [subsLoading, setSubsLoading]   = useState(true);
  const [selectedSub, setSelectedSub]   = useState(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  })();

  // ── Load Tasks ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setTasksLoading(true);
      const unifiedTasks = [];
      const userEmail = (user.email || '').toLowerCase();

      // 1. Assigned Timetables (Forms)
      const assignedFormsRaw = JSON.parse(localStorage.getItem(`wf_assigned_${userEmail}`) || '[]');
      assignedFormsRaw.forEach(form => {
        unifiedTasks.push({
          id:         form.templateId || Math.random().toString(),
          type:       'Form',
          title:      form.name || 'Assigned Form',
          desc:       form.description || 'Please fill out this assigned timetable/form.',
          assignedBy: form.assignedBy || 'System Admin',
          priority:   form.priority || 'Medium',
          status:     form.status === 'submitted' ? 'Completed' : 'Pending',
          dueDate:    form.dueDate || '',
          rawItem:    form,
        });
      });

      // 2. Regular Tasks (Local)
      const localTasksRaw = JSON.parse(localStorage.getItem('wf_local_tasks') || '[]');
      const myLocalTasks  = localTasksRaw.filter(t => {
        if (!t.assignedTo) return false;
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        return assignees.some(a =>
          (a.email || '').toLowerCase() === userEmail ||
          (typeof a === 'string' && a.toLowerCase() === userEmail)
        );
      });

      // 3. Regular Tasks (API)
      let myApiTasks = [];
      try {
        const res  = await taskAPI.getAllTasks();
        myApiTasks = (res.data || []).filter(t => {
          if (!t.assignedTo) return false;
          const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
          return assignees.some(a =>
            (a.email || '').toLowerCase() === userEmail ||
            (typeof a === 'string' && a.toLowerCase() === userEmail)
          );
        });
      } catch { /* silent */ }

      const taskIds    = new Set();
      const mergedTasks = [];
      [...myLocalTasks, ...myApiTasks].forEach(t => {
        const id = t._id || t.id;
        if (!taskIds.has(id)) {
          taskIds.add(id);
          mergedTasks.push({
            id, type: 'Task',
            title:      t.title || 'Untitled Task',
            desc:       t.desc || t.description || 'No description provided.',
            assignedBy: t.assignedBy || 'System Admin',
            priority:   t.priority || 'Normal',
            status:     t.status || 'Pending',
            dueDate:    t.dueDate || '',
            rawItem:    t,
          });
        }
      });
      unifiedTasks.push(...mergedTasks);

      // 4. Demo fallback
      if (unifiedTasks.length === 0) {
        unifiedTasks.push(
          {
            id: 'T-DEMO-1', type: 'Task',
            title: 'Update HR Documentation',
            desc: 'Review and update the employee handbook for 2026.',
            assignedBy: 'Alex Sterling (Admin)', priority: 'High', status: 'Pending',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            id: 'T-DEMO-2', type: 'Form',
            title: 'Weekly Status Report',
            desc: 'Please fill out this assigned timetable/form to report your weekly progress.',
            assignedBy: 'Alex Sterling (Admin)', priority: 'Medium', status: 'Pending',
            dueDate: new Date(Date.now() + 172800000).toISOString(),
          }
        );
      }

      setTasks(unifiedTasks);
      setTasksLoading(false);
    };
    load();
  }, []);

  // ── Load Submissions ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setSubsLoading(true);
      const localRaw  = JSON.parse(localStorage.getItem('wf_local_submissions') || '[]');
      const localMine = localRaw
        .filter(s => {
          const email = (s._meta?.userEmail || s.user || '').toLowerCase();
          return email === (user.email || '').toLowerCase();
        })
        .map(s => ({
          id:          s.submissionId || s._id,
          user:        s._meta?.userName   || user.name || 'You',
          template:    s._meta?.templateName || s.template || 'Timetable',
          submittedAt: s._meta?.submittedAt  || (s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'),
          status:      s.status || 'Pending',
          data:        s.data || {},
        }));

      try {
        const res  = await submissionAPI.getAllSubmissions();
        const mine = (res.data || [])
          .filter(s => {
            const u = typeof s.user === 'object' ? s.user : {};
            return (u.email || '').toLowerCase() === (user.email || '').toLowerCase() ||
                   (u.name  || '').toLowerCase().includes((user.name || '').toLowerCase().split(' ')[0]);
          })
          .map(s => ({
            id:          s._id || s.id,
            user:        typeof s.user === 'object' ? s.user?.name : s.user,
            template:    typeof s.template === 'object' ? s.template?.name : s.template,
            submittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
            status:      s.status || 'Pending',
            data:        s.data   || {},
          }));

        const localIds = new Set(localMine.map(i => i.id));
        setSubmissions([...localMine, ...mine.filter(m => !localIds.has(m.id))]);
      } catch {
        setSubmissions(localMine);
      } finally {
        setSubsLoading(false);
      }
    };
    load();
  }, []);

  // ── Badge helpers ────────────────────────────────────────────────────────────
  const PRIORITY_CLASS = {
    High:   'u-badge u-badge-high',
    Medium: 'u-badge u-badge-medium',
    Low:    'u-badge u-badge-low',
    Normal: 'u-badge u-badge-low',
  };
  const STATUS_CLASS_TASK = {
    Pending:      'u-badge u-badge-pending',
    'In Progress':'u-badge u-badge-medium',
    Completed:    'u-badge u-badge-done',
  };
  const STATUS_CLASS_SUB = {
    Pending:  'u-badge u-badge-pending',
    Reviewed: 'u-badge u-badge-done',
    Rejected: 'u-badge u-badge-high',
  };
  const TYPE_ICON = { Form: '📋', Task: '📌' };

  const activeTasks = tasks.filter(t => t.status !== 'Completed').length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <UserLayout>

      {/* ── Task Detail Modal ──────────────────────────────────────────── */}
      {selectedTask && (
        <div className="u-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="u-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="u-modal-title">
                {TYPE_ICON[selectedTask.type]} {selectedTask.type === 'Form' ? 'Assigned Form Details' : 'Task Details'}
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }} onClick={() => setSelectedTask(null)}>✕</button>
            </div>

            <div style={{ background: '#F0FDF4', borderRadius: 9, padding: 14, marginBottom: 18, border: '1px solid #D1FAE5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Assigned By</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1D4ED8', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {selectedTask.assignedBy.charAt(0).toUpperCase()}
                    </div>
                    {selectedTask.assignedBy}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Due Date</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No strict deadline'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Priority</div>
                  <span className={PRIORITY_CLASS[selectedTask.priority] || 'u-badge u-badge-low'}>{selectedTask.priority || 'Normal'}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
                  <span className={STATUS_CLASS_TASK[selectedTask.status] || 'u-badge u-badge-pending'}>{selectedTask.status || 'Pending'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20, padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{selectedTask.title}</div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{selectedTask.desc}</div>
            </div>

            {selectedTask.status !== 'Completed' && (
              <div style={{ background: '#FFFBEB', padding: 14, borderRadius: 8, border: '1px solid #FDE68A', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>Action Required</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {selectedTask.type === 'Form' ? (
                    <button className="u-btn u-btn-green" onClick={() => navigate('/user/timetable')}>
                      📝 Go Fill Timetable / Form
                    </button>
                  ) : (
                    <>
                      <button className="u-btn u-btn-outline u-btn-sm" onClick={() => setSelectedTask(null)}>Mark In Progress</button>
                      <button className="u-btn u-btn-green u-btn-sm" onClick={() => setSelectedTask(null)}>Mark Completed</button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="u-btn u-btn-outline" onClick={() => setSelectedTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submission Detail Modal ─────────────────────────────────────── */}
      {selectedSub && (() => {
        const { cols, rows } = parseFormData(selectedSub.data);
        const isStructured   = rows.length > 0;
        return (
          <div className="u-modal-overlay" onClick={() => setSelectedSub(null)}>
            <div className="u-modal" style={{ maxWidth: 740, width: '95vw' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="u-modal-title">📋 Submission Details</div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }} onClick={() => setSelectedSub(null)}>✕</button>
              </div>

              <div style={{ background: '#F0FDF4', borderRadius: 9, padding: 14, marginBottom: 18, border: '1px solid #D1FAE5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[['Template', selectedSub.template], ['Submitted', selectedSub.submittedAt]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{v}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
                    <span className={STATUS_CLASS_SUB[selectedSub.status] || 'u-badge u-badge-pending'}>{selectedSub.status}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Your Submitted Data</div>

              {isStructured ? (
                <div style={{ border: '1px solid #D1FAE5', borderRadius: 8, overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 12px', background: '#15803D', color: '#fff', fontWeight: 700, textAlign: 'center', width: 44, borderRight: '1px solid #14692f', fontSize: 12 }}>#</th>
                        {cols.map(col => (
                          <th key={col} style={{ padding: '10px 14px', background: '#15803D', color: '#fff', fontWeight: 700, borderRight: '1px solid #14692f', whiteSpace: 'nowrap', fontSize: 12 }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F0FDF4', borderBottom: '1px solid #D1FAE5' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#94A3B8', textAlign: 'center', borderRight: '1px solid #D1FAE5' }}>
                            {String(row.rowNum).padStart(2, '0')}
                          </td>
                          {cols.map(col => (
                            <td key={col} style={{ padding: '10px 14px', color: '#0F172A', borderRight: '1px solid #D1FAE5', verticalAlign: 'top' }}>
                              {row[col] ?? <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ border: '1px solid #D1FAE5', borderRadius: 8, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {Object.entries(selectedSub.data || {}).map(([key, val], i) => (
                        <tr key={key} style={{ borderBottom: '1px solid #F0FDF4', background: i % 2 === 0 ? '#fff' : '#F8FFFE' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', width: '45%', borderRight: '1px solid #D1FAE5' }}>{key}</td>
                          <td style={{ padding: '10px 14px', color: '#0F172A' }}>{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="u-btn u-btn-green" onClick={() => setSelectedSub(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="u-page-header">
        <div>
          <div className="u-page-title">📋 My Tasks &amp; Submissions</div>
          <div className="u-page-sub">All assigned work items and your submitted forms — in one place.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="u-badge u-badge-pending" style={{ fontSize: 13 }}>{activeTasks} Active Tasks</span>
          <span className="u-badge u-badge-done"    style={{ fontSize: 13 }}>{submissions.length} Submissions</span>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '2px solid #E2E8F0' }}>
        {[
          { key: 'tasks',       label: '📌 My Tasks',       count: tasks.length },
          { key: 'submissions', label: '📄 My Submissions',  count: submissions.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 22px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #15803D' : '3px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 700 : 500,
              color:  activeTab === tab.key ? '#15803D' : '#64748B',
              fontSize: 14,
              marginBottom: -2,
              transition: 'all .2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.key ? '#D1FAE5' : '#F1F5F9',
              color:       activeTab === tab.key ? '#15803D' : '#64748B',
              fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ══ TASKS TAB ═══════════════════════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <>
          {tasksLoading ? (
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
                      <th style={{ width: '35%' }}>Work Title &amp; Description</th>
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
                        <td><span className={STATUS_CLASS_TASK[t.status] || 'u-badge u-badge-pending'}>{t.status || 'Pending'}</span></td>
                        <td>
                          {t.type === 'Form' && t.status !== 'Completed' ? (
                            <button className="u-btn u-btn-green u-btn-sm" onClick={() => navigate('/user/timetable')}>📝 Fill Form</button>
                          ) : (
                            <button className="u-btn u-btn-outline u-btn-sm" onClick={() => setSelectedTask(t)}>👁 View</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ SUBMISSIONS TAB ═════════════════════════════════════════════════ */}
      {activeTab === 'submissions' && (
        <>
          {subsLoading ? (
            <div className="u-card" style={{ textAlign: 'center', padding: 60 }}>
              <div className="u-empty-icon">⏳</div>
              <div className="u-empty-title">Loading your submissions…</div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="u-card">
              <div className="u-empty">
                <div className="u-empty-icon">📭</div>
                <div className="u-empty-title">No submissions yet</div>
                <div className="u-empty-sub">Go to <strong>My Timetable</strong>, fill in the form, and click "Submit to Admin".</div>
              </div>
            </div>
          ) : (
            <div className="u-card">
              <div className="u-table-wrap">
                <table className="u-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Form / Template</th>
                      <th>Submitted At</th>
                      <th>Status</th>
                      <th>Admin Review</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s, i) => (
                      <tr key={s.id || i}>
                        <td style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{s.id || `SUB-${i + 1}`}</td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{s.template}</td>
                        <td style={{ fontSize: 13, color: '#475569' }}>{s.submittedAt}</td>
                        <td><span className={STATUS_CLASS_SUB[s.status] || 'u-badge u-badge-pending'}>{s.status}</span></td>
                        <td style={{ fontSize: 13, color: s.status === 'Reviewed' ? '#15803D' : s.status === 'Rejected' ? '#B91C1C' : '#94A3B8' }}>
                          {s.status === 'Reviewed' ? '✅ Reviewed by Admin' : s.status === 'Rejected' ? '❌ Rejected' : '⏳ Awaiting review'}
                        </td>
                        <td>
                          <button className="u-btn u-btn-outline u-btn-sm" onClick={() => setSelectedSub(s)}>👁 View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </UserLayout>
  );
}
