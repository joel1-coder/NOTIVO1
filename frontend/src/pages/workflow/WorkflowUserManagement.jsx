import React, { useState, useEffect } from 'react';
import WorkflowLayout from './WorkflowLayout';
import { userAPI } from '../../services/api';
import './workflow.css';

const INITIAL_USERS = [
  { id: '1', name: 'Jordan Smith',   email: 'jordan.smith@workflow.admin',  role: 'ADMIN', status: 'Active',   initials: 'JS', bg: '#DBEAFE', color: '#1D4ED8' },
  { id: '2', name: 'Amara Miller',   email: 'amara.m@workflow.admin',        role: 'MOD',   status: 'Active',   initials: 'AM', bg: '#F3E8FF', color: '#7C3AED' },
  { id: '3', name: 'David Wright',   email: 'david.wright@workflow.admin',   role: 'USER',  status: 'Offline',  initials: 'DW', bg: '#F1F5F9', color: '#475569' },
  { id: '4', name: 'Elena Lopez',    email: 'elena.l@workflow.admin',        role: 'USER',  status: 'Active',   initials: 'EL', bg: '#ECFDF5', color: '#059669' },
];

const ROLE_BADGE = { ADMIN: 'badge badge-blue', MOD: 'badge badge-purple', USER: 'badge badge-gray' };

