import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WorkflowLayout from './WorkflowLayout';
import { taskAPI } from '../../services/api';
import './workflow.css';

export default function WorkflowTaskDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('id');
  
  const [task, setTask] = useState(null);
  const [notes, setNotes] = useState('');
  const [approved, setApproved] = useState(null); // null | 'approved' | 'rejected'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        if (taskId) {
          const data = await taskAPI.getTaskById(taskId);
          setTask(data.data);
        } else {
          // Use mock task data
          setTask({
            id: 'T-1092',
            title: 'Quarterly Security Infrastructure Audit',
            description: 'Complete a comprehensive review of all cloud-based security protocols for the Q4 reporting period. This includes identity access management (IAM) roles, VPC flow logs, and encryption-at-rest validation across all production environments.',
            status: 'IN PROGRESS',
            priority: 'HIGH',
            dueDate: 'Dec 15, 2023',
            assignedTo: 'Marcus Sterling',
            auditRefId: 'AUD-Q4-2023-X92',
            complianceStatus: 'Compliant',
            encryptionType: 'AES-256 (GCM Mode)',
            dataRetention: 'Passed (7 Year Policy Active)',
          });
        }
      } catch (err) {
        console.error('Error loading task:', err);
        // Fallback to mock data
        setTask({
          id: 'T-1092',
          title: 'Quarterly Security Infrastructure Audit',
          description: 'Complete a comprehensive review of all cloud-based security protocols for the Q4 reporting period.',
          status: 'IN PROGRESS',
          priority: 'HIGH',
          dueDate: 'Dec 15, 2023',
          assignedTo: 'Marcus Sterling',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const handleApprove = async () => {
    setApproved('approved');
    if (taskId) {
      try {
        await taskAPI.updateTask(taskId, { status: 'COMPLETED', notes });
      } catch (err) {
        console.error('Error approving task:', err);
      }
    }
  };

  const handleReject = async () => {
    setApproved('rejected');
    if (taskId) {
      try {
        await taskAPI.updateTask(taskId, { status: 'REJECTED', notes });
      } catch (err) {
        console.error('Error rejecting task:', err);
      }
    }
  };

  return (
    <WorkflowLayout>
      {loading ? (
        <div className="wf-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 14, color: '#64748B' }}>Loading task details...</div>
        </div>
      ) : !task ? (
        <div className="wf-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 14, color: '#B91C1C' }}>Task not found</div>
          <button className="btn btn-blue" style={{ marginTop: 16 }} onClick={() => navigate('/tasks')}>Back to Tasks</button>
        </div>
      ) : (
        <>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', marginBottom: 20 }}>
        <button className="wf-link" onClick={() => navigate('/tasks')}>Task Management</button>
        <span>/</span>
        <span style={{ color: '#0F172A', fontWeight: 500 }}>Task Detail: {task.id}</span>
      </div>

      {/* Title Row */}
      <div className="wf-page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${task.status === 'IN PROGRESS' ? 'badge-blue' : task.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}`}>{task.status}</span>
            <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
              Due {task.dueDate}
            </span>
            <span style={{ background: task.priority === 'HIGH' ? '#FEF2F2' : '#FEF9C3', color: task.priority === 'HIGH' ? '#EF4444' : '#92400E', fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 5 }}>🚩 {task.priority} Priority</span>
          </div>
        </div>
        <div className="wf-header-actions">
          <button className="btn btn-outline">⇌ Share</button>
          <button className="btn btn-blue">✎ Edit Task</button>
        </div>
      </div>

      <div className="wf-task-detail-grid">
        {/* LEFT COLUMN */}
        <div>
          {/* Description */}
          <div className="wf-card mb-16">
            <div className="wf-section-title">Description</div>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
              {task.description}
            </p>

            {/* Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Assigned To</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{task.assignedTo}</div>
                </div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📅</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Due Date</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{task.dueDate}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Data */}
          <div className="wf-card">
            <div className="wf-flex-between mb-16">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <div className="wf-section-title" style={{ marginBottom: 0 }}>Submitted Audit Data</div>
              </div>
              <span className="badge badge-green" style={{ fontSize: 10 }}>✓ VERIFIED</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {[
                { label: 'AUDIT REFERENCE ID', val: 'AUD-Q4-2023-X92' },
                { label: 'ACCESS CONTROL STATUS', val: '✅ Compliant', color: '#16A34A' },
                { label: 'ENCRYPTION TYPE', val: 'AES-256 (GCM Mode)' },
                { label: 'DATA RETENTION COMPLIANCE', val: 'Passed (7 Year Policy Active)' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: item.color || '#0F172A' }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Internal Summary */}
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Auditor's Internal Summary</div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
                "All systems checked within the us-east-1 and us-west-2 regions. Initial friction with VPC flow logs was resolved by updating the service role permissions. All primary database clusters are currently running with enforced encryption at the storage layer. No critical vulnerabilities detected."
              </p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr 1.6fr', gap: 10 }}>
              <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1D4ED8' }}>-1.2d</div>
                <div style={{ fontSize: 10, color: '#3B82F6', fontWeight: 600, marginTop: 2 }}>AVG. CYCLE TIME</div>
              </div>
              <div style={{ background: '#FEF9C3', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#92400E' }}>0</div>
                <div style={{ fontSize: 10, color: '#CA8A04', fontWeight: 600, marginTop: 2 }}>BLOCKING ISSUES</div>
              </div>
              <div style={{ background: '#2563EB', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>100%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 2 }}>COMPLIANCE RATE</div>
              </div>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Infrastructure Map</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>VIEW REAL-TIME</div>
                </div>
                <div style={{ position: 'absolute', right: -10, top: -10, width: 60, height: 60, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Review Action */}
          <div className="wf-card">
            <div className="wf-section-title">Review Action</div>
            {approved && (
              <div style={{ background: approved === 'approved' ? '#DCFCE7' : '#FEE2E2', color: approved === 'approved' ? '#166534' : '#B91C1C', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
                Task {approved === 'approved' ? '✓ Approved' : '✕ Rejected'} successfully.
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Decision Notes</label>
              <textarea
                className="wf-input"
                rows={3}
                placeholder="Provide context for your decision..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <button className="btn btn-green" onClick={handleApprove} style={{ justifyContent: 'center' }}>✓ Approve</button>
              <button className="btn btn-danger" onClick={handleReject} style={{ justifyContent: 'center' }}>✕ Reject</button>
            </div>
            <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', margin: 0 }}>
              Decisions are logged and cannot be undone without admin intervention.
            </p>
          </div>

          {/* Attachments */}
          <div className="wf-card">
            <div className="wf-flex-between mb-12">
              <div className="wf-section-title" style={{ marginBottom: 0 }}>Attachments</div>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>3 FILES</span>
            </div>
            {[
              { name: 'Security_Log_Q4.pdf', size: '2.4 MB', icon: '📄' },
              { name: 'Cloud_Topology_Map.png', size: '845 KB', icon: '🖼️' },
            ].map(f => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #F1F5F9', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{f.size}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" title="Download">↓</button>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="wf-card">
            <div className="wf-section-title">Recent Activity</div>
            {[
              { dot: '#DBEAFE', user: 'Marcus Sterling', action: 'submitted the task for review.', time: '2 hours ago' },
              { dot: '#E0E7FF', user: 'Marcus Sterling', action: 'updated attachment Security_Log_Q4.pdf.', time: 'Yesterday, 4:15 PM' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>👤</div>
                <div>
                  <div style={{ fontSize: 13, color: '#334155' }}><span style={{ fontWeight: 600 }}>{a.user}</span> {a.action}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </WorkflowLayout>
  );
}
