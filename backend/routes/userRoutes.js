import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Mock Auth Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check default admin first (works without MongoDB)
    if (email === 'admin@notivo1.com' && password === 'admin123') {
      return res.json({ 
        success: true, 
        message: 'Admin Login successful', 
        token: 'mock-jwt-token-admin',
        user: { email: 'admin@notivo1.com', name: 'Admin User', role: 'admin' }
      });
    }
    
    // Try to find user in database if available
    try {
      const user = await User.findOne({ email });
      if (user && user.password === password) {
        return res.json({ success: true, message: 'Login successful', token: 'mock-jwt-token', user });
      }
    } catch (dbError) {
      // Database not available, skip database check
      console.log('Database unavailable, using fallback login');
    }
    
    // If we get here, credentials didn't match
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
