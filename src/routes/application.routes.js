
const express  = require('express');
const router   = express.Router();
const {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateStatus
} = require('../controllers/application.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Seeker applies to a job
router.post('/:jobId',
  protect,
  authorize('job_seeker'),
  applyToJob
);

// Seeker sees their own applications
router.get('/my',
  protect,
  authorize('job_seeker'),
  getMyApplications
);

// Employer sees applicants for their job
router.get('/job/:jobId',
  protect,
  authorize('employer'),
  getJobApplications
);

// Employer updates application status
router.patch('/:id/status',
  protect,
  authorize('employer'),
  updateStatus
);

module.exports = router;