
const pool = require('../config/db');

const createJob = async (req, res, next) => {
  try {
    const {
      title,
      description,
      location,
      job_type,
      category,
      salary_min,
      salary_max,
      salary_currency,
      tags,
      deadline
    } = req.body;

    const employer_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO jobs 
        (employer_id, title, description, location, job_type, 
         category, salary_min, salary_max, salary_currency, tags, deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [employer_id, title, description, location, job_type,
       category, salary_min, salary_max, salary_currency || 'RWF', tags, deadline]
    );

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const {
      search,
      category,
      job_type,
      location,
      page  = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;
    const values = [];
    const conditions = ["j.status = 'active'"];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(j.title ILIKE $${values.length} OR j.description ILIKE $${values.length})`
      );
    }

    if (category) {
      values.push(category);
      conditions.push(`j.category = $${values.length}`);
    }

    if (job_type) {
      values.push(job_type);
      conditions.push(`j.job_type = $${values.length}`);
    }

    if (location) {
      values.push(`%${location}%`);
      conditions.push(`j.location ILIKE $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');

    values.push(limit, offset);

    const result = await pool.query(
      `SELECT j.*, u.full_name AS employer_name
       FROM jobs j
       JOIN users u ON j.employer_id = u.id
       WHERE ${whereClause}
       ORDER BY j.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM jobs j WHERE ${whereClause}`,
      values.slice(0, -2)
    );

    res.status(200).json({
      success: true,
      count: parseInt(countResult.rows[0].count),
      page:  parseInt(page),
      jobs:  result.rows
    });

  } catch (err) {
    next(err);
  }
};

const getJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE jobs SET views = views + 1 WHERE id = $1',
      [id]
    );

    const result = await pool.query(
      `SELECT j.*, u.full_name AS employer_name
       FROM jobs j
       JOIN users u ON j.employer_id = u.id
       WHERE j.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      job: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
};

const getMyJobs = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM jobs 
       WHERE employer_id = $1 
       ORDER BY created_at DESC`,
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

const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT id FROM jobs WHERE id = $1 AND employer_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to edit it'
      });
    }

    const {
      title, description, location, job_type,
      category, salary_min, salary_max,
      salary_currency, tags, deadline, status
    } = req.body;

    const result = await pool.query(
      `UPDATE jobs SET
        title           = COALESCE($1, title),
        description     = COALESCE($2, description),
        location        = COALESCE($3, location),
        job_type        = COALESCE($4, job_type),
        category        = COALESCE($5, category),
        salary_min      = COALESCE($6, salary_min),
        salary_max      = COALESCE($7, salary_max),
        salary_currency = COALESCE($8, salary_currency),
        tags            = COALESCE($9, tags),
        deadline        = COALESCE($10, deadline),
        status          = COALESCE($11, status),
        updated_at      = NOW()
       WHERE id = $12
       RETURNING *`,
      [title, description, location, job_type, category,
       salary_min, salary_max, salary_currency, tags,
       deadline, status, id]
    );

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT id FROM jobs WHERE id = $1 AND employer_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to delete it'
      });
    }

    await pool.query('DELETE FROM jobs WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJob,
  getMyJobs,
  updateJob,
  deleteJob
};