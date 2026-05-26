import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowLayout from './WorkflowLayout';
import { taskAPI, templateAPI, userAPI } from '../../services/api';
import './workflow.css';

const CATEGORIES = ['Engineering', 'Marketing', 'Design', 'Finance', 'Sales', 'HR'];
const USERS = ['Sarah Jenkins (Senior Lead)', 'Alex Rivera', 'Michael Scott', 'Elena Rodriguez', 'David Wright'];

const MOCK_TEMPLATES = [
  { templateId: 'TB-06482', name: 'Enterprise Migration Phase 1', createdAt: '2023-10-24', author: 'Alex Sterling',  priority: 'High',   columns: [{ id:'c1',name:'Task',type:'Text',enabled:true },{ id:'c2',name:'Timeline',type:'Text',enabled:true },{ id:'c3',name:'Status',type:'Label',enabled:true }] },
  { templateId: 'TB-06483', name: 'Q4 Marketing Campaign',        createdAt: '2023-10-28', author: 'Sarah Jenkins', priority: 'Medium', columns: [{ id:'c1',name:'Campaign',type:'Text',enabled:true },{ id:'c2',name:'Budget',type:'Number',enabled:true }] },
  { templateId: 'TB-06485', name: 'Security Audit Q3',            createdAt: '2023-11-12', author: 'Admin User',    priority: 'Low',    columns: [{ id:'c1',name:'Check Item',type:'Text',enabled:true },{ id:'c2',name:'Result',type:'Label',enabled:true }] },
];

