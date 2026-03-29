
const express     = require('express');
const router      = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  getMyJobs,
  updateJob,
  deleteJob
} = require('../controllers/job.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes — no token needed
router.get('/',     getJobs);
router.get('/:id',  getJob);

// Employer only routes — token + employer role required
router.get('/my',           protect, authorize('employer'), getMyJobs);
router.post('/',            protect, authorize('employer'), createJob);
router.put('/:id',          protect, authorize('employer'), updateJob);
router.delete('/:id',       protect, authorize('employer'), deleteJob);

module.exports = router;