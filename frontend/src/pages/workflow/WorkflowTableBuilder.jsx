import React, { useState, useEffect } from 'react';
import WorkflowLayout from './WorkflowLayout';
import { templateAPI, userAPI } from '../../services/api';
import './workflow.css';

const DEFAULT_COLS = [
  { id: 'c1', name: 'Subject / Task',   type: 'Text',   enabled: true },
  { id: 'c2', name: 'Description',      type: 'Text',   enabled: true },
  { id: 'c3', name: 'Due Date',         type: 'Date',   enabled: true },
  { id: 'c4', name: 'Priority',         type: 'Label',  enabled: true },
  { id: 'c5', name: 'Remarks',          type: 'Text',   enabled: false },
];

const FALLBACK_USERS = [
  { _id: 'u1', name: 'Jordan Smith',  email: 'jordan.smith@workflow.admin',  role: 'USER' },
  { _id: 'u2', name: 'Amara Miller',  email: 'amara.m@workflow.admin',        role: 'MOD'  },
  { _id: 'u3', name: 'David Wright',  email: 'david.wright@workflow.admin',   role: 'USER' },
  { _id: 'u4', name: 'Elena Lopez',   email: 'elena.l@workflow.admin',        role: 'USER' },
];

export default function WorkflowTableBuilder() {
  const [cols, setCols]             = useState(DEFAULT_COLS);
  const [templateName, setTemplateName] = useState('New Timetable');
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('Text');
  const [rowCount, setRowCount]     = useState(3);
  const [saved, setSaved]           = useState(false);
  const [published, setPublished]   = useState(false);
  const [savedTemplate, setSavedTemplate] = useState(null); // template saved but not shared yet

  // Share modal
  const [showShare, setShowShare]   = useState(false);
  const [users, setUsers]           = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]); // array of user emails
  const [selectAll, setSelectAll]   = useState(false);
  const [priority, setPriority]     = useState('Medium');
  const [sharing, setSharing]       = useState(false);

  // ── Load users when share modal opens ─────────────────────────────────────
  useEffect(() => {
    if (!showShare) return;
    setLoadingUsers(true);
    userAPI.getAllUsers()
      .then(res => {
        const list = (res.data || []).filter(u => u.role !== 'ADMIN');
        setUsers(list.length > 0 ? list : FALLBACK_USERS);
      })
      .catch(() => setUsers(FALLBACK_USERS))
      .finally(() => setLoadingUsers(false));
  }, [showShare]);

  // ── Column helpers ─────────────────────────────────────────────────────────
  const toggleCol  = (id) => setCols(p => p.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  const removeCol  = (id) => setCols(p => p.filter(c => c.id !== id));
  const addCol = () => {
    if (!newColName.trim()) return;
    setCols(p => [...p, { id: Date.now().toString(), name: newColName.trim(), type: newColType, enabled: true }]);
    setNewColName('');
  };
  const enabledCols = cols.filter(c => c.enabled);

  // ── Save template to backend + localStorage ────────────────────────────────
  const handleSave = async () => {
    const id = 'TB-' + Date.now();
    const tpl = {
      templateId: id,
      name: templateName || 'Untitled Template',
      columns: cols,
      priority,
      sharedWith: 'Private',
      createdAt: new Date().toISOString(),
    };
    try { await templateAPI.createTemplate(tpl); } catch (_) {}

    // Save locally for the share step
    setSavedTemplate({ ...tpl, id });
    // Also persist to localStorage templates list
    const existing = JSON.parse(localStorage.getItem('wf_templates') || '[]');
    existing.push(tpl);
    localStorage.setItem('wf_templates', JSON.stringify(existing));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── User selection logic ───────────────────────────────────────────────────
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setSelectedUsers(checked ? users.map(u => u.email) : []);
  };

  const handleToggleUser = (email) => {
    setSelectedUsers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // ── Share = write assignment into localStorage per user ────────────────────
  const handleShare = async () => {
    if (selectedUsers.length === 0) return;
    setSharing(true);

    // Make sure we have a saved template
    let tpl = savedTemplate;
    if (!tpl) {
      const id = 'TB-' + Date.now();
      tpl = {
        templateId: id,
        id,
        name: templateName || 'Untitled Template',
        columns: cols,
        priority,
        createdAt: new Date().toISOString(),
      };
      setSavedTemplate(tpl);
      const existing = JSON.parse(localStorage.getItem('wf_templates') || '[]');
      existing.push(tpl);
      localStorage.setItem('wf_templates', JSON.stringify(existing));
    }

    // Write assignment for each selected user
    selectedUsers.forEach(email => {
      const key = `wf_assigned_${email}`;
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      // Avoid duplicate
      const alreadyExists = current.some(t => t.templateId === tpl.templateId);
      if (!alreadyExists) {
        current.push({
          ...tpl,
          assignedAt: new Date().toISOString(),
          assignedTo: email,
          status: 'pending',
        });
        localStorage.setItem(key, JSON.stringify(current));
      }
    });

    // Update sharedWith label in localStorage templates
    const existing = JSON.parse(localStorage.getItem('wf_templates') || '[]');
    const updated = existing.map(t =>
      t.templateId === tpl.templateId
        ? { ...t, sharedWith: selectAll ? 'Entire Users' : selectedUsers.join(', ') }
        : t
    );
    localStorage.setItem('wf_templates', JSON.stringify(updated));

    await new Promise(r => setTimeout(r, 600)); // brief UX delay
    setSharing(false);
    setShowShare(false);
    setPublished(true);
    setSelectedUsers([]);
    setSelectAll(false);
    setTimeout(() => setPublished(false), 3000);
  };

  return (
    <WorkflowLayout>

      {/* ── Share Modal ─────────────────────────────────────────────────────── */}
      {showShare && (
        <div className="wf-modal-overlay" onClick={() => setShowShare(false)}>
          <div
            className="wf-modal"
            style={{ maxWidth: 540 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>📤 Share Template</div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B' }}
                onClick={() => setShowShare(false)}
              >✕</button>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              Select the users who should receive "<strong>{templateName}</strong>" in their timetable.
            </div>

            {/* Priority */}
            <div className="wf-input-group">
              <label>Priority Level</label>
              <select className="wf-input" value={priority} onChange={e => setPriority(e.target.value)}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            {/* User list */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Users
                </label>
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
                <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8', fontSize: 13 }}>Loading users…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
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
                        <div
                          style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                            color: 'white', fontSize: 12, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>{u.email}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: u.role === 'MOD' ? '#EDE9FE' : '#F1F5F9',
                            color: u.role === 'MOD' ? '#7C3AED' : '#475569',
                          }}
                        >
                          {u.role}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setShowShare(false)}>Cancel</button>
                <button
                  className="btn btn-blue"
                  onClick={handleShare}
                  disabled={selectedUsers.length === 0 || sharing}
                  style={{ minWidth: 120 }}
                >
                  {sharing ? '📤 Sharing…' : `📤 Share to ${selectedUsers.length || '…'} User${selectedUsers.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', marginBottom: 20 }}>
        <span>AdminSuite</span>
        <span>/</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>Form Builder</span>
      </div>

      {/* Status banners */}
      {saved && (
        <div style={{ background: '#DCFCE7', color: '#166534', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
          ✓ Template "<strong>{templateName}</strong>" saved! Click <strong>Share</strong> to assign it to users.
        </div>
      )}
      {published && (
        <div style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
          🚀 Template shared! Users will see it on their <strong>My Timetable</strong> page.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 20, height: 'calc(100vh - 185px)', minHeight: 500 }}>

        {/* ── LEFT: Column Manager ──────────────────────────────────────────── */}
        <div className="wf-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Form Builder</div>
            {/* Template name input */}
            <input
              className="wf-input"
              placeholder="Template name…"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              style={{ fontSize: 13, fontWeight: 600, marginBottom: 0 }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Columns ({cols.length})
            </div>

            {cols.map(col => (
              <div
                key={col.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', background: col.enabled ? '#F8FAFC' : '#fff',
                  border: `1px solid ${col.enabled ? '#E2E8F0' : '#F1F5F9'}`,
                  borderRadius: 8, marginBottom: 6, opacity: col.enabled ? 1 : 0.55,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{col.name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>Type: {col.type}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <button className={`wf-toggle ${col.enabled ? 'on' : 'off'}`} onClick={() => toggleCol(col.id)} />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#EF4444', padding: 4 }}
                    onClick={() => removeCol(col.id)}
                    title="Remove"
                  >🗑️</button>
                </div>
              </div>
            ))}

            {/* Add column */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Add Column
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input
                  className="wf-input"
                  placeholder="Column name…"
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCol()}
                  style={{ fontSize: 12, flex: 1 }}
                />
                <select
                  className="wf-input"
                  value={newColType}
                  onChange={e => setNewColType(e.target.value)}
                  style={{ fontSize: 12, width: 90 }}
                >
                  <option>Text</option>
                  <option>Date</option>
                  <option>Number</option>
                  <option>Label</option>
                </select>
              </div>
              <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={addCol}>
                + Add Column
              </button>
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={handleSave}>
              💾 Save Template
            </button>
            <button
              className="btn btn-blue btn-sm"
              style={{ width: '100%', background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}
              onClick={() => setShowShare(true)}
            >
              📤 Save &amp; Share with Users
            </button>
          </div>
        </div>

        {/* ── RIGHT: Live Preview ───────────────────────────────────────────── */}
        <div className="wf-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Live Preview</span>
              <span className="badge badge-green" style={{ fontSize: 10 }}>● SYNCED</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{templateName}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCols(DEFAULT_COLS); setTemplateName('New Timetable'); }}>Reset</button>
            </div>
          </div>

          {/* Preview table — this is what users will see and fill in */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10, fontStyle: 'italic' }}>
              👇 This is exactly what users will see. Each row will have an input field they fill in.
            </div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              <table className="wf-table" style={{ minWidth: 500 }}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    {enabledCols.map(c => <th key={c.id}>{c.name.toUpperCase()}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: rowCount }).map((_, ri) => (
                    <tr key={ri}>
                      <td style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>{String(ri + 1).padStart(2, '0')}</td>
                      {enabledCols.map(col => (
                        <td key={col.id}>
                          <div
                            style={{
                              background: '#F8FAFC', border: '1px dashed #CBD5E1',
                              borderRadius: 6, padding: '7px 10px',
                              fontSize: 12, color: '#94A3B8', fontStyle: 'italic',
                            }}
                          >
                            {col.type === 'Date' ? 'dd/mm/yyyy' : col.type === 'Number' ? '0' : `Enter ${col.name}…`}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Rows:</span>
                <input
                  type="number" min="1" max="50"
                  value={rowCount}
                  onChange={e => setRowCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="wf-input"
                  style={{ width: 70, padding: '6px 10px' }}
                />
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setRowCount(r => r + 1)}>
                + Add row
              </button>
            </div>
          </div>

          <div style={{ padding: '10px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              {enabledCols.length} column{enabledCols.length !== 1 ? 's' : ''} · {rowCount} row{rowCount !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              {savedTemplate ? `✓ Saved as ${savedTemplate.templateId}` : 'Not saved yet'}
            </span>
          </div>
        </div>
      </div>
    </WorkflowLayout>
  );
}
