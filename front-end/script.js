const API = 'https://akazi-scroll-backend.onrender.com/api';

// ─── State ─────────────────────────────────────────────────────────
let token       = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// ─── Page Navigation ───────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.remove('active');
    l.style.color = '';
    l.style.background = '';
    l.style.borderRadius = '';
  });

  const active = document.getElementById('nav-' + name);
  if (active) {
    active.style.color = '#07091A';
    active.style.background = 'linear-gradient(135deg, #00BAFF, #0088CC)';
    active.style.borderRadius = '999px';
  }

  window.scrollTo(0, 0);

  if (name === 'jobs')      loadJobs();
  if (name === 'employer')  loadEmployerDashboard();
  if (name === 'analytics') loadAnalytics();
}

// ─── Mobile Menu ───────────────────────────────────────────────────
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    menu.classList.add('flex');
  } else {
    menu.classList.add('hidden');
    menu.classList.remove('flex');
  }
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('menu-btn');
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.add('hidden');
    menu.classList.remove('flex');
  }
});

// ─── Theme Toggle ──────────────────────────────────────────────────
function toggleTheme() {
  const body     = document.body;
  const moonIcon = document.getElementById('icon-moon');
  const sunIcon  = document.getElementById('icon-sun');
  const isLight  = body.classList.toggle('light');

  if (isLight) {
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
    localStorage.setItem('theme', 'light');
  } else {
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
    localStorage.setItem('theme', 'dark');
  }
}

function applyTheme() {
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
    const moon = document.getElementById('icon-moon');
    const sun  = document.getElementById('icon-sun');
    if (moon) moon.classList.add('hidden');
    if (sun)  sun.classList.remove('hidden');
  }
}

// ─── Auth Helpers ──────────────────────────────────────────────────
function saveAuth(data) {
  token       = data.token;
  currentUser = data.user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(currentUser));
  updateNavForUser();
}

function clearAuth() {
  token       = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateNavForUser();
}

function updateNavForUser() {
  const navRegister = document.getElementById('nav-register');
  if (currentUser && navRegister) {
    navRegister.textContent = currentUser.full_name.split(' ')[0];
  } else if (navRegister) {
    navRegister.textContent = 'Register';
  }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// ─── Register ──────────────────────────────────────────────────────
async function register() {
  hideError('register-error');

  const full_name = document.getElementById('reg-name').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  const confirm   = document.getElementById('reg-confirm').value;
  const role      = document.getElementById('reg-role').value;

  if (!full_name || !email || !password) return showError('register-error', 'Please fill in all fields.');
  if (password !== confirm)              return showError('register-error', 'Passwords do not match.');
  if (password.length < 8)              return showError('register-error', 'Password must be at least 8 characters.');

  const btn = document.getElementById('register-btn');
  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ full_name, email, password, role })
    });
    const data = await res.json();

    if (!res.ok) {
      showError('register-error', data.message || 'Registration failed.');
    } else {
      saveAuth(data);
      if (data.user.role === 'employer') {
        showPage('employer');
      } else {
        showPage('jobs');
      }
    }
  } catch (err) {
    showError('register-error', 'Cannot connect to server. Make sure your backend is running.');
  }

  btn.textContent = 'Continue';
  btn.disabled = false;
}

// ─── Login ─────────────────────────────────────────────────────────
async function login() {
  hideError('login-error');

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) return showError('login-error', 'Please enter your email and password.');

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showError('login-error', data.message || 'Login failed.');
    } else {
      saveAuth(data);
      if (data.user.role === 'employer') {
        showPage('employer');
      } else if (data.user.role === 'government' || data.user.role === 'admin') {
        showPage('analytics');
      } else {
        showPage('jobs');
      }
    }
  } catch (err) {
    showError('login-error', 'Cannot connect to server. Make sure your backend is running.');
  }

  btn.textContent = 'Sign In';
  btn.disabled = false;
}

// ─── Logout ────────────────────────────────────────────────────────
function logout() {
  clearAuth();
  showPage('home');
}

