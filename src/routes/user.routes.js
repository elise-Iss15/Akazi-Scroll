
const express  = require('express');
const router   = express.Router();
const {
  getProfile,
  updateProfile,
  saveJob,
  unsaveJob,
  getSavedJobs
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Profile routes — any logged in user
router.get('/profile',  protect, getProfile);
router.patch('/profile', protect, updateProfile);

// Saved jobs — seeker only
router.post('/save-job/:jobId',
  protect,
  authorize('job_seeker'),
  saveJob
);

router.delete('/save-job/:jobId',
  protect,
  authorize('job_seeker'),
  unsaveJob
);

router.get('/saved-jobs',
  protect,
  authorize('job_seeker'),
  getSavedJobs
);

module.exports = router;