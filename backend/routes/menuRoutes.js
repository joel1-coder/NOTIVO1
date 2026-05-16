import express from 'express';
import Menu from '../models/Menu.js';

const router = express.Router();

// Get all menus (Admin)
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.find();
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get menu by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create menu (Admin)
router.post('/', async (req, res) => {
  try {
    const newMenu = new Menu(req.body);
    await newMenu.save();
    res.status(201).json({ success: true, data: newMenu });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update menu (Admin)
router.put('/:id', async (req, res) => {
  try {
    const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMenu) return res.status(404).json({ success: false, message: 'Menu not found' });
    res.json({ success: true, data: updatedMenu });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete menu (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const deletedMenu = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedMenu) return res.status(404).json({ success: false, message: 'Menu not found' });
    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seed a dummy menu for demonstration
router.post('/seed', async (req, res) => {
  try {
    const dummyMenu = new Menu({
      title: 'Today\'s Special Menu',
      restaurantName: 'The Royal Canteen',
      items: [
        { name: 'Classic Burger', description: 'Juicy beef patty with cheese', price: 12.99, category: 'Main Course' },
        { name: 'Caesar Salad', description: 'Fresh lettuce with parmesan', price: 8.50, category: 'Starters' },
        { name: 'Iced Latte', description: 'Chilled coffee with milk', price: 4.50, category: 'Drinks' },
        { name: 'Grilled Salmon', description: 'Lemon butter Atlantic salmon', price: 18.00, category: 'Main Course' },
        { name: 'Garlic Bread', description: 'Toasted with herb butter', price: 5.00, category: 'Starters' }
      ]
    });
    await dummyMenu.save();
    res.status(201).json({ success: true, data: dummyMenu });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
