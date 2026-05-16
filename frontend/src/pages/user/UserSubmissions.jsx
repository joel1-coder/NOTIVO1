import React, { useState, useEffect } from 'react';
import UserLayout from './UserLayout';
import { submissionAPI } from '../../services/api';
import './user.css';

// ── Parse flat submission data into rows × columns ──────────────────────────
// Input:  { "Row 1 — Subject / Task": "x", "Row 1 — Due Date": "y", … }
// Output: { cols: ["Subject / Task", …], rows: [{ rowNum:1, … }, …] }
function parseFormData(data) {
  const rowMap  = {};
  const colOrder = [];
  const colSeen  = new Set();

  Object.entries(data || {}).forEach(([key, val]) => {
    // Robust split — handles em dash (—), en dash (–), or plain hyphen
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

export default function UserSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
  })();

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Always check localStorage first
      const localRaw = JSON.parse(localStorage.getItem('wf_local_submissions') || '[]');
      const localMine = localRaw
        .filter(s => {
          const email = (s._meta?.userEmail || s.user || '').toLowerCase();
          return email === (currentUser.email || '').toLowerCase();
        })
        .map(s => ({
          id:          s.submissionId || s._id,
          user:        s._meta?.userName   || currentUser.name || 'You',
          template:    s._meta?.templateName || s.template || 'Timetable',
          submittedAt: s._meta?.submittedAt  || (s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'),
          status:      s.status || 'Pending',
          data:        s.data || {},
        }));

      // Also try API
      try {
        const res  = await submissionAPI.getAllSubmissions();
        const mine = (res.data || [])
          .filter(s => {
            const u = typeof s.user === 'object' ? s.user : {};
            return (u.email || '').toLowerCase() === (currentUser.email || '').toLowerCase() ||
                   (u.name  || '').toLowerCase().includes((currentUser.name || '').toLowerCase().split(' ')[0]);
          })
          .map(s => ({
            id:          s._id || s.id,
            user:        typeof s.user === 'object' ? s.user?.name : s.user,
            template:    typeof s.template === 'object' ? s.template?.name : s.template,
            submittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
            status:      s.status || 'Pending',
            data:        s.data   || {},
          }));

        // Merge (local first, then API items not already in local)
        const localIds = new Set(localMine.map(i => i.id));
        const merged   = [...localMine, ...mine.filter(m => !localIds.has(m.id))];
        setSubmissions(merged);
      } catch {
        setSubmissions(localMine);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATUS_CLASS = {
    Pending:  'u-badge u-badge-pending',
    Reviewed: 'u-badge u-badge-done',
    Rejected: 'u-badge u-badge-high',
  };

  return (
    <UserLayout>

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {selected && (() => {
        const { cols, rows } = parseFormData(selected.data);
        const isStructured   = rows.length > 0;

        return (
          <div className="u-modal-overlay" onClick={() => setSelected(null)}>
            <div
              className="u-modal"
              style={{ maxWidth: 740, width: '95vw' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="u-modal-title">📋 Submission Details</div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }}
                  onClick={() => setSelected(null)}
                >✕</button>
              </div>

              {/* Meta info */}
              <div style={{ background: '#F0FDF4', borderRadius: 9, padding: 14, marginBottom: 18, border: '1px solid #D1FAE5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[['Template', selected.template], ['Submitted', selected.submittedAt]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{v}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
                    <span className={STATUS_CLASS[selected.status] || 'u-badge u-badge-pending'}>{selected.status}</span>
                  </div>
                </div>
              </div>

              {/* Filled Form Data — proper table */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Your Submitted Data</div>

              {isStructured ? (
                <div style={{ border: '1px solid #D1FAE5', borderRadius: 8, overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{
                          padding: '10px 12px',
                          background: '#15803D',
                          color: '#fff',
                          fontWeight: 700,
                          textAlign: 'center',
                          width: 44,
                          borderRight: '1px solid #14692f',
                          fontSize: 12,
                        }}>#</th>
                        {cols.map(col => (
                          <th key={col} style={{
                            padding: '10px 14px',
                            background: '#15803D',
                            color: '#fff',
                            fontWeight: 700,
                            borderRight: '1px solid #14692f',
                            whiteSpace: 'nowrap',
                            fontSize: 12,
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr
                          key={i}
                          style={{ background: i % 2 === 0 ? '#fff' : '#F0FDF4', borderBottom: '1px solid #D1FAE5' }}
                        >
                          <td style={{
                            padding: '10px 12px',
                            fontWeight: 700,
                            color: '#94A3B8',
                            textAlign: 'center',
                            borderRight: '1px solid #D1FAE5',
                          }}>
                            {String(row.rowNum).padStart(2, '0')}
                          </td>
                          {cols.map(col => (
                            <td key={col} style={{
                              padding: '10px 14px',
                              color: '#0F172A',
                              borderRight: '1px solid #D1FAE5',
                              verticalAlign: 'top',
                            }}>
                              {row[col] ?? <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Fallback for unstructured data */
                <div style={{ border: '1px solid #D1FAE5', borderRadius: 8, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {Object.entries(selected.data || {}).map(([key, val], i) => (
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
                <button className="u-btn u-btn-green" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="u-page-header">
        <div>
          <div className="u-page-title">📄 My Submissions</div>
          <div className="u-page-sub">All timetables and forms you have submitted to the Admin.</div>
        </div>
        <span className="u-badge u-badge-done" style={{ fontSize: 13 }}>{submissions.length} Total</span>
      </div>

      {loading ? (
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
                    <td><span className={STATUS_CLASS[s.status] || 'u-badge u-badge-pending'}>{s.status}</span></td>
                    <td style={{ fontSize: 13, color: s.status === 'Reviewed' ? '#15803D' : s.status === 'Rejected' ? '#B91C1C' : '#94A3B8' }}>
                      {s.status === 'Reviewed' ? '✅ Reviewed by Admin' : s.status === 'Rejected' ? '❌ Rejected' : '⏳ Awaiting review'}
                    </td>
                    <td>
                      <button className="u-btn u-btn-outline u-btn-sm" onClick={() => setSelected(s)}>👁 View</button>
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
