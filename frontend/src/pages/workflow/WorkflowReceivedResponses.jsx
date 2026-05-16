import React, { useState, useEffect, useMemo } from 'react';
import WorkflowLayout from './WorkflowLayout';
import { submissionAPI, exportAPI } from '../../services/api';
import './workflow.css';

// ── Parse flat submission data into rows × columns ─────────────────────────
// Input:  { "Row 1 — Subject / Task": "x", "Row 1 — Due Date": "y", "Row 2 — …": … }
// Output: { cols: ["Subject / Task", "Due Date", …], rows: [[…], […], …] }
function parseFormData(data) {
  const rowMap = {};
  const colSet = new Set();
  Object.entries(data || {}).forEach(([key, val]) => {
    const match = key.match(/^Row (\d+) — (.+)$/);
    if (match) {
      const rn = parseInt(match[1]);
      const cn = match[2];
      colSet.add(cn);
      if (!rowMap[rn]) rowMap[rn] = {};
      rowMap[rn][cn] = val;
    }
  });
  const cols = Array.from(colSet);
  const rows = Object.keys(rowMap)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => ({ rowNum: Number(k), ...rowMap[k] }));
  return { cols, rows };
}

export default function WorkflowReceivedResponses() {
  const [responses, setResponses]         = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('All');

  // ── Load submissions: backend API + localStorage fallback ─────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Always pull local submissions saved when users submit from the portal
      const local = JSON.parse(localStorage.getItem('wf_local_submissions') || '[]');
      const normalizedLocal = local.map(s => ({
        id:          s.submissionId || s._id,
        user:        s._meta?.userName  || (typeof s.user === 'string' ? s.user : s.user?.name) || 'Unknown',
        email:       s._meta?.userEmail || '',
        template:    s._meta?.templateName || (typeof s.template === 'string' ? s.template : s.template?.name) || 'Timetable',
        submittedAt: s._meta?.submittedAt  || (s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'),
        status:      s.status || 'Pending',
        data:        s.data   || {},
      }));

      // Try to fetch from backend too
      try {
        const data  = await submissionAPI.getAllSubmissions();
        const apiItems = (data.data || []).map(item => ({
          id:          item._id || item.id,
          user:        typeof item.user === 'string' ? item.user : (item.user?.name || 'Unknown User'),
          email:       typeof item.user === 'object' ? item.user?.email : '',
          template:    typeof item.template === 'string' ? item.template : (item.template?.name || 'Unknown Template'),
          submittedAt: item.submittedAt
            ? new Date(item.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
            : 'N/A',
          status:      item.status || 'Pending',
          data:        item.data   || {},
        }));

        // Merge: local + api (avoid duplicates by id)
        const apiIds = new Set(apiItems.map(i => i.id));
        const merged = [
          ...apiItems,
          ...normalizedLocal.filter(l => !apiIds.has(l.id)),
        ];
        setResponses(merged.length > 0 ? merged : MOCK_DATA);
      } catch {
        // Backend down — show local + mock
        setError('Backend unavailable. Showing locally submitted data.');
        setResponses(normalizedLocal.length > 0 ? normalizedLocal : MOCK_DATA);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const MOCK_DATA = [
    { id: 'RES-001', user: 'Jordan Smith',  email: 'jordan.smith@workflow.admin', template: 'Q3 Time Table',               submittedAt: 'Oct 25, 2023 10:30 AM', status: 'Pending',  data: { 'Row 1 — Subject / Task': 'Algebra Review', 'Row 1 — Due Date': '2024-05-15', 'Row 1 — Priority': 'High' } },
    { id: 'RES-002', user: 'Amara Miller',  email: 'amara.m@workflow.admin',       template: 'Enterprise Migration Phase 1', submittedAt: 'Oct 24, 2023 04:15 PM', status: 'Reviewed', data: { 'Row 1 — Task': 'Server setup', 'Row 1 — Timeline': '3 months', 'Row 1 — Status': 'In Progress' } },
    { id: 'RES-003', user: 'David Wright',  email: 'david.wright@workflow.admin',  template: 'Security Audit Q3',           submittedAt: 'Oct 22, 2023 09:00 AM', status: 'Reviewed', data: { 'Row 1 — Check Item': 'Firewall rules', 'Row 1 — Result': 'Completed' } },
  ];

  // ── Status update ──────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    setResponses(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (selectedResponse?.id === id) setSelectedResponse(r => ({ ...r, status: newStatus }));

    // Also update local submissions store
    const local = JSON.parse(localStorage.getItem('wf_local_submissions') || '[]');
    localStorage.setItem('wf_local_submissions', JSON.stringify(
      local.map(s => (s.submissionId === id || s._id === id) ? { ...s, status: newStatus } : s)
    ));

    try { await submissionAPI.updateSubmission?.(id, { status: newStatus }); } catch (_) {}
  };

  // ── Exports ────────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const data = filtered.map(r => ({ ID: r.id, User: r.user, Template: r.template, 'Submitted At': r.submittedAt, Status: r.status }));
    exportAPI.exportToCSV(data, `Submissions_${new Date().toISOString().slice(0,10)}.csv`);
  };
  const exportToExcel = () => {
    const data = filtered.map(r => ({ ID: r.id, User: r.user, Template: r.template, 'Submitted At': r.submittedAt, Status: r.status }));
    exportAPI.exportToExcel(data, `Submissions_${new Date().toISOString().slice(0,10)}.xlsx`);
  };
  const exportToJSON = () => exportAPI.exportToJSON(filtered, `Submissions_${new Date().toISOString().slice(0,10)}.json`);

  // ── Export a single submission's form data (called from modal) ─────────────
  const exportModalAsExcel = (r) => {
    exportAPI.exportSubmissionAsExcel(
      r.data,
      { user: r.user, email: r.email, template: r.template, submittedAt: r.submittedAt, status: r.status },
      `Submission_${r.id}`
    );
  };
  const exportModalAsWord = (r) => {
    exportAPI.exportSubmissionAsWord(
      r.data,
      { user: r.user, email: r.email, template: r.template, submittedAt: r.submittedAt, status: r.status },
      `Submission_${r.id}`
    );
  };


  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = responses.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.user.toLowerCase().includes(q) || r.template.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countBy = (s) => responses.filter(r => r.status === s).length;

  const STATUS_CLASS = { Pending: 'badge badge-yellow', Reviewed: 'badge badge-green', Rejected: 'badge badge-red' };

  return (
    <WorkflowLayout>

      {/* Detail modal */}
      {selectedResponse && (() => {
        const { cols, rows } = parseFormData(selectedResponse.data);
        // Fallback: if data isn't in Row N — Col format, show raw key-value
        const isStructured = rows.length > 0;

        return (
        <div className="wf-modal-overlay" onClick={() => setSelectedResponse(null)}>
          <div className="wf-modal" style={{ maxWidth: 760, width: '95vw' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>📋 Submission Details</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748B' }} onClick={() => setSelectedResponse(null)}>✕</button>
            </div>

            {/* Meta */}
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, marginBottom: 20, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  ['Template',     selectedResponse.template],
                  ['Submitted By', selectedResponse.user],
                  ['Email',        selectedResponse.email || '—'],
                  ['Submitted At', selectedResponse.submittedAt],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 500 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Set Status:</span>
              {['Pending', 'Reviewed', 'Rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(selectedResponse.id, s)}
                  className={`btn btn-sm ${selectedResponse.status === s ? 'btn-blue' : 'btn-outline'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Filled Form Data — proper table */}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Filled Form Data</div>

            {isStructured ? (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px', background: '#1E40AF', color: '#fff', fontWeight: 700, textAlign: 'center', width: 44, borderRight: '1px solid #1d3a9f', fontSize: 12 }}>#</th>
                      {cols.map(col => (
                        <th key={col} style={{ padding: '10px 14px', background: '#1E40AF', color: '#fff', fontWeight: 700, borderRight: '1px solid #1d3a9f', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#94A3B8', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                          {String(row.rowNum).padStart(2, '0')}
                        </td>
                        {cols.map(col => (
                          <td key={col} style={{ padding: '10px 14px', color: '#0F172A', borderRight: '1px solid #F1F5F9', verticalAlign: 'top' }}>
                            {row[col] ?? <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Fallback: raw key-value for old unstructured submissions */
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <tbody>
                    {Object.entries(selectedResponse.data || {}).map(([key, value], i) => (
                      <tr key={key} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', width: '45%', borderRight: '1px solid #F1F5F9' }}>{key}</td>
                        <td style={{ padding: '10px 14px', color: '#0F172A' }}>{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer with export + close */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => exportModalAsWord(selectedResponse)}
              >
                📄 Export Word
              </button>
              <button
                className="btn btn-green btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => exportModalAsExcel(selectedResponse)}
              >
                📊 Export Excel
              </button>
              <button className="btn btn-outline" onClick={() => setSelectedResponse(null)}>Close</button>
            </div>

          </div>
        </div>
        );
      })()}


      {/* Page Header */}
      <div className="wf-page-header">
        <div>
          <div className="wf-page-title">Received Submissions</div>
          <div className="wf-page-sub">Review completed timetables and forms submitted by your users.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={exportToCSV}  disabled={loading || filtered.length === 0}>⬇ CSV</button>
          <button className="btn btn-outline btn-sm" onClick={exportToJSON}  disabled={loading || filtered.length === 0}>⬇ JSON</button>
          <button className="btn btn-green btn-sm"   onClick={exportToExcel} disabled={loading || filtered.length === 0}>⬇ Excel</button>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',    val: responses.length, color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Pending',  val: countBy('Pending'),  color: '#92400E', bg: '#FEF9C3' },
          { label: 'Reviewed', val: countBy('Reviewed'), color: '#15803D', bg: '#DCFCE7' },
          { label: 'Rejected', val: countBy('Rejected'), color: '#B91C1C', bg: '#FEE2E2' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ background: bg, color, padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
            {val} {label}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400E' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="wf-card p-0" style={{ overflow: 'hidden' }}>
        <div className="wf-toolbar">
          <div className="wf-search-box" style={{ width: 280 }}>
            <svg width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder="Search user, template, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="wf-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Reviewed</option>
            <option>Rejected</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B' }}>
            {filtered.length} of {responses.length} submission{responses.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>Loading submissions…</div>
        ) : (
          <table className="wf-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>SUBMITTED BY</th>
                <th>TEMPLATE / FORM</th>
                <th>SUBMITTED AT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{r.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{r.user}</div>
                    {r.email && <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.email}</div>}
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.template}</td>
                  <td style={{ fontSize: 13, color: '#475569' }}>{r.submittedAt}</td>
                  <td>
                    <span className={STATUS_CLASS[r.status] || 'badge badge-gray'}>{r.status}</span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#2563EB' }}
                      onClick={() => setSelectedResponse(r)}
                    >
                      View Data
                    </button>
                    {r.status === 'Pending' && (
                      <>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#15803D' }} onClick={() => handleStatusChange(r.id, 'Reviewed')}>✓ Review</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={() => handleStatusChange(r.id, 'Rejected')}>✕ Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>No submissions found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </WorkflowLayout>
  );
}
