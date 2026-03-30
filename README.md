# AKAZI SCROLL — Rwanda Youth Employment Platform

> Connecting Rwandan youth to verified employment opportunities through intelligent matching and real-time government analytics.

**Live Demo:** [https://akazi-scroll-frontend.onrender.com](https://akazi-scroll-frontend.onrender.com)  
**Backend API:** [https://akazi-scroll-backend.onrender.com](https://akazi-scroll-backend.onrender.com)  
**Built by:** Elyse Ishimwe — African Leadership University, Rwanda, 2026

---

## The Problem

32% of Rwandan youth aged 18–35 are NEET (Not in Employment, Education or Training). Three coordination failures cause this:

1. **No skills verification** — employers cannot trust self-reported skills (37.6% trust gap)
2. **No intelligent matching** — job seekers do not know which opportunities they qualify for
3. **No real-time data** — MIFOTRA has no live visibility into employment trends across 30 districts

## The Solution

Akazi Scroll is a full-stack youth employment platform with three user types:

- **Job Seekers** — browse verified jobs, apply, track application status
- **Employers** — post listings, review applicants, view hiring analytics
- **Government** — real-time platform-wide employment statistics aligned with Vision 2050

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| Authentication | JWT + bcrypt |
| Frontend | HTML + Tailwind CSS + Vanilla JavaScript |
| Deployment | Render |

---

## Features

- User registration and login with role-based access (job seeker, employer, government, admin)
- JWT authentication with bcrypt password hashing
- Job listings with search and filter by keyword, location, and job type
- One-click job application with cover letter
- Employer dashboard with real-time hiring statistics
- Government analytics portal with platform-wide employment data
- Post New Job modal for employers
- Light and dark theme toggle
- Fully responsive — mobile, tablet, and desktop

---

## Project Structure

```
Akazi-Scroll/
├── server.js                    # Entry point
├── package.json
├── .env.example                 # Environment variables template
├── front-end/
│   ├── index.html               # Frontend UI
│   └── script.js                # Frontend JavaScript
└── src/
    ├── app.js                   # Express app setup
    ├── config/
    │   ├── db.js                # PostgreSQL connection
    │   └── schema.sql           # Database schema
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── job.controller.js
    │   ├── application.controller.js
    │   ├── user.controller.js
    │   └── dashboard.controller.js
    ├── middleware/
    │   ├── auth.middleware.js   # JWT + RBAC
    │   └── errorHandler.js
    └── routes/
        ├── auth.routes.js
        ├── job.routes.js
        ├── application.routes.js
        ├── user.routes.js
        └── dashboard.routes.js
```

---

## Setup Instructions

Follow every step carefully to get the project running on your machine.

### Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org) version 18 or higher
- [Git](https://git-scm.com)
- A free [Supabase](https://supabase.com) account
- A code editor like [VS Code](https://code.visualstudio.com)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/elise-lss15/Akazi-Scroll.git
cd Akazi-Scroll
```

---

### Step 2 — Install dependencies

```bash
npm install
```

---

### Step 3 — Set up Supabase database

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and fill in:
   - Name: `akazi-scroll`
   - Database password: create a strong password and save it
   - Region: EU West (Ireland)
3. Once the project is ready, go to **SQL Editor**
4. Copy the entire contents of `src/config/schema.sql`
5. Paste it into the SQL Editor and click **Run**
6. All 6 tables will be created: users, jobs, applications, seeker_profiles, employer_profiles, saved_jobs

---

### Step 4 — Get your database connection string

1. In Supabase, click **Connect** at the top
2. Click **Direct** connection type
3. Copy the connection string — it looks like:
```
postgresql://postgres.xxxx:password@aws-x-eu-west-1.pooler.supabase.com:6543/postgres
```

---

### Step 5 — Configure environment variables

Create a `.env` file in the root folder:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
PORT=5000
DATABASE_URL=your_supabase_connection_string_here
JWT_SECRET=your_long_random_secret_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=*
```

**Important:** Never commit your `.env` file to GitHub. It is already in `.gitignore`.

---

### Step 6 — Run the backend server

```bash
npm run dev
```

You should see:
```
Akazi Scroll API running on port 5000
Connected to Supabase database
```

---

### Step 7 — Open the frontend

1. Open VS Code
2. Install the **Live Server** extension by Ritwick Dey
3. Right click on `front-end/index.html`
4. Click **"Open with Live Server"**
5. Your browser opens at `http://127.0.0.1:5500`

---

### Step 8 — Test the platform

Open your browser and test these flows:

**Register as job seeker:**
- Click Register → fill in details → select Job Seeker → click Continue
- You are redirected to the Jobs page as a logged-in user

**Browse and apply to jobs:**
- Click on any job card → click Apply Now → write cover letter → submit

**Login as employer:**
- Click Login → enter employer credentials
- You are redirected to the Employer Dashboard with real stats

**Post a new job:**
- On the Employer Dashboard → click Post New Job → fill in details → submit

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and get token |
| GET | `/api/auth/me` | Auth | Get current user |
| GET | `/api/jobs` | Public | List jobs with filters |
| GET | `/api/jobs/:id` | Public | Get single job |
| POST | `/api/jobs` | Employer | Post a new job |
| PUT | `/api/jobs/:id` | Employer | Update job |
| DELETE | `/api/jobs/:id` | Employer | Delete job |
| POST | `/api/applications/:jobId` | Job Seeker | Apply to a job |
| GET | `/api/applications/my` | Job Seeker | My applications |
| PATCH | `/api/applications/:id/status` | Employer | Update status |
| GET | `/api/users/profile` | Auth | Get profile |
| PATCH | `/api/users/profile` | Auth | Update profile |
| GET | `/api/dashboard/employer` | Employer | Employer stats |
| GET | `/api/dashboard/stats` | Government/Admin | Platform stats |

---

## User Roles

| Role | Permissions |
|------|-------------|
| `job_seeker` | Browse jobs, apply, manage profile, save jobs |
| `employer` | Post jobs, review applications, view dashboard |
| `government` | View platform-wide analytics and trends |
| `admin` | Full access to everything |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. 7d) |
| `FRONTEND_URL` | Frontend URL for CORS (use * for development) |

---

## Deployment

### Backend — Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Set:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add all environment variables from `.env`
6. Click Deploy

### Frontend — Render Static Site

1. Go to [render.com](https://render.com) → New → Static Site
2. Connect the same GitHub repository
3. Set:
   - Root Directory: `front-end`
   - Publish Directory: `front-end`
4. Click Deploy

---

## Author

**Elyse Ishimwe**
elise-Iss15(github account)
African Leadership University  
Rwanda, 2026
