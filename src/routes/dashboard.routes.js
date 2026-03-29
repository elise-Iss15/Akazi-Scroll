
const express = require('express');
const router  = express.Router();
const {
  getEmployerStats,
  getPlatformStats,
  getTopJobs
} = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Employer dashboard
router.get('/employer',
  protect,
  authorize('employer'),
  getEmployerStats
);

// Government + Admin platform stats
router.get('/stats',
  protect,
  authorize('government', 'admin'),
  getPlatformStats
);

// Top viewed jobs
router.get('/top-jobs',
  protect,
  authorize('government', 'admin'),
  getTopJobs
);

module.exports = router;