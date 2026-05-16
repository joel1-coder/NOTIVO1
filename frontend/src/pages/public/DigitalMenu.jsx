import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const DigitalMenu = () => {
  const { id } = useParams();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
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
    if (id) fetchMenu();
  }, [id]);

  if (loading) return <div style={styles.loading}>Loading Menu...</div>;
  if (!menu) return <div style={styles.error}>Menu not found or invalid QR code.</div>;

  const categories = ['All', ...new Set(menu.items.map(item => item.category))];
  const filteredItems = activeCategory === 'All' 
    ? menu.items 
    : menu.items.filter(item => item.category === activeCategory);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.restaurantName}>{menu.restaurantName}</h1>
        <p style={styles.menuTitle}>{menu.title}</p>
      </header>

      <nav style={styles.categoryNav}>
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            style={{
              ...styles.catBtn,
              ...(activeCategory === cat ? styles.catBtnActive : {})
            }}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main style={styles.itemList}>
        {filteredItems.map(item => (
          <div key={item._id} style={styles.itemCard}>
            <div style={styles.itemInfo}>
              <h3 style={styles.itemName}>{item.name}</h3>
              <p style={styles.itemDesc}>{item.description}</p>
              <span style={styles.itemPrice}>${item.price.toFixed(2)}</span>
            </div>
            {item.image && <img src={item.image} alt={item.name} style={styles.itemImg} />}
          </div>
        ))}
      </main>

      <footer style={styles.footer}>
        <p>© 2024 {menu.restaurantName} - Digital Menu powered by Notivo</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: "'Outfit', sans-serif",
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#38bdf8' },
  error: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#ef4444' },
  header: { textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' },
  restaurantName: { fontSize: '2rem', fontWeight: '800', color: '#38bdf8', marginBottom: '5px' },
  menuTitle: { fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' },
  categoryNav: { display: 'flex', overflowX: 'auto', gap: '10px', marginBottom: '30px', paddingBottom: '10px' },
  catBtn: { 
    padding: '8px 16px', borderRadius: '20px', border: '1px solid #1e293b', 
    backgroundColor: '#1e293b', color: '#94a3b8', cursor: 'pointer', whiteSpace: 'nowrap' 
  },
  catBtnActive: { backgroundColor: '#38bdf8', color: '#0f172a', borderColor: '#38bdf8', fontWeight: 'bold' },
  itemList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  itemCard: { 
    backgroundColor: '#1e293b', borderRadius: '15px', padding: '15px', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  itemInfo: { flex: 1, paddingRight: '15px' },
  itemName: { fontSize: '1.2rem', fontWeight: '600', marginBottom: '5px' },
  itemDesc: { fontSize: '0.9rem', color: '#94a3b8', marginBottom: '10px', lineHeight: '1.4' },
  itemPrice: { fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8' },
  itemImg: { width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' },
  footer: { marginTop: '50px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }
};

export default DigitalMenu;
