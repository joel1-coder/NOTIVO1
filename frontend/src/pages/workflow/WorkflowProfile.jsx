import React, { useState } from 'react';
import WorkflowLayout from './WorkflowLayout';
import './workflow.css';

export default function WorkflowProfile() {
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser')) || {
        name: 'Alex Sterling',
        email: 'alex.sterling@workflow.admin',
        role: 'System Architect'
      };
    } catch {
      return { name: 'Alex Sterling', email: 'alex.sterling@workflow.admin', role: 'System Architect' };
    }
  });

  const [form, setForm] = useState({ name: admin.name || '', email: admin.email || '', role: admin.role || '' });
  const [toast, setToast] = useState('');

  const initials = (form.name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleSave = (e) => {
    e.preventDefault();
    const updated = { ...admin, name: form.name, email: form.email, role: form.role };
    localStorage.setItem('currentUser', JSON.stringify(updated));
    setAdmin(updated);
    
    setToast('Profile updated successfully!');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <WorkflowLayout active="profile">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#10B981', color: 'white', padding: '12px 20px', borderRadius: 8, zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast}
        </div>
      )}

      <div className="wf-page-header">
        <div>
          <h1 className="wf-page-title">Admin Profile</h1>
          <p className="wf-page-sub">Manage your personal information and system credentials.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Side: Avatar Card */}
        <div className="wf-card" style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#4F46E5', color: '#fff', fontSize: 28, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            {initials}
          </div>
          <h2 style={{ fontSize: 18, color: '#111827', margin: 0 }}>{admin.name}</h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{admin.email}</p>
          <span style={{ display: 'inline-block', marginTop: 12, background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
            {admin.role}
          </span>
        </div>

        {/* Right Side: Edit Form */}
        <div className="wf-card">
          <div className="wf-card-header">
            <h2 className="wf-card-title">Edit Details</h2>
          </div>
          <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase' }}>Full Name</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})}
                style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#4F46E5'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase' }}>Email Address</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})}
                style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#4F46E5'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase' }}>System Role</label>
              <input 
                type="text" 
                value={form.role} 
                onChange={e => setForm({...form, role: e.target.value})}
                style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#4F46E5'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <button type="submit" className="wf-btn-primary">Save Profile Changes</button>
            </div>
          </form>
        </div>

      </div>
    </WorkflowLayout>
  );
}
