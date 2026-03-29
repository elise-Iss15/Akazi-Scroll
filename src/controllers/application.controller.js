
const pool = require('../config/db');

// Seeker applies to a job
const applyToJob = async (req, res, next) => {
  try {
    const seeker_id = req.user.id;
    const job_id    = req.params.jobId;
    const { cover_letter, cv_url } = req.body;

    // Check the job exists and is active
    const job = await pool.query(
      `SELECT id FROM jobs WHERE id = $1 AND status = 'active'`,
      [job_id]
    );

    if (job.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer active'
      });
    }

    // Check seeker has not already applied
    const existing = await pool.query(
      `SELECT id FROM applications 
       WHERE job_id = $1 AND seeker_id = $2`,
      [job_id, seeker_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    // Save the application
    const result = await pool.query(
      `INSERT INTO applications (job_id, seeker_id, cover_letter, cv_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [job_id, seeker_id, cover_letter, cv_url]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
};

// Seeker sees their own applications
const getMyApplications = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
         a.*,
         j.title        AS job_title,
         j.location     AS job_location,
         j.job_type     AS job_type,
         j.category     AS job_category,
         u.full_name    AS employer_name
       FROM applications a
       JOIN jobs  j ON a.job_id      = j.id
       JOIN users u ON j.employer_id = u.id
       WHERE a.seeker_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      count:        result.rows.length,
      applications: result.rows
    });

  } catch (err) {
    next(err);
  }
};

// Employer sees all applicants for their job
const getJobApplications = async (req, res, next) => {
  try {
    const job_id     = req.params.jobId;
    const employer_id = req.user.id;


    const job = await pool.query(
      `SELECT id FROM jobs 
       WHERE id = $1 AND employer_id = $2`,
      [job_id, employer_id]
    );

    if (job.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not own this job'
      });
    }

    const result = await pool.query(
      `SELECT 
         a.*,
         u.full_name AS seeker_name,
         u.email     AS seeker_email
       FROM applications a
       JOIN users u ON a.seeker_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.applied_at DESC`,
      [job_id]
    );

    res.status(200).json({
      success: true,
      count:        result.rows.length,
      applications: result.rows
    });

  } catch (err) {
    next(err);
  }
};

// Employer updates application status
const updateStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;
    const employer_id = req.user.id;

    // Valid statuses
    const validStatuses = [
      'pending',
      'reviewed',
      'shortlisted',
      'hired',
      'rejected'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const existing = await pool.query(
      `SELECT a.id FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1 AND j.employer_id = $2`,
      [id, employer_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or you do not have permission'
      });
    }

    const result = await pool.query(
      `UPDATE applications 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    res.status(200).json({
      success: true,
      message:     `Application marked as ${status}`,
      application: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateStatus
};