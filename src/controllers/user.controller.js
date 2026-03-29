
const pool = require('../config/db');

// Get own full profile
const getProfile = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const role    = req.user.role;

    // Get base user info
    const userResult = await pool.query(
      `SELECT id, full_name, email, role, is_verified, created_at
       FROM users WHERE id = $1`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get role specific profile
    let profile = null;

    if (role === 'job_seeker') {
      const result = await pool.query(
        `SELECT * FROM seeker_profiles WHERE user_id = $1`,
        [user_id]
      );
      profile = result.rows[0] || null;
    }

    if (role === 'employer') {
      const result = await pool.query(
        `SELECT * FROM employer_profiles WHERE user_id = $1`,
        [user_id]
      );
      profile = result.rows[0] || null;
    }

    res.status(200).json({
      success: true,
      user,
      profile
    });

  } catch (err) {
    next(err);
  }
};

// Update own profile
const updateProfile = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const role    = req.user.role;

    if (role === 'job_seeker') {
      const {
        phone,
        location,
        headline,
        bio,
        cv_url,
        skills,
        experience_years
      } = req.body;

      // Check if seeker profile exists
      const existing = await pool.query(
        `SELECT id FROM seeker_profiles WHERE user_id = $1`,
        [user_id]
      );

      let result;

      if (existing.rows.length === 0) {
        // Create profile if it doesn't exist yet
        result = await pool.query(
          `INSERT INTO seeker_profiles
            (user_id, phone, location, headline, bio, cv_url, skills, experience_years)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING *`,
          [user_id, phone, location, headline, bio, cv_url, skills, experience_years]
        );
      } else {
        // Update existing profile
        result = await pool.query(
          `UPDATE seeker_profiles SET
            phone            = COALESCE($1, phone),
            location         = COALESCE($2, location),
            headline         = COALESCE($3, headline),
            bio              = COALESCE($4, bio),
            cv_url           = COALESCE($5, cv_url),
            skills           = COALESCE($6, skills),
            experience_years = COALESCE($7, experience_years),
            updated_at       = NOW()
           WHERE user_id = $8
           RETURNING *`,
          [phone, location, headline, bio, cv_url, skills, experience_years, user_id]
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: result.rows[0]
      });
    }

    if (role === 'employer') {
      const {
        company_name,
        industry,
        company_size,
        website,
        logo_url,
        description
      } = req.body;

      const existing = await pool.query(
        `SELECT id FROM employer_profiles WHERE user_id = $1`,
        [user_id]
      );

      let result;

      if (existing.rows.length === 0) {
        result = await pool.query(
          `INSERT INTO employer_profiles
            (user_id, company_name, industry, company_size, website, logo_url, description)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING *`,
          [user_id, company_name, industry, company_size, website, logo_url, description]
        );
      } else {
        result = await pool.query(
          `UPDATE employer_profiles SET
            company_name = COALESCE($1, company_name),
            industry     = COALESCE($2, industry),
            company_size = COALESCE($3, company_size),
            website      = COALESCE($4, website),
            logo_url     = COALESCE($5, logo_url),
            description  = COALESCE($6, description),
            updated_at   = NOW()
           WHERE user_id = $7
           RETURNING *`,
          [company_name, industry, company_size, website, logo_url, description, user_id]
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Company profile updated successfully',
        profile: result.rows[0]
      });
    }

    res.status(400).json({
      success: false,
      message: 'Profile update not available for this role'
    });

  } catch (err) {
    next(err);
  }
};

// Save a job
const saveJob = async (req, res, next) => {
  try {
    const seeker_id = req.user.id;
    const job_id    = req.params.jobId;

    // Check job exists
    const job = await pool.query(
      `SELECT id FROM jobs WHERE id = $1`,
      [job_id]
    );

    if (job.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check not already saved
    const existing = await pool.query(
      `SELECT id FROM saved_jobs 
       WHERE seeker_id = $1 AND job_id = $2`,
      [seeker_id, job_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Job already saved'
      });
    }

    await pool.query(
      `INSERT INTO saved_jobs (seeker_id, job_id) VALUES ($1, $2)`,
      [seeker_id, job_id]
    );

    res.status(201).json({
      success: true,
      message: 'Job saved successfully'
    });

  } catch (err) {
    next(err);
  }
};

// Unsave a job
const unsaveJob = async (req, res, next) => {
  try {
    const seeker_id = req.user.id;
    const job_id    = req.params.jobId;

    await pool.query(
      `DELETE FROM saved_jobs 
       WHERE seeker_id = $1 AND job_id = $2`,
      [seeker_id, job_id]
    );

    res.status(200).json({
      success: true,
      message: 'Job removed from saved list'
    });

  } catch (err) {
    next(err);
  }
};

// Get all saved jobs
const getSavedJobs = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
         j.*,
         u.full_name AS employer_name,
         s.saved_at
       FROM saved_jobs s
       JOIN jobs  j ON s.job_id       = j.id
       JOIN users u ON j.employer_id  = u.id
       WHERE s.seeker_id = $1
       ORDER BY s.saved_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      jobs:  result.rows
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  saveJob,
  unsaveJob,
  getSavedJobs
};