// ─── Load Jobs ─────────────────────────────────────────────────────
async function loadJobs(search = '', location = '', job_type = '') {
  const container = document.getElementById('jobs-list');
  if (!container) return;

  const s = document.getElementById('job-search')?.value || search;
  const l = document.getElementById('job-location')?.value || location;

  container.innerHTML = '<p class="text-white/40 text-sm">Loading jobs...</p>';

  let url = `${API}/jobs?limit=20`;
  if (s)        url += `&search=${encodeURIComponent(s)}`;
  if (l)        url += `&location=${encodeURIComponent(l)}`;
  if (job_type) url += `&job_type=${encodeURIComponent(job_type)}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.jobs || data.jobs.length === 0) {
      container.innerHTML = '<p class="text-white/40 text-sm">No jobs found.</p>';
      return;
    }

    container.innerHTML = data.jobs.map(job => `
      <div onclick="showJobDetail('${job.id}')"
           class="dark-card bg-gradient-to-br from-[#162035] to-[#0D1526] border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-[#00BAFF]/40 transition">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="font-semibold text-sm mb-1">${job.title}</div>
            <div class="text-white/40 text-xs">${job.employer_name || 'Company'}</div>
          </div>
          <span class="bg-[#00BAFF]/15 border border-[#00BAFF]/30 text-[#00BAFF] text-xs px-2 py-1 rounded-lg whitespace-nowrap">${job.category || 'General'}</span>
        </div>
        <div class="flex gap-3 text-[11px] text-white/30 mb-3 flex-wrap">
          <span>📍 ${job.location || 'Rwanda'}</span>
          <span>💼 ${job.job_type ? job.job_type.replace(/_/g,' ') : 'Full-time'}</span>
          <span>💰 ${job.salary_min ? 'RWF ' + Number(job.salary_min).toLocaleString() : 'Negotiable'}</span>
        </div>
        <div class="flex gap-2 flex-wrap">
          ${(job.tags || []).slice(0,3).map(tag =>
            `<span class="bg-white/5 border border-white/10 text-white/40 text-[10px] px-3 py-1 rounded-full">${tag}</span>`
          ).join('')}
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = '<p class="text-red-400 text-sm">Could not load jobs. Is your backend running?</p>';
  }
}

// ─── Show Job Detail ───────────────────────────────────────────────
async function showJobDetail(jobId) {
  const detail = document.getElementById('job-detail');
  if (!detail) return;

  detail.classList.remove('hidden');
  detail.innerHTML = '<p class="text-white/40 text-sm">Loading...</p>';

  try {
    const res  = await fetch(`${API}/jobs/${jobId}`);
    const data = await res.json();
    const job  = data.job;

    detail.innerHTML = `
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-2xl font-bold mb-1" style="font-family:'Cormorant Garamond',serif">${job.title}</h2>
          <p class="text-white/50 text-sm">${job.employer_name || 'Company'}</p>
        </div>
        <span class="bg-[#00BAFF]/15 border border-[#00BAFF]/30 text-[#00BAFF] text-xs px-3 py-1 rounded-full">${job.status}</span>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-white/5 border border-white/10 rounded-xl p-3"><div class="text-[10px] text-white/30 mb-1">📍 Location</div><div class="text-sm font-medium">${job.location || 'Rwanda'}</div></div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-3"><div class="text-[10px] text-white/30 mb-1">💼 Type</div><div class="text-sm font-medium">${job.job_type ? job.job_type.replace(/_/g,' ') : 'Full-time'}</div></div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-3"><div class="text-[10px] text-white/30 mb-1">💰 Salary</div><div class="text-sm font-medium">${job.salary_min ? 'RWF ' + Number(job.salary_min).toLocaleString() + ' – ' + Number(job.salary_max).toLocaleString() : 'Negotiable'}</div></div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-3"><div class="text-[10px] text-white/30 mb-1">📅 Deadline</div><div class="text-sm font-medium">${job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Open'}</div></div>
      </div>
      <div class="mb-5">
        <h3 class="text-sm font-semibold mb-2">About the Role</h3>
        <p class="text-white/50 text-sm leading-relaxed">${job.description}</p>
      </div>
      <div class="mb-6">
        <h3 class="text-sm font-semibold mb-2">Skills</h3>
        <div class="flex gap-2 flex-wrap">
          ${(job.tags || []).map(tag =>
            `<span class="bg-[#00BAFF]/15 border border-[#00BAFF]/30 text-[#00BAFF] text-xs px-3 py-1 rounded-full">${tag}</span>`
          ).join('')}
        </div>
      </div>
      ${token && currentUser?.role === 'job_seeker' ? `
        <div class="mb-4">
          <label class="block text-xs text-white/50 mb-2">Cover Letter</label>
          <textarea id="cover-letter" rows="3" placeholder="Why are you a great fit for this role?"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#00BAFF]/50 resize-none"></textarea>
        </div>
        <button onclick="applyToJob('${job.id}')"
          class="w-full bg-gradient-to-r from-[#00BAFF] to-[#0088CC] text-[#07091A] font-semibold py-3 rounded-xl text-sm shadow-lg">
          Apply Now
        </button>
        <div id="apply-msg" class="hidden mt-3 text-center text-xs"></div>
      ` : `
        <button onclick="showPage('login')"
          class="w-full bg-gradient-to-r from-[#00BAFF] to-[#0088CC] text-[#07091A] font-semibold py-3 rounded-xl text-sm shadow-lg">
          Login to Apply
        </button>
      `}
    `;
  } catch (err) {
    detail.innerHTML = '<p class="text-red-400 text-sm">Could not load job details.</p>';
  }
}

// ─── Apply to Job ──────────────────────────────────────────────────
async function applyToJob(jobId) {
  const cover_letter = document.getElementById('cover-letter')?.value || '';
  const msgEl = document.getElementById('apply-msg');

  try {
    const res  = await fetch(`${API}/applications/${jobId}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cover_letter })
    });
    const data = await res.json();

    msgEl.classList.remove('hidden');
    if (res.ok) {
      msgEl.className = 'mt-3 text-center text-xs text-[#00C46A]';
      msgEl.textContent = 'Application submitted successfully!';
    } else {
      msgEl.className = 'mt-3 text-center text-xs text-red-400';
      msgEl.textContent = data.message || 'Could not submit application.';
    }
  } catch (err) {
    msgEl.classList.remove('hidden');
    msgEl.className = 'mt-3 text-center text-xs text-red-400';
    msgEl.textContent = 'Could not connect to server.';
  }
}

// ─── Job Search ────────────────────────────────────────────────────
function setupJobSearch() {
  const searchInput    = document.getElementById('job-search');
  const locationSelect = document.getElementById('job-location');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      loadJobs(searchInput.value, locationSelect?.value || '');
    });
  }
  if (locationSelect) {
    locationSelect.addEventListener('change', () => {
      loadJobs(searchInput?.value || '', locationSelect.value);
    });
  }
}

// ─── Employer Dashboard ────────────────────────────────────────────
async function loadEmployerDashboard() {
  if (!token || !currentUser || currentUser.role !== 'employer') return;

  const nameEl = document.getElementById('employer-name');
  if (nameEl) nameEl.textContent = currentUser.full_name;

  try {
    const res  = await fetch(`${API}/dashboard/employer`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) return;

    const stats = data.stats;
    const el    = (id) => document.getElementById(id);

    if (el('stat-active-posts')) el('stat-active-posts').textContent = stats.jobs.active_jobs;
    if (el('stat-total-apps'))   el('stat-total-apps').textContent   = stats.applications.total_applications;
    if (el('stat-shortlisted'))  el('stat-shortlisted').textContent  = stats.applications.shortlisted;
    if (el('stat-hired'))        el('stat-hired').textContent        = stats.applications.hired;

  } catch (err) {
    console.error('Could not load employer dashboard:', err);
  }
}

// ─── Post Job Modal ────────────────────────────────────────────────
function showPostJobModal() {
  if (!token || currentUser?.role !== 'employer') {
    alert('Please login as an employer first.');
    showPage('login');
    return;
  }
  const modal = document.getElementById('post-job-modal');
  if (modal) modal.classList.remove('hidden');
}

function hidePostJobModal() {
  const modal = document.getElementById('post-job-modal');
  if (modal) modal.classList.add('hidden');
}

async function postJob() {
  const title       = document.getElementById('job-title').value.trim();
  const description = document.getElementById('job-description').value.trim();
  const location    = document.getElementById('job-location-input').value.trim();
  const job_type    = document.getElementById('job-type').value;
  const category    = document.getElementById('job-category').value.trim();
  const salary_min  = document.getElementById('job-salary-min').value;
  const salary_max  = document.getElementById('job-salary-max').value;
  const deadline    = document.getElementById('job-deadline').value;

  if (!title || !description) return alert('Title and description are required.');

  const btn = document.getElementById('post-job-btn');
  btn.textContent = 'Posting...';
  btn.disabled = true;

  try {
    const res  = await fetch(`${API}/jobs`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title, description, location, job_type, category,
        salary_min: Number(salary_min),
        salary_max: Number(salary_max),
        salary_currency: 'RWF', deadline
      })
    });
    const data = await res.json();

    if (res.ok) {
      hidePostJobModal();
      alert('Job posted successfully!');
      loadEmployerDashboard();
    } else {
      alert(data.message || 'Could not post job.');
    }
  } catch (err) {
    alert('Cannot connect to server.');
  }

  btn.textContent = 'Post Job';
  btn.disabled = false;
}

// ─── Analytics ─────────────────────────────────────────────────────
async function loadAnalytics() {
  if (!token) return;

  try {
    const res  = await fetch(`${API}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) return;

    const s  = data.stats;
    const el = (id) => document.getElementById(id);

    if (el('stat-total-users'))        el('stat-total-users').textContent        = s.users.total_users;
    if (el('stat-total-jobs'))         el('stat-total-jobs').textContent         = s.jobs.active_jobs;
    if (el('stat-total-applications')) el('stat-total-applications').textContent = s.applications.total_applications;
    if (el('stat-total-hired'))        el('stat-total-hired').textContent        = s.applications.total_hired;

  } catch (err) {
    console.error('Could not load analytics:', err);
  }
}

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  applyTheme();
  setupJobSearch();
  loadJobs();
  updateNavForUser();

  if (currentUser?.role === 'employer')                                           loadEmployerDashboard();
  if (currentUser?.role === 'government' || currentUser?.role === 'admin')        loadAnalytics();
});