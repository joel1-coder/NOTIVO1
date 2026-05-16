import React, { useState, useEffect } from 'react';
import WorkflowLayout from './WorkflowLayout';
import './workflow.css';
import { useNavigate } from 'react-router-dom';
import { templateAPI, userAPI } from '../../services/api';

const FALLBACK_USERS = [
  { _id: 'u1', name: 'Jordan Smith', email: 'jordan.smith@workflow.admin', role: 'USER' },
  { _id: 'u2', name: 'Amara Miller', email: 'amara.m@workflow.admin',       role: 'MOD'  },
  { _id: 'u3', name: 'David Wright', email: 'david.wright@workflow.admin',  role: 'USER' },
  { _id: 'u4', name: 'Elena Lopez',  email: 'elena.l@workflow.admin',       role: 'USER' },
];

export default function WorkflowSavedTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates]   = useState([]);
  const [loading, setLoading]       = useState(true);

  // Share modal state
  const [shareTarget, setShareTarget]   = useState(null); // the template being shared
  const [users, setUsers]               = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll]       = useState(false);
  const [sharing, setSharing]           = useState(false);
  const [sharedOk, setSharedOk]         = useState('');

  // ── Load templates ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await templateAPI.getAllTemplates();
        let list = data.data || [];
        // Also pull from localStorage
        const local = JSON.parse(localStorage.getItem('wf_templates') || '[]');
        const merged = [
          ...local,
          ...list.filter(t => !local.some(l => l.templateId === (t.templateId || t._id))),
        ];
        setTemplates(merged.length > 0 ? merged : MOCK_TEMPLATES);
      } catch {
        const local = JSON.parse(localStorage.getItem('wf_templates') || '[]');
        setTemplates(local.length > 0 ? local : MOCK_TEMPLATES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const MOCK_TEMPLATES = [
    { templateId: 'TB-06482', name: 'Enterprise Migration Phase 1', createdAt: '2023-10-24', author: 'Alex Sterling', priority: 'High',   sharedWith: 'Entire Users', columns: [{ id:'c1',name:'Task',type:'Text',enabled:true },{ id:'c2',name:'Timeline',type:'Text',enabled:true },{ id:'c3',name:'Status',type:'Label',enabled:true }] },
    { templateId: 'TB-06483', name: 'Q4 Marketing Campaign',        createdAt: '2023-10-28', author: 'Sarah Jenkins', priority: 'Medium', sharedWith: 'Private',      columns: [{ id:'c1',name:'Campaign',type:'Text',enabled:true },{ id:'c2',name:'Budget',type:'Number',enabled:true }] },
    { templateId: 'TB-06485', name: 'Security Audit Q3',            createdAt: '2023-11-12', author: 'Admin User',    priority: 'Low',    sharedWith: 'Private',      columns: [{ id:'c1',name:'Check Item',type:'Text',enabled:true },{ id:'c2',name:'Result',type:'Label',enabled:true }] },
  ];

  // ── Open share modal for a template ───────────────────────────────────────
  const openShare = (tpl) => {
    setShareTarget(tpl);
    setSelectedUsers([]);
    setSelectAll(false);
    setLoadingUsers(true);
    userAPI.getAllUsers()
      .then(res => {
        const list = (res.data || []).filter(u => u.role !== 'ADMIN');
        setUsers(list.length > 0 ? list : FALLBACK_USERS);
      })
      .catch(() => setUsers(FALLBACK_USERS))
      .finally(() => setLoadingUsers(false));
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setSelectedUsers(checked ? users.map(u => u.email) : []);
  };

  const handleToggleUser = (email) =>
    setSelectedUsers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );

  const handleShare = async () => {
    if (!shareTarget || selectedUsers.length === 0) return;
    setSharing(true);

    selectedUsers.forEach(email => {
      const key = `wf_assigned_${email}`;
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const alreadyExists = current.some(t => t.templateId === shareTarget.templateId);
      if (!alreadyExists) {
        current.push({
          ...shareTarget,
          assignedAt: new Date().toISOString(),
          assignedTo: email,
          status: 'pending',
        });
        localStorage.setItem(key, JSON.stringify(current));
      }
    });

    // Update sharedWith in templates list
    const label = selectAll ? 'Entire Users' : selectedUsers.join(', ');
    setTemplates(prev =>
      prev.map(t =>
        t.templateId === shareTarget.templateId ? { ...t, sharedWith: label } : t
      )
    );
    const local = JSON.parse(localStorage.getItem('wf_templates') || '[]');
    const updated = local.map(t =>
      t.templateId === shareTarget.templateId ? { ...t, sharedWith: label } : t
    );
    localStorage.setItem('wf_templates', JSON.stringify(updated));

    await new Promise(r => setTimeout(r, 500));
    setSharing(false);
    setShareTarget(null);
    setSharedOk(`"${shareTarget.name}" shared with ${selectedUsers.length} user(s)!`);
    setTimeout(() => setSharedOk(''), 3500);
  };

  const handleDelete = (id) => {
    setTemplates(prev => prev.filter(t => (t.templateId || t._id) !== id));
    const local = JSON.parse(localStorage.getItem('wf_templates') || '[]');
    localStorage.setItem('wf_templates', JSON.stringify(local.filter(t => t.templateId !== id)));
  };

  return (
    <WorkflowLayout>

      {/* ── Share Modal ─────────────────────────────────────────────────────── */}
      {shareTarget && (
        <div className="wf-modal-overlay" onClick={() => setShareTarget(null)}>
          <div className="wf-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>📤 Share Template</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B' }} onClick={() => setShareTarget(null)}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18 }}>
              Assign "<strong>{shareTarget.name}</strong>" to users — it will appear on their <strong>My Timetable</strong> page.
            </div>

            {/* Select All */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose Users</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={e => handleSelectAll(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#2563EB' }}
                />
                Select All
              </label>
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8' }}>Loading users…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 280, overflowY: 'auto', marginBottom: 20 }}>
                {users.map(u => {
                  const initials = u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const checked  = selectedUsers.includes(u.email);
                  return (
                    <label
                      key={u.email}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', border: `1.5px solid ${checked ? '#2563EB' : '#E2E8F0'}`,
                        borderRadius: 9, background: checked ? '#EFF6FF' : '#F8FAFC',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleUser(u.email)}
                        style={{ width: 16, height: 16, accentColor: '#2563EB', flexShrink: 0 }}
                      />
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{u.email}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: u.role === 'MOD' ? '#EDE9FE' : '#F1F5F9', color: u.role === 'MOD' ? '#7C3AED' : '#475569' }}>
                        {u.role}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>{selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setShareTarget(null)}>Cancel</button>
                <button
                  className="btn btn-blue"
                  onClick={handleShare}
                  disabled={selectedUsers.length === 0 || sharing}
                >
                  {sharing ? 'Sharing…' : `📤 Share to ${selectedUsers.length || '…'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ────────────────────────────────────────────────────────────── */}
      <div className="wf-page-header">
        <div>
          <div className="wf-page-title">Saved Templates</div>
          <div className="wf-page-sub">View, manage, and share your form templates with users.</div>
        </div>
        <button className="btn btn-blue" onClick={() => navigate('/form-builder')}>+ New Template</button>
      </div>

      {sharedOk && (
        <div style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: 7, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          🚀 {sharedOk}
        </div>
      )}

      <div className="wf-card p-0" style={{ overflow: 'hidden' }}>
        <table className="wf-table">
          <thead>
            <tr>
              <th>TEMPLATE NAME</th>
              <th>TEMPLATE ID</th>
              <th>COLUMNS</th>
              <th>SHARED WITH</th>
              <th>PRIORITY</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>Loading templates…</td></tr>
            ) : templates.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>No templates found. <button className="wf-link" onClick={() => navigate('/form-builder')}>Create one →</button></td></tr>
            ) : (
              templates.map(t => {
                const id = t.templateId || t._id || t.id;
                const enabledCols = (t.columns || []).filter(c => c.enabled).length;
                return (
                  <tr key={id}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{t.name}</td>
                    <td style={{ fontSize: 12, color: '#64748B' }}>{id}</td>
                    <td style={{ fontSize: 13, color: '#475569' }}>{enabledCols} column{enabledCols !== 1 ? 's' : ''}</td>
                    <td>
                      <span style={{
                        background: t.sharedWith && t.sharedWith !== 'Private' ? '#DCFCE7' : '#F1F5F9',
                        color: t.sharedWith && t.sharedWith !== 'Private' ? '#15803D' : '#475569',
                        padding: '3px 9px', borderRadius: 5, fontSize: 12, fontWeight: 500,
                      }}>
                        {t.sharedWith || 'Private'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.priority === 'High' ? 'badge-red' : t.priority === 'Medium' ? 'badge-yellow' : 'badge-blue'}`}>
                        {t.priority || 'Medium'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/form-builder')}>Edit</button>
                      <button
                        className="btn btn-blue btn-sm"
                        style={{ fontSize: 11 }}
                        onClick={() => openShare(t)}
                      >
                        📤 Share
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#EF4444' }}
                        onClick={() => handleDelete(id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </WorkflowLayout>
  );
}