export default function WorkflowCreateTask() {
  const navigate = useNavigate();

  // ── Task type: 'regular' | 'template' ──────────────────────────────────────
  const [taskType, setTaskType] = useState('regular');

  // ── Regular task form ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '', description: '', category: 'Engineering', user: USERS[0], priority: 'LOW', dueDate: ''
  });

  // ── Template picker state ──────────────────────────────────────────────────
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates]                   = useState([]);
  const [templatesLoading, setTemplatesLoading]     = useState(false);
  const [selectedTemplate, setSelectedTemplate]     = useState(null);

  // ── Template-task assign form ──────────────────────────────────────────────
  const [tplForm, setTplForm] = useState({
    user: USERS[0], priority: 'LOW', dueDate: '', note: ''
  });
  const [dbUsers, setDbUsers]         = useState([]);
  const [dbUsersLoading, setDbUsersLoading] = useState(false);

  // ── Shared UI state ────────────────────────────────────────────────────────
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const setF  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setTF = (k, v) => setTplForm(p => ({ ...p, [k]: v }));

  // ── Load users from API (for template assignment) ──────────────────────────
  useEffect(() => {
    setDbUsersLoading(true);
    userAPI.getAllUsers()
      .then(res => {
        const list = (res.data || []).filter(u => u.role !== 'ADMIN');
        setDbUsers(list.length > 0 ? list.map(u => u.name || u.email) : USERS);
      })
      .catch(() => setDbUsers(USERS))
      .finally(() => setDbUsersLoading(false));
  }, []);

  // ── Open template picker & load templates ──────────────────────────────────
  const openTemplatePicker = () => {
    setShowTemplatePicker(true);
    setTemplatesLoading(true);
    templateAPI.getAllTemplates()
      .then(res => {
        const api   = res.data || [];
        const local = JSON.parse(localStorage.getItem('wf_templates') || '[]');
        const merged = [
          ...local,
          ...api.filter(t => !local.some(l => l.templateId === (t.templateId || t._id))),
        ];
        setTemplates(merged.length > 0 ? merged : MOCK_TEMPLATES);
      })
      .catch(() => {
        const local = JSON.parse(localStorage.getItem('wf_templates') || '[]');
        setTemplates(local.length > 0 ? local : MOCK_TEMPLATES);
      })
      .finally(() => setTemplatesLoading(false));
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setShowTemplatePicker(false);
    // Pre-fill priority from template if available
    if (tpl.priority) {
      const p = tpl.priority.toUpperCase();
      setTF('priority', p === 'HIGH' ? 'HIGH' : p === 'LOW' ? 'LOW' : 'MED');
    }
  };

  // ── Save regular task ──────────────────────────────────────────────────────
  const handleSaveRegular = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true); setError('');
    try {
      const taskData = {
        title: form.title, description: form.description,
        category: form.category, assignedTo: form.user.split('(')[0].trim(),
        priority: form.priority, dueDate: form.dueDate, status: 'PENDING',
      };
      const response = await taskAPI.createTask(taskData);
      if (response.success) {
        setSaved(true);
        setTimeout(() => { setSaved(false); navigate('/tasks'); }, 1200);
      } else { setError('Failed to save task'); }
    } catch {
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate('/tasks'); }, 1200);
    } finally { setLoading(false); }
  };

  // ── Save template-based task ───────────────────────────────────────────────
  const handleSaveTemplateTask = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) { setError('Please choose a template first'); return; }
    setLoading(true); setError('');

    const assigneeName = tplForm.user.split('(')[0].trim();
    const assigneeEmail = assigneeName.toLowerCase().replace(/\s+/g, '.') + '@workflow.admin';

    // Save to local assigned templates
    const key     = `wf_assigned_${assigneeEmail}`;
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const alreadyExists = current.some(t => t.templateId === selectedTemplate.templateId);
    if (!alreadyExists) {
      current.push({
        ...selectedTemplate,
        assignedAt: new Date().toISOString(),
        assignedTo:  assigneeEmail,
        assignedBy:  'System Admin',
        priority:    tplForm.priority,
        dueDate:     tplForm.dueDate,
        note:        tplForm.note,
        status:      'pending',
      });
      localStorage.setItem(key, JSON.stringify(current));
    }

    // Also save as a local task for task list visibility
    const localTasks = JSON.parse(localStorage.getItem('wf_local_tasks') || '[]');
    localTasks.push({
      id:          `TPL-${Date.now()}`,
      title:       selectedTemplate.name,
      description: tplForm.note || `Assigned template: ${selectedTemplate.name}`,
      category:    'Template',
      assignedTo:  [{ email: assigneeEmail, name: assigneeName }],
      assignedBy:  'System Admin',
      priority:    tplForm.priority,
      dueDate:     tplForm.dueDate,
      status:      'Pending',
      type:        'Form',
      templateId:  selectedTemplate.templateId,
    });
    localStorage.setItem('wf_local_tasks', JSON.stringify(localTasks));

    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); navigate('/tasks'); }, 1200);
  };

  const priorityColor = { LOW: '#3B82F6', MED: '#F59E0B', HIGH: '#EF4444' };

  return (
    <WorkflowLayout>
      {/* ── Template Picker Modal ─────────────────────────────────────────── */}
      {showTemplatePicker && (
        <div className="wf-modal-overlay" onClick={() => setShowTemplatePicker(false)}>
          <div
            className="wf-modal"
            style={{ maxWidth: 640, width: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>📋 Choose a Saved Template</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }} onClick={() => setShowTemplatePicker(false)}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18, flexShrink: 0 }}>
              Select a template to use as this task's form. Users will fill it out in their Timetable.
            </div>

            {/* Template list */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {templatesLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>⏳ Loading templates…</div>
              ) : templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>
                  No templates found.{' '}
                  <button className="wf-link" onClick={() => navigate('/form-builder')}>Create one →</button>
                </div>
              ) : (
                templates.map(tpl => {
                  const id          = tpl.templateId || tpl._id;
                  const enabledCols = (tpl.columns || []).filter(c => c.enabled).length;
                  const isSelected  = selectedTemplate?.templateId === id;
                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectTemplate(tpl)}
                      style={{
                        border:      `2px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                        borderRadius: 10,
                        padding:     '14px 18px',
                        cursor:      'pointer',
                        background:  isSelected ? '#EFF6FF' : '#F8FAFC',
                        transition:  'all 0.15s',
                        display:     'flex',
                        alignItems:  'center',
                        gap:         14,
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                        background: isSelected ? '#2563EB' : '#E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20,
                      }}>
                        📋
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 3 }}>{tpl.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          ID: {id} &nbsp;·&nbsp; {enabledCols} column{enabledCols !== 1 ? 's' : ''}
                          {tpl.author && <> &nbsp;·&nbsp; by {tpl.author}</>}
                        </div>
                      </div>

                      {/* Priority badge */}
                      <span style={{
                        padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                        background: tpl.priority === 'High' ? '#FEE2E2' : tpl.priority === 'Medium' ? '#FEF3C7' : '#DBEAFE',
                        color:      tpl.priority === 'High' ? '#B91C1C' : tpl.priority === 'Medium' ? '#92400E' : '#1D4ED8',
                      }}>
                        {tpl.priority || 'Medium'}
                      </span>

                      {/* Checkmark */}
                      {isSelected && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0 }}>✓</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
              <button className="btn btn-outline" onClick={() => setShowTemplatePicker(false)}>Cancel</button>
              <button className="btn btn-blue" onClick={() => navigate('/form-builder')}>+ Create New Template</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        <button className="wf-link" onClick={() => navigate('/tasks')}>Manage Tasks</button>
        <span style={{ color: '#CBD5E1' }}>/</span>
        <span style={{ color: '#2563EB' }}>Create New Task</span>
      </div>

      <div className="wf-page-header">
        <div>
          <div className="wf-page-title">Create New Task</div>
          <div className="wf-page-sub">Define the scope, priority, and ownership for the upcoming workflow cycle.</div>
        </div>
      </div>

      {/* ── Status banners ────────────────────────────────────────────────── */}
      {saved && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534', fontWeight: 600 }}>
          ✓ Task saved successfully! Redirecting…
        </div>
      )}
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Task Type Selector ────────────────────────────────────────────── */}
      <div className="wf-card" style={{ marginBottom: 20 }}>
        <div className="wf-section-title" style={{ marginBottom: 12 }}>Task Type</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Regular Task */}
          <button
            type="button"
            onClick={() => { setTaskType('regular'); setSelectedTemplate(null); setError(''); }}
            style={{
              flex: 1, padding: '14px 18px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              border:      `2px solid ${taskType === 'regular' ? '#2563EB' : '#E2E8F0'}`,
              background:  taskType === 'regular' ? '#EFF6FF' : '#F8FAFC',
              transition:  'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>📌</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: taskType === 'regular' ? '#1D4ED8' : '#0F172A' }}>Regular Task</span>
              {taskType === 'regular' && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '2px 8px', borderRadius: 999 }}>Selected</span>}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
              Create a custom task with a title, description, and assignment details.
            </div>
          </button>

          {/* Template Task */}
          <button
            type="button"
            onClick={() => { setTaskType('template'); setError(''); openTemplatePicker(); }}
            style={{
              flex: 1, padding: '14px 18px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              border:      `2px solid ${taskType === 'template' ? '#2563EB' : '#E2E8F0'}`,
              background:  taskType === 'template' ? '#EFF6FF' : '#F8FAFC',
              transition:  'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: taskType === 'template' ? '#1D4ED8' : '#0F172A' }}>Task from Template</span>
              {taskType === 'template' && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '2px 8px', borderRadius: 999 }}>Selected</span>}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
              Assign a saved form template — the user fills it in their Timetable.
            </div>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* REGULAR TASK FORM                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {taskType === 'regular' && (
        <form onSubmit={handleSaveRegular}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="wf-card">
                <div className="wf-section-title">General Information</div>
                <div className="wf-input-group">
                  <label>Task Title</label>
                  <input
                    className="wf-input"
                    placeholder="e.g., Q4 Financial Audit Preparation"
                    value={form.title}
                    onChange={e => setF('title', e.target.value)}
                    required
                  />
                </div>
                <div className="wf-input-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <textarea
                    className="wf-input" rows={5}
                    placeholder="Provide detailed instructions or acceptance criteria…"
                    value={form.description}
                    onChange={e => setF('description', e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>

              <div className="wf-grid-2">
                <div className="wf-card">
                  <div className="wf-input-group" style={{ marginBottom: 0 }}>
                    <label><span style={{ marginRight: 6 }}>📂</span>Category</label>
                    <select className="wf-input" value={form.category} onChange={e => setF('category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="wf-card">
                  <div className="wf-input-group" style={{ marginBottom: 0 }}>
                    <label><span style={{ marginRight: 6 }}>👤</span>Assigned User</label>
                    <select className="wf-input" value={form.user} onChange={e => setF('user', e.target.value)}>
                      {USERS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="wf-card">
                <div className="wf-section-title">Priority Level</div>
                <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 4, gap: 4, marginBottom: 20 }}>
                  {['LOW','MED','HIGH'].map(p => (
                    <button key={p} type="button" onClick={() => setF('priority', p)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: form.priority === p ? '#fff' : 'transparent',
                        color:      form.priority === p ? '#0F172A' : '#94A3B8',
                        boxShadow:  form.priority === p ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >{p}</button>
                  ))}
                </div>
                <div className="wf-input-group" style={{ marginBottom: 0 }}>
                  <label>Due Date</label>
                  <input type="date" className="wf-input" value={form.dueDate} onChange={e => setF('dueDate', e.target.value)} />
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', borderRadius: 10, padding: '18px 20px', color: 'white' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Productivity Insights</div>
                <p style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6, margin: 0 }}>
                  Tasks assigned before 10 AM have a 40% higher on-time completion rate. Consider scheduling during peak hours.
                </p>
              </div>

              <button type="submit" className="btn btn-blue btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? '💾 Saving…' : '💾 Save Task'}
              </button>
              <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/tasks')} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TEMPLATE TASK FORM                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {taskType === 'template' && (
        <form onSubmit={handleSaveTemplateTask}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Selected template card */}
              <div className="wf-card">
                <div className="wf-section-title" style={{ marginBottom: 14 }}>Selected Template</div>

                {selectedTemplate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#EFF6FF', border: '2px solid #2563EB', borderRadius: 10, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📋</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>{selectedTemplate.name}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        ID: {selectedTemplate.templateId} &nbsp;·&nbsp;
                        {(selectedTemplate.columns || []).filter(c => c.enabled).length} columns
                        {selectedTemplate.author && <> &nbsp;·&nbsp; by {selectedTemplate.author}</>}
                      </div>
                      {/* Column chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {(selectedTemplate.columns || []).filter(c => c.enabled).map(col => (
                          <span key={col.id} style={{ fontSize: 11, fontWeight: 600, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 8px', borderRadius: 5 }}>
                            {col.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={openTemplatePicker}
                      style={{ flexShrink: 0 }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={openTemplatePicker}
                    style={{
                      border: '2px dashed #CBD5E1', borderRadius: 10, padding: '32px 20px',
                      textAlign: 'center', cursor: 'pointer', background: '#F8FAFC',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#EFF6FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC'; }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 4 }}>No template selected</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>Click to browse your saved templates</div>
                    <button type="button" className="btn btn-blue btn-sm">Browse Templates</button>
                  </div>
                )}
              </div>

              {/* Assignment note */}
              {selectedTemplate && (
                <div className="wf-card">
                  <div className="wf-section-title">Assignment Note <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>(optional)</span></div>
                  <div className="wf-input-group" style={{ marginBottom: 0 }}>
                    <textarea
                      className="wf-input" rows={4}
                      placeholder="Add any instructions for the user about this form…"
                      value={tplForm.note}
                      onChange={e => setTF('note', e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* Assign user */}
              {selectedTemplate && (
                <div className="wf-card">
                  <div className="wf-input-group" style={{ marginBottom: 0 }}>
                    <label><span style={{ marginRight: 6 }}>👤</span>Assign To User</label>
                    {dbUsersLoading ? (
                      <div style={{ padding: 12, color: '#94A3B8', fontSize: 13 }}>Loading users…</div>
                    ) : (
                      <select className="wf-input" value={tplForm.user} onChange={e => setTF('user', e.target.value)}>
                        {(dbUsers.length > 0 ? dbUsers : USERS).map(u => <option key={u}>{u}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="wf-card">
                <div className="wf-section-title">Priority Level</div>
                <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 4, gap: 4, marginBottom: 20 }}>
                  {['LOW','MED','HIGH'].map(p => (
                    <button key={p} type="button" onClick={() => setTF('priority', p)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: tplForm.priority === p ? '#fff' : 'transparent',
                        color:      tplForm.priority === p ? '#0F172A' : '#94A3B8',
                        boxShadow:  tplForm.priority === p ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >{p}</button>
                  ))}
                </div>
                <div className="wf-input-group" style={{ marginBottom: 0 }}>
                  <label>Due Date</label>
                  <input type="date" className="wf-input" value={tplForm.dueDate} onChange={e => setTF('dueDate', e.target.value)} />
                </div>
              </div>

              {/* Template summary */}
              {selectedTemplate && (
                <div style={{ background: 'linear-gradient(135deg, #064E3B, #059669)', borderRadius: 10, padding: '18px 20px', color: 'white' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📋 Template Summary</div>
                  <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.7 }}>
                    <div><strong>Name:</strong> {selectedTemplate.name}</div>
                    <div><strong>Columns:</strong> {(selectedTemplate.columns || []).filter(c => c.enabled).map(c => c.name).join(', ') || '—'}</div>
                    <div style={{ marginTop: 8, opacity: 0.75, fontSize: 11 }}>
                      The user will see this form in their Timetable and must fill &amp; submit it.
                    </div>
                  </div>
                </div>
              )}

              {!selectedTemplate && (
                <div style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', borderRadius: 10, padding: '18px 20px', color: 'white' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Productivity Insights</div>
                  <p style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6, margin: 0 }}>
                    Template-based tasks ensure consistent data collection. Choose a template to get started.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-blue btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading || !selectedTemplate}
              >
                {loading ? '💾 Saving…' : '💾 Assign Template Task'}
              </button>
              <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/tasks')} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </WorkflowLayout>
  );
}
