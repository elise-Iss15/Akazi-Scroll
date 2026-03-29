
const pool = require('../config/db');

// Employer dashboard — their own stats
const getEmployerStats = async (req, res, next) => {
  try {
    const employer_id = req.user.id;

    // Total jobs posted
    const jobsResult = await pool.query(
      `SELECT COUNT(*) AS total_jobs,
              COUNT(*) FILTER (WHERE status = 'active')  AS active_jobs,
              COUNT(*) FILTER (WHERE status = 'closed')  AS closed_jobs,
              COUNT(*) FILTER (WHERE status = 'expired') AS expired_jobs
       FROM jobs WHERE employer_id = $1`,
      [employer_id]
    );

    // Total applications received
    const appsResult = await pool.query(
      `SELECT COUNT(*) AS total_applications,
              COUNT(*) FILTER (WHERE a.status = 'pending')     AS pending,
              COUNT(*) FILTER (WHERE a.status = 'reviewed')    AS reviewed,
              COUNT(*) FILTER (WHERE a.status = 'shortlisted') AS shortlisted,
              COUNT(*) FILTER (WHERE a.status = 'hired')       AS hired,
              COUNT(*) FILTER (WHERE a.status = 'rejected')    AS rejected
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.employer_id = $1`,
      [employer_id]
    );

    // Most viewed jobs
    const topJobsResult = await pool.query(
      `SELECT id, title, views, status, created_at
       FROM jobs
       WHERE employer_id = $1
       ORDER BY views DESC
       LIMIT 5`,
      [employer_id]
    );

    res.status(200).json({
      success: true,
      stats: {
        jobs:         jobsResult.rows[0],
        applications: appsResult.rows[0],
        top_jobs:     topJobsResult.rows
      }
    });

  } catch (err) {
    next(err);
  }
};

// Government/Admin dashboard — platform wide stats
const getPlatformStats = async (req, res, next) => {
  try {
    // Overall platform numbers
    const usersResult = await pool.query(
      `SELECT COUNT(*) AS total_users,
              COUNT(*) FILTER (WHERE role = 'job_seeker') AS total_seekers,
              COUNT(*) FILTER (WHERE role = 'employer')   AS total_employers
       FROM users`
    );

    const jobsResult = await pool.query(
      `SELECT COUNT(*) AS total_jobs,
              COUNT(*) FILTER (WHERE status = 'active')  AS active_jobs,
              COUNT(*) FILTER (WHERE status = 'closed')  AS closed_jobs,
              COUNT(*) FILTER (WHERE status = 'expired') AS expired_jobs
       FROM jobs`
    );

    const appsResult = await pool.query(
      `SELECT COUNT(*) AS total_applications,
              COUNT(*) FILTER (WHERE status = 'hired') AS total_hired
       FROM applications`
    );

    // Top job categories
    const categoriesResult = await pool.query(
      `SELECT category, COUNT(*) AS job_count
       FROM jobs
       WHERE status = 'active'
       GROUP BY category
       ORDER BY job_count DESC
       LIMIT 5`
    );

    // Monthly hiring trends — last 6 months
    const trendsResult = await pool.query(
      `SELECT 
         TO_CHAR(DATE_TRUNC('month', applied_at), 'Mon YYYY') AS month,
         COUNT(*) AS applications,
         COUNT(*) FILTER (WHERE status = 'hired') AS hired
       FROM applications
       WHERE applied_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', applied_at)
       ORDER BY DATE_TRUNC('month', applied_at) ASC`
    );

    // Top locations
    const locationsResult = await pool.query(
      `SELECT location, COUNT(*) AS job_count
       FROM jobs
       WHERE status = 'active'
       AND location IS NOT NULL
       GROUP BY location
       ORDER BY job_count DESC
       LIMIT 5`
    );

    res.status(200).json({
      success: true,
      stats: {
        users:      usersResult.rows[0],
        jobs:       jobsResult.rows[0],
        applications: appsResult.rows[0],
        top_categories: categoriesResult.rows,
        hiring_trends:  trendsResult.rows,
        top_locations:  locationsResult.rows
      }
    });

  } catch (err) {
    next(err);
  }
};

// Top viewed jobs — government can see what's popular
const getTopJobs = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
         j.id, j.title, j.category,
         j.location, j.views, j.created_at,
         u.full_name AS employer_name
       FROM jobs j
       JOIN users u ON j.employer_id = u.id
       ORDER BY j.views DESC
       LIMIT 10`
    );

    res.status(200).json({
      success: true,
      jobs: result.rows
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmployerStats,
  getPlatformStats,
  getTopJobs
};