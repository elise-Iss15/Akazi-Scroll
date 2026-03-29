
-- USERS TABLE
-- Stores everyone on the platform regardless of role
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('job_seeker', 'employer', 'government', 'admin')),
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- SEEKER PROFILES TABLE
-- Extra info specific to job seekers
CREATE TABLE IF NOT EXISTS seeker_profiles (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  phone            VARCHAR(20),
  location         VARCHAR(100),
  headline         VARCHAR(200),
  bio              TEXT,
  cv_url           TEXT,
  skills           TEXT[],
  experience_years INTEGER DEFAULT 0,
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- EMPLOYER PROFILES TABLE
-- Extra info specific to employers/companies
CREATE TABLE IF NOT EXISTS employer_profiles (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(150),
  industry     VARCHAR(100),
  company_size VARCHAR(50),
  website      TEXT,
  logo_url     TEXT,
  description  TEXT,
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- JOBS TABLE
-- Every job listing posted by employers
CREATE TABLE IF NOT EXISTS jobs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(150) NOT NULL,
  description      TEXT NOT NULL,
  location         VARCHAR(100),
  job_type         VARCHAR(20) CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'remote')),
  category         VARCHAR(100),
  salary_min       INTEGER,
  salary_max       INTEGER,
  salary_currency  VARCHAR(10) DEFAULT 'RWF',
  tags             TEXT[],
  status           VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'expired')),
  deadline         DATE,
  views            INTEGER DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- APPLICATIONS TABLE
-- When a job seeker applies to a job
CREATE TABLE IF NOT EXISTS applications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id       UUID REFERENCES jobs(id) ON DELETE CASCADE,
  seeker_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  cv_url       TEXT,
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'hired', 'rejected')),
  applied_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- SAVED JOBS TABLE
-- When a seeker bookmarks a job
CREATE TABLE IF NOT EXISTS saved_jobs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id     UUID REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(seeker_id, job_id)
);

-- INDEXES
-- These make search queries faster
CREATE INDEX IF NOT EXISTS idx_jobs_status     ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category   ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_location   ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_employer   ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_apps_seeker     ON applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_apps_job        ON applications(job_id);