export default function WorkflowUserManagement() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [form, setForm]         = useState({ name: '', email: '', role: 'User (Standard Access)' });
  const [formMsg, setFormMsg]   = useState('');
  const [search, setSearch]     = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  
  // Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm]       = useState({ name: '', email: '', role: '', status: '' });

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      // Fallback to localStorage first
      const localUsersRaw = localStorage.getItem('wf_local_users');
      let loadedUsers = localUsersRaw ? JSON.parse(localUsersRaw) : INITIAL_USERS;
      
      try {
        const data = await userAPI.getAllUsers();
        if (data && data.data && data.data.length > 0) {
           const mappedUsers = data.data.map(u => ({
             ...u,
             id: u._id || u.id,
             initials: (u.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
             bg: '#DBEAFE',
             color: '#1D4ED8',
           }));
           loadedUsers = mappedUsers;
           localStorage.setItem('wf_local_users', JSON.stringify(loadedUsers));
        }
      } catch (err) {
        console.warn('API fetch failed, using local users');
      } finally {
        setUsers(loadedUsers);
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { 
      setFormMsg('error'); 
      return; 
    }
    
    const initials = form.name.trim().split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const newUser = {
      id: Math.random().toString(36).substring(2, 9),
      name: form.name,
      email: form.email,
      role: form.role.includes('Admin') ? 'ADMIN' : form.role.includes('Mod') ? 'MOD' : 'USER',
      status: 'Active',
      initials,
      bg: '#EFF6FF',
      color: '#2563EB',
    };
    
    try {
      const response = await userAPI.createUser(newUser);
      if (response && response.success) {
         newUser.id = response.data._id || newUser.id;
      }
    } catch (err) {
      console.warn('Backend unavailable, saving locally only.');
    }

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('wf_local_users', JSON.stringify(updatedUsers));
    
    setForm({ name: '', email: '', role: 'User (Standard Access)' });
    setFormMsg('success');
    setTimeout(() => setFormMsg(''), 3000);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'Administrator' : user.role === 'MOD' ? 'Moderator' : 'User (Standard Access)',
      status: user.status
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    const mappedRole = editForm.role.includes('Admin') ? 'ADMIN' : editForm.role.includes('Mod') ? 'MOD' : 'USER';
    const updatedUser = {
      ...editingUser,
      name: editForm.name,
      email: editForm.email,
      role: mappedRole,
      status: editForm.status,
      initials: editForm.name.trim().split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    };

    try {
      await userAPI.updateUser(editingUser.id, updatedUser);
    } catch (err) {
      console.warn('Backend unavailable, updating locally only.');
    }

    const updatedUsersList = users.map(u => u.id === editingUser.id ? updatedUser : u);
    setUsers(updatedUsersList);
    localStorage.setItem('wf_local_users', JSON.stringify(updatedUsersList));
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    try {
      await userAPI.deleteUser(id);
    } catch (err) {
      console.warn('Backend unavailable, deleting locally only.');
    }
    const updatedUsersList = users.filter(u => u.id !== id);
    setUsers(updatedUsersList);
    localStorage.setItem('wf_local_users', JSON.stringify(updatedUsersList));
    setShowConfirm(null);
  };

  const totalActive  = users.filter(u => u.status === 'Active').length;
  const totalAdmins  = users.filter(u => u.role === 'ADMIN').length;
  const totalMods    = users.filter(u => u.role === 'MOD').length;
  const totalUsers   = users.filter(u => u.role === 'USER').length;

  return (
    <WorkflowLayout active="users">
      {/* Delete Confirm Modal */}
      {showConfirm && (
        <div className="wf-modal-overlay" onClick={() => setShowConfirm(null)}>
          <div className="wf-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Confirm Delete</div>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>
              Are you sure you want to remove <strong>{users.find(u => u.id === showConfirm)?.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(showConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="wf-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="wf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Edit User</div>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="wf-input-group" style={{ marginBottom: 0 }}>
                <label>Full Name</label>
                <input className="wf-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              <div className="wf-input-group" style={{ marginBottom: 0 }}>
                <label>Email Address</label>
                <input type="email" className="wf-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
              </div>
              <div className="wf-input-group" style={{ marginBottom: 0 }}>
                <label>Role</label>
                <select className="wf-input" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                  <option>User (Standard Access)</option>
                  <option>Moderator</option>
                  <option>Administrator</option>
                </select>
              </div>
              <div className="wf-input-group" style={{ marginBottom: 0 }}>
                <label>Status</label>
                <select className="wf-input" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                  <option>Active</option>
                  <option>Offline</option>
                  <option>Suspended</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-blue">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="wf-page-header">
        <div>
          <div className="wf-page-title">User Management</div>
          <div className="wf-page-sub">Manage organization members, assign roles, and control access permissions.</div>
        </div>
        <button className="btn btn-blue" onClick={() => document.getElementById('create-user-section').scrollIntoView({ behavior: 'smooth' })}>👤+ Add User</button>
      </div>

      {/* Stats Row */}
      <div className="wf-grid-4 mb-24">
        <div className="wf-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>TOTAL USERS</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>{users.length}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4 }}>+12%</span>
          </div>
        </div>
        <div className="wf-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>ACTIVE NOW</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>{totalActive}</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>Across 4 zones</span>
          </div>
        </div>
        <div className="wf-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>ROLE DISTRIBUTION</div>
          <div className="wf-role-bar">
            <div style={{ background: '#2563EB', width: users.length ? `${(totalAdmins/users.length)*100}%` : '0%', minWidth: 8 }} />
            <div style={{ background: '#8B5CF6', width: users.length ? `${(totalMods/users.length)*100}%` : '0%', minWidth: 8 }} />
            <div style={{ background: '#CBD5E1', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#64748B', fontWeight: 600 }}>
            <span>{users.length ? Math.round((totalAdmins/users.length)*100) : 0}% ADM</span>
            <span>{users.length ? Math.round((totalMods/users.length)*100) : 0}% MOD</span>
            <span>{users.length ? Math.round((totalUsers/users.length)*100) : 0}% USR</span>
          </div>
        </div>
        <div className="wf-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>PENDING INVITES</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>18</span>
            <button className="wf-link" style={{ fontSize: 12 }}>View all</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="wf-card p-0 mb-24" style={{ overflow: 'hidden' }}>
        <div className="wf-toolbar">
          <div className="wf-search-box" style={{ width: 260 }}>
            <svg width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-ghost btn-sm">▽ Filter</button>
          <button className="btn btn-ghost btn-sm">⇅ Sort</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B' }}>Showing 1–{filteredUsers.length} of {users.length} users</span>
        </div>

        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.bg, color: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{u.initials}</div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontSize: 13 }}>{u.email}</td>
                  <td><span className={ROLE_BADGE[u.role] || ROLE_BADGE['USER']} style={{ letterSpacing: '0.04em', fontSize: 11 }}>{u.role}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: u.status === 'Active' ? '#16A34A' : '#94A3B8' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.status === 'Active' ? '#22C55E' : '#CBD5E1', display: 'inline-block' }} />
                      {u.status}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => handleEditClick(u)}>✎</button>
                    <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: '#EF4444' }} onClick={() => setShowConfirm(u.id)}>🗑</button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid #F1F5F9' }}>
          <button className="btn btn-ghost btn-sm">Previous</button>
          {[1,2,3,'…',128].map((p,i) => (
            <button key={i} className={`wf-page-btn ${p === page ? 'active' : ''}`} onClick={() => typeof p === 'number' && setPage(p)}>{p}</button>
          ))}
          <button className="btn btn-blue btn-sm">Next</button>
        </div>
      </div>

      {/* Create New Member */}
      <div id="create-user-section" className="wf-card">
        <div className="wf-section-title">Create New Member</div>
        {formMsg === 'success' && <div style={{ background: '#DCFCE7', color: '#166534', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>✓ Account created successfully!</div>}
        {formMsg === 'error' && <div style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>⚠ Please fill in all required fields.</div>}
        <form onSubmit={handleCreate}>
          <div className="wf-grid-2 mb-16">
            <div className="wf-input-group" style={{ marginBottom: 0 }}>
              <label>Full Name</label>
              <input className="wf-input" placeholder="e.g. Sarah Jenkins" value={form.name} onChange={e => setF('name', e.target.value)} />
            </div>
            <div className="wf-input-group" style={{ marginBottom: 0 }}>
              <label>Email Address</label>
              <input type="email" className="wf-input" placeholder="sarah.j@company.com" value={form.email} onChange={e => setF('email', e.target.value)} />
            </div>
          </div>
          <div className="wf-input-group mb-24">
            <label>Organizational Role</label>
            <select className="wf-input" style={{ width: '50%' }} value={form.role} onChange={e => setF('role', e.target.value)}>
              <option>User (Standard Access)</option>
              <option>Moderator</option>
              <option>Administrator</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-blue">Create Account</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm({ name: '', email: '', role: 'User (Standard Access)' })}>Reset Form</button>
          </div>
        </form>
      </div>
    </WorkflowLayout>
  );
}
