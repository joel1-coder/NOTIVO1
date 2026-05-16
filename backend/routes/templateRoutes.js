import express from 'express';
import Template from '../models/Template.js';

const router = express.Router();

// Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find().populate('author', 'name email');
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new template
router.post('/', async (req, res) => {
  try {
    const newTemplate = new Template(req.body);
    await newTemplate.save();
    res.status(201).json({ success: true, data: newTemplate });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const updatedTemplate = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
