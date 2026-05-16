import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WorkflowLayout from './WorkflowLayout';

const WorkflowMenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/menus');
        setMenus(res.data.data);
      } catch (err) {
        console.error('Error fetching menus:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const handleSeed = async () => {
    try {
      await axios.post('http://localhost:5000/api/menus/seed');
      const res = await axios.get('http://localhost:5000/api/menus');
      setMenus(res.data.data);
    } catch (err) {
      alert('Error seeding data');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu?')) {
      try {
        await axios.delete(`http://localhost:5000/api/menus/${id}`);
        setMenus(menus.filter(m => m._id !== id));
      } catch (err) {
        alert('Error deleting menu');
      }
    }
  };

  const showQR = (menuId) => {
    const publicUrl = `${window.location.origin}/public/menu/${menuId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;
    window.open(qrUrl, '_blank', 'width=500,height=500');
  };

  return (
    <WorkflowLayout>
      <div className="wf-page-header">
        <div>
          <h1 className="wf-page-title">Digital Menu Management</h1>
          <p className="wf-page-sub">Create and manage digital menus for QR code scanning.</p>
        </div>
        <div className="wf-header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={handleSeed}>Seed Demo</button>
          <button className="btn btn-blue" onClick={() => navigate('/menu-editor/new')}>+ Create Menu</button>
        </div>
      </div>

      <div className="wf-grid-3">
        {loading ? (
          <p>Loading menus...</p>
        ) : menus.length === 0 ? (
          <p>No menus found. Click "Seed Demo Menu" to start.</p>
        ) : (
          menus.map(menu => (
            <div key={menu._id} className="wf-card">
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px' }}>{menu.restaurantName}</h3>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>{menu.title}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-blue btn-sm" onClick={() => navigate(`/menu-editor/${menu._id}`)}>✎ Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => showQR(menu._id)}>📱 QR</button>
                <button className="btn btn-outline btn-sm" onClick={() => window.open(`/public/menu/${menu._id}`, '_blank')}>👁 View</button>
                <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(menu._id)}>🗑 Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </WorkflowLayout>
  );
};

export default WorkflowMenuManagement;
