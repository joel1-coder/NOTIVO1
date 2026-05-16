import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import { submissionAPI } from '../../services/api';
import './user.css';

export default function UserTimetable() {
  const navigate = useNavigate();

  // Get current logged-in user
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  })();

  const [templates, setTemplates]   = useState([]);   // assigned templates for this user
  const [loading, setLoading]       = useState(true);
  const [activeId, setActiveId]     = useState(null); // which template is open/filling

  // answers[templateId][rowIndex][colId] = string value
  const [answers, setAnswers]       = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState('');
  const [confirmTpl, setConfirmTpl] = useState(null); // template about to be submitted

  // ── Load assigned templates for this user ─────────────────────────────────
  useEffect(() => {
    const email = currentUser.email || '';
    const key   = `wf_assigned_${email}`;
    const assigned = JSON.parse(localStorage.getItem(key) || '[]');
    setTemplates(assigned);
    if (assigned.length > 0) setActiveId(assigned[0].templateId);
    setLoading(false);
  }, []);

  const enabledCols = (tpl) => (tpl.columns || []).filter(c => c.enabled);

  // ── Answer helpers ─────────────────────────────────────────────────────────
  const setAnswer = (tplId, rowIdx, colId, val) =>
    setAnswers(prev => ({
      ...prev,
      [tplId]: {
        ...(prev[tplId] || {}),
        [rowIdx]: {
          ...((prev[tplId] || {})[rowIdx] || {}),
          [colId]: val,
        },
      },
    }));

  const getAnswer = (tplId, rowIdx, colId) =>
    ((answers[tplId] || {})[rowIdx] || {})[colId] || '';

  // Count filled cells for a template
  const filledCount = (tpl) => {
    const cols = enabledCols(tpl);
    const rows = tpl.rowCount || 3;
    let filled = 0;
    for (let r = 0; r < rows; r++) {
      cols.forEach(c => { if (getAnswer(tpl.templateId, r, c.id)) filled++; });
    }
    return { filled, total: cols.length * rows };
  };

  // ── Submit a template's answers to admin submissions ───────────────────────
  const handleSubmit = async (tpl) => {
    setConfirmTpl(null);
    setSubmitting(true);

    const cols = enabledCols(tpl);
    const rows = tpl.rowCount || 3;

    // Build flat data object: "Row 1 - Subject" => value
    const data = {};
    for (let r = 0; r < rows; r++) {
      cols.forEach(c => {
        const val = getAnswer(tpl.templateId, r, c.id);
        data[`Row ${r + 1} — ${c.name}`] = val || '(blank)';
      });
    }

    const submission = {
      submissionId: 'SUB-' + Date.now(),
      user: currentUser._id || currentUser.email || 'unknown',
      template: tpl.templateId,
      status: 'Pending',
      data,
      submittedAt: new Date().toISOString(),
      // Extra meta for admin panel display
      _meta: {
        userName:      currentUser.name  || 'User',
        userEmail:     currentUser.email || '',
        templateName:  tpl.name,
        submittedAt:   new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      },
    };

    // Push to backend
    try { await submissionAPI.createSubmission(submission); } catch (_) {}

    // Also save locally so admin can see even if DB is down
    const localKey = 'wf_local_submissions';
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    existing.push(submission);
    localStorage.setItem(localKey, JSON.stringify(existing));

    // Mark this template as submitted for user
    const email = currentUser.email || '';
    const assignedKey = `wf_assigned_${email}`;
    const assigned = JSON.parse(localStorage.getItem(assignedKey) || '[]');
    const updated  = assigned.map(t =>
      t.templateId === tpl.templateId ? { ...t, status: 'submitted', submittedAt: new Date().toISOString() } : t
    );
    localStorage.setItem(assignedKey, JSON.stringify(updated));
    setTemplates(updated);

    setSubmitting(false);
    showToast(`✅ "${tpl.name}" submitted to Admin!`);
    setTimeout(() => navigate('/user/submissions'), 2200);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const activeTemplate = templates.find(t => t.templateId === activeId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <UserLayout>

      {/* Toast */}
      {toast && <div className="u-toast">🔔 {toast}</div>}

      {/* Confirm submit modal */}
      {confirmTpl && (
        <div className="u-modal-overlay" onClick={() => setConfirmTpl(null)}>
          <div className="u-modal" onClick={e => e.stopPropagation()}>
            <div className="u-modal-title">Submit to Admin?</div>
            <div className="u-modal-sub">
              You are about to submit <strong>"{confirmTpl.name}"</strong>.<br/>
              {(() => { const { filled, total } = filledCount(confirmTpl); return `${filled} of ${total} fields filled.`; })()}
              <br/>Once submitted, the admin will be able to review your responses.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="u-btn u-btn-outline" onClick={() => setConfirmTpl(null)}>Cancel</button>
              <button
                className="u-btn u-btn-green"
                onClick={() => handleSubmit(confirmTpl)}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : '📤 Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="u-page-header">
        <div>
          <div className="u-page-title">📋 My Timetable</div>
          <div className="u-page-sub">
            Forms assigned to you by Admin. Fill in each field and click "Submit to Admin" when done.
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#64748B', textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{currentUser.name || 'User'}</div>
          <div>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="u-card" style={{ textAlign: 'center', padding: 60 }}>
          <div className="u-empty-icon">⏳</div>
          <div className="u-empty-title">Loading your assignments…</div>
        </div>
      )}

      {/* Empty — no templates assigned yet */}
      {!loading && templates.length === 0 && (
        <div className="u-card">
          <div className="u-empty">
            <div className="u-empty-icon">📭</div>
            <div className="u-empty-title">No timetable assigned yet</div>
            <div className="u-empty-sub">
              Your admin hasn't shared any forms with you yet.<br/>
              Check back after the admin creates and shares a template.
            </div>
          </div>
        </div>
      )}

      {/* Template tabs + form */}
      {!loading && templates.length > 0 && (
        <>
          {/* Tab bar — one tab per assigned template */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {templates.map(tpl => {
              const isActive    = tpl.templateId === activeId;
              const isSubmitted = tpl.status === 'submitted';
              return (
                <button
                  key={tpl.templateId}
                  onClick={() => setActiveId(tpl.templateId)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: `2px solid ${isActive ? '#22C55E' : '#E2E8F0'}`,
                    background: isActive ? '#F0FDF4' : '#fff',
                    color: isActive ? '#15803D' : '#475569',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    transition: 'all 0.15s',
                  }}
                >
                  {isSubmitted ? '✅' : '📋'} {tpl.name}
                  {isSubmitted && (
                    <span style={{ fontSize: 10, background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: 999, fontWeight: 700 }}>
                      Submitted
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active template fill form */}
          {activeTemplate && (() => {
            const cols  = enabledCols(activeTemplate);
            const rows  = activeTemplate.rowCount || 3;
            const isSubmitted = activeTemplate.status === 'submitted';
            const { filled, total } = filledCount(activeTemplate);

            return (
              <div className="u-card" style={{ marginBottom: 20 }}>
                {/* Card header */}
                <div className="u-card-header" style={{ marginBottom: 0 }}>
                  <div>
                    <div className="u-card-title">{activeTemplate.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                      Assigned on {activeTemplate.assignedAt
                        ? new Date(activeTemplate.assignedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                        : 'N/A'}
                      &nbsp;·&nbsp; Priority:&nbsp;
                      <span style={{ fontWeight: 600, color: activeTemplate.priority === 'High' ? '#B91C1C' : activeTemplate.priority === 'Medium' ? '#92400E' : '#15803D' }}>
                        {activeTemplate.priority || 'Medium'}
                      </span>
                    </div>
                  </div>
                  {isSubmitted ? (
                    <span className="u-badge u-badge-done" style={{ fontSize: 13 }}>✅ Submitted</span>
                  ) : (
                    <span style={{ fontSize: 13, color: '#64748B' }}>
                      {filled}/{total} fields filled
                    </span>
                  )}
                </div>

                {/* Already submitted notice */}
                {isSubmitted && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '12px 16px', margin: '16px 20px 0', fontSize: 13, color: '#15803D', fontWeight: 600 }}>
                    ✅ You have already submitted this form. The admin is reviewing your responses.
                  </div>
                )}

                {/* The fillable table */}
                <div className="u-table-wrap" style={{ marginTop: 16 }}>
                  <table className="u-table">
                    <thead>
                      <tr>
                        <th style={{ width: 48 }}>#</th>
                        {cols.map(col => <th key={col.id}>{col.name.toUpperCase()}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: rows }).map((_, ri) => (
                        <tr key={ri}>
                          <td style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700 }}>
                            {String(ri + 1).padStart(2, '0')}
                          </td>
                          {cols.map(col => (
                            <td key={col.id}>
                              {col.type === 'Date' ? (
                                <input
                                  type="date"
                                  className="u-remark-input"
                                  value={getAnswer(activeTemplate.templateId, ri, col.id)}
                                  onChange={e => setAnswer(activeTemplate.templateId, ri, col.id, e.target.value)}
                                  disabled={isSubmitted}
                                  style={{ minWidth: 130 }}
                                />
                              ) : col.type === 'Number' ? (
                                <input
                                  type="number"
                                  className="u-remark-input"
                                  placeholder="0"
                                  value={getAnswer(activeTemplate.templateId, ri, col.id)}
                                  onChange={e => setAnswer(activeTemplate.templateId, ri, col.id, e.target.value)}
                                  disabled={isSubmitted}
                                  style={{ minWidth: 90 }}
                                />
                              ) : col.type === 'Label' ? (
                                <select
                                  className="u-remark-input"
                                  value={getAnswer(activeTemplate.templateId, ri, col.id)}
                                  onChange={e => setAnswer(activeTemplate.templateId, ri, col.id, e.target.value)}
                                  disabled={isSubmitted}
                                  style={{ minWidth: 120 }}
                                >
                                  <option value="">— Select —</option>
                                  <option>Pending</option>
                                  <option>In Progress</option>
                                  <option>Completed</option>
                                  <option>Blocked</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  className="u-remark-input"
                                  placeholder={`Enter ${col.name}…`}
                                  value={getAnswer(activeTemplate.templateId, ri, col.id)}
                                  onChange={e => setAnswer(activeTemplate.templateId, ri, col.id, e.target.value)}
                                  disabled={isSubmitted}
                                  style={{ minWidth: 160 }}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submit bar */}
                {!isSubmitted && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 4px', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: 13, color: '#475569' }}>
                      <strong style={{ color: '#0F172A' }}>{filled}</strong> of <strong style={{ color: '#0F172A' }}>{total}</strong> fields filled
                      {filled < total && (
                        <span style={{ color: '#B45309', marginLeft: 8 }}>— {total - filled} remaining</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        className="u-btn u-btn-outline"
                        onClick={() => setAnswers(prev => ({ ...prev, [activeTemplate.templateId]: {} }))}
                      >
                        🔄 Clear
                      </button>
                      <button
                        className="u-btn u-btn-green"
                        onClick={() => setConfirmTpl(activeTemplate)}
                        disabled={submitting}
                      >
                        📤 Submit to Admin
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </UserLayout>
  );
}
