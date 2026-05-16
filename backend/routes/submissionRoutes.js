import express from 'express';
import Submission from '../models/Submission.js';

const router = express.Router();

// Mock data for submissions (fallback when DB is unavailable)
const mockSubmissions = [
  {
    _id: 'sub-001',
    user: { _id: 'user-1', name: 'Jordan Smith', email: 'jordan.smith@workflow.admin' },
    template: { _id: 'tpl-1', name: 'Q3 Time Table', templateId: 'TPL-001' },
    data: { department: 'Marketing', budget: '50000' },
    submittedAt: '2023-10-25T10:30:00Z',
    status: 'Pending',
  },
  {
    _id: 'sub-002',
    user: { _id: 'user-2', name: 'Amara Miller', email: 'amara.m@workflow.admin' },
    template: { _id: 'tpl-2', name: 'Enterprise Migration Phase 1', templateId: 'TPL-002' },
    data: { phase: 'Phase 1', timeline: '3 months' },
    submittedAt: '2023-10-24T16:15:00Z',
    status: 'Reviewed',
  },
  {
    _id: 'sub-003',
    user: { _id: 'user-3', name: 'David Wright', email: 'david.wright@workflow.admin' },
    template: { _id: 'tpl-3', name: 'Security Audit Q3', templateId: 'TPL-003' },
    data: { auditType: 'Security', findings: '5 critical' },
    submittedAt: '2023-10-22T09:00:00Z',
    status: 'Reviewed',
  },
];

// Get all submissions
router.get('/', async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('user', 'name email')
      .populate('template', 'name templateId');
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.log('Database query failed, returning mock submissions:', error.message);
    // Return mock data as fallback when database is unavailable
    res.json({ success: true, data: mockSubmissions, isMockData: true });
  }
});

// Submit a form response
router.post('/', async (req, res) => {
  try {
    const newSubmission = new Submission(req.body);
    await newSubmission.save();
    res.status(201).json({ success: true, data: newSubmission });
  } catch (error) {
    // Return mock success response if database is unavailable
    if (error.name === 'MongooseError' || error.code === 'ECONNREFUSED') {
      res.status(201).json({ 
        success: true, 
        data: { ...req.body, _id: 'mock-' + Date.now() },
        isMockData: true 
      });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
});

// Update submission status (e.g. Reviewed, Rejected)
router.patch('/:id/status', async (req, res) => {
  try {
    const updatedSubmission = await Submission.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    res.json({ success: true, data: updatedSubmission });
  } catch (error) {
    // Return mock success response if database is unavailable
    if (error.name === 'MongooseError' || error.code === 'ECONNREFUSED') {
      res.json({ 
        success: true, 
        data: { _id: req.params.id, status: req.body.status },
        isMockData: true 
      });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
});

export default router;
