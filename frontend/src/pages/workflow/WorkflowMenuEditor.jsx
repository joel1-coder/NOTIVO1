import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import WorkflowLayout from './WorkflowLayout';

const WorkflowMenuEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [menu, setMenu] = useState({
    title: '',
    restaurantName: '',
    items: []
  });
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      const fetchMenu = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/menus/${id}`);
          setMenu(res.data.data);
        } catch (err) {
          console.error('Error fetching menu:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchMenu();
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    setMenu({ ...menu, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, e) => {
    const newItems = [...menu.items];
    newItems[index][e.target.name] = e.target.value;
    setMenu({ ...menu, items: newItems });
  };

  const addItem = () => {
    setMenu({
      ...menu,
      items: [...menu.items, { name: '', description: '', price: 0, category: 'Main Course', image: '', isAvailable: true }]
    });
  };

  const removeItem = (index) => {
    const newItems = menu.items.filter((_, i) => i !== index);
    setMenu({ ...menu, items: newItems });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        await axios.post('http://localhost:5000/api/menus', menu);
      } else {
        await axios.put(`http://localhost:5000/api/menus/${id}`, menu);
      }
      navigate('/menu-management');
    } catch (err) {
      alert('Error saving menu: ' + err.message);
    }
  };

  if (loading) return <WorkflowLayout><p>Loading...</p></WorkflowLayout>;

  return (
    <WorkflowLayout>
      <div className="wf-page-header">
        <div>
          <h1 className="wf-page-title">{isNew ? 'Create New Menu' : 'Edit Menu'}</h1>
          <p className="wf-page-sub">Configure your digital menu items and pricing.</p>
        </div>
        <div className="wf-header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/menu-management')}>Cancel</button>
          <button className="btn btn-blue" onClick={handleSave}>Save Menu</button>
        </div>
      </div>

      <div className="wf-card mb-24">
        <h3 style={{ marginBottom: '20px', fontWeight: '600' }}>General Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={styles.label}>Restaurant Name</label>
            <input 
              name="restaurantName" 
              value={menu.restaurantName} 
              onChange={handleChange} 
              style={styles.input} 
              placeholder="e.g. The Royal Canteen"
            />
          </div>
          <div>
            <label style={styles.label}>Menu Title</label>
            <input 
              name="title" 
              value={menu.title} 
              onChange={handleChange} 
              style={styles.input} 
              placeholder="e.g. Lunch Specials"
            />
          </div>
        </div>
      </div>

      <div className="wf-page-header" style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Menu Items</h2>
        <button className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {menu.items.map((item, index) => (
          <div key={index} className="wf-card" style={{ position: 'relative' }}>
            <button 
              onClick={() => removeItem(index)} 
              style={styles.deleteBtn}
              title="Remove Item"
            >✕</button>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={styles.label}>Item Name</label>
                <input 
                  name="name" 
                  value={item.name} 
                  onChange={(e) => handleItemChange(index, e)} 
                  style={styles.input} 
                />
              </div>
              <div>
                <label style={styles.label}>Price ($)</label>
                <input 
                  name="price" 
                  type="number"
                  value={item.price} 
                  onChange={(e) => handleItemChange(index, e)} 
                  style={styles.input} 
                />
              </div>
              <div>
                <label style={styles.label}>Category</label>
                <select 
                  name="category" 
                  value={item.category} 
                  onChange={(e) => handleItemChange(index, e)} 
                  style={styles.input}
                >
                  <option>Starters</option>
                  <option>Main Course</option>
                  <option>Desserts</option>
                  <option>Drinks</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
              <div>
                <label style={styles.label}>Description</label>
                <textarea 
                  name="description" 
                  value={item.description} 
                  onChange={(e) => handleItemChange(index, e)} 
                  style={{...styles.input, height: '60px'}} 
                />
              </div>
              <div>
                <label style={styles.label}>Image URL</label>
                <input 
                  name="image" 
                  value={item.image} 
                  onChange={(e) => handleItemChange(index, e)} 
                  style={styles.input} 
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
          </div>
        ))}
        
        {menu.items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #1e293b', borderRadius: '15px', color: '#64748b' }}>
            No items added yet. Click "+ Add Item" to start building your menu.
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', textAlign: 'right' }}>
        <button className="btn btn-blue" onClick={handleSave} style={{ padding: '12px 30px' }}>Save Changes</button>
      </div>
    </WorkflowLayout>
  );
};

const styles = {
  label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' },
  input: { 
    width: '100%', padding: '10px 15px', borderRadius: '8px', 
    backgroundColor: '#0f172a', border: '1px solid #1e293b', color: 'white',
    fontSize: '0.95rem'
  },
  deleteBtn: {
    position: 'absolute', top: '15px', right: '15px', 
    backgroundColor: 'transparent', border: 'none', color: '#ef4444', 
    fontSize: '1.2rem', cursor: 'pointer', padding: '5px'
  }
};

export default WorkflowMenuEditor;
