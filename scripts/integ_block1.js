/* ============================================================
   API CLIENT · AUTH · STATE · NAVIGATION · TOAST
   Talks to the FastAPI backend over fetch with JWT bearer auth.
   ============================================================ */
const TOKEN_KEY = 'aiva_token';
const API_KEY   = 'aiva_api';

// Resolve the backend base URL.
//   - explicit override in localStorage 'aiva_api' (Settings page)
//   - file://  -> http://localhost:8000
//   - localhost/127.0.0.1 static host -> http://localhost:8000
//   - otherwise (platform-served over http) -> same origin
const API_BASE = (() => {
  const o = (localStorage.getItem(API_KEY) || '').trim().replace(/\/$/, '');
  if (o) return o;
  if (location.protocol === 'file:') return 'http://localhost:8000';
  if (/localhost|127\.0\.0\.1/.test(location.host)) return 'http://localhost:8000';
  return location.origin;
})();

class ApiError extends Error {
  constructor(msg, status) { super(msg); this.status = status; }
}

function getToken()   { return localStorage.getItem(TOKEN_KEY); }
function setToken(t)  { localStorage.setItem(TOKEN_KEY, t); }
function clearAuth()  { localStorage.removeItem(TOKEN_KEY); }

async function api(path, { method = 'GET', body, form, headers } = {}) {
  const h = Object.assign({}, headers || {});
  const tok = getToken();
  if (tok) h['Authorization'] = 'Bearer ' + tok;
  const opts = { method, headers: h };
  if (form) { opts.body = form; }                         // URLSearchParams | FormData
  else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    opts.headers = h;
    opts.body = JSON.stringify(body);
  }
  let r;
  try { r = await fetch(API_BASE + path, opts); }
  catch (e) { throw new ApiError('Network error — cannot reach backend at ' + API_BASE, 0); }
  if (r.status === 401) { sessionExpired(); throw new ApiError('Session expired', 401); }
  if (!r.ok) {
    let d = r.statusText || ('HTTP ' + r.status);
    try {
      const j = await r.json();
      d = Array.isArray(j.detail) ? j.detail.map(x => x.msg || JSON.stringify(x)).join('; ')
          : (j.detail || JSON.stringify(j));
    } catch (e) {}
    throw new ApiError(d, r.status);
  }
  if (r.status === 204) return null;
  const ct = r.headers.get('content-type') || '';
  return ct.includes('application/json') ? r.json() : r.text();
}

let _expiring = false;
function sessionExpired() {
  if (_expiring) return;
  _expiring = true;
  clearAuth();
  toast('Your session expired — please sign in again.', 'err');
  showAuth();
  setTimeout(() => { _expiring = false; }, 600);
}

/* ---------- APP STATE + DATA CACHE ---------- */
const STATE = {
  user: null,
  view: 'dashboard',
  selectedNiche: 'tech', selectedFormat: '16-9', selectedVoice: 'en-us-female',
  selectedLang: 'en-US', selectedStyle: 'minimal', narrationSpeed: 1.0,
  currentProjectId: null,
};
const DATA = { projects: [], queue: [], script: null, runs: [], user: null };

async function refreshProjects() {
  DATA.projects = await api('/projects');
  updateBadges();
  return DATA.projects;
}
async function refreshQueue() {
  DATA.queue = await api('/workflow/queue');
  updateBadges();
  return DATA.queue;
}
function updateBadges() {
  const q = document.getElementById('queueBadge');
  if (q) q.textContent = DATA.queue.length;
  const a = document.getElementById('approvalBadge');
  if (a) a.textContent = DATA.projects.filter(p => p.status === 'pending_review').length;
}

/* ---------- AUTH ---------- */
function switchAuth(mode) {
  const L = document.getElementById('loginForm'), R = document.getElementById('registerForm');
  const tl = document.getElementById('tabLogin'), tr = document.getElementById('tabRegister');
  if (mode === 'login') { L.style.display = 'block'; R.style.display = 'none'; tl.classList.add('active'); tr.classList.remove('active'); }
  else { L.style.display = 'none'; R.style.display = 'block'; tr.classList.add('active'); tl.classList.remove('active'); }
}
function sso(p) { toast('SSO with ' + p + ' is not configured in this demo.', 'warn'); }

async function doLogin(e) {
  e && e.preventDefault ? e.preventDefault() : 0;
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn = e.target.querySelector('button[type=submit]');
  setBusy(btn, true, 'Signing in…');
  try {
    const form = new URLSearchParams();
    form.set('username', email);
    form.set('password', pass);
    const res = await api('/auth/login', { method: 'POST', form });
    setToken(res.access_token);
    STATE.user = res.user;
    await enterApp();
    toast('Welcome back, ' + (STATE.user.name || STATE.user.email).split(' ')[0] + '! Pipeline is online.', 'ok');
  } catch (err) {
    toast(err.message || 'Login failed', 'err');
  } finally { setBusy(btn, false); }
  return false;
}

async function doRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const lang = document.getElementById('regLang').value;
  if (pass.length < 8) { toast('Password must be at least 8 characters.', 'warn'); return false; }
  const btn = e.target.querySelector('button[type=submit]');
  setBusy(btn, true, 'Creating…');
  try {
    const res = await api('/auth/register', {
      method: 'POST',
      body: { email, password: pass, name, role: 'producer', default_language: lang },
    });
    setToken(res.access_token);
    STATE.user = res.user;
    await enterApp();
    toast('Account created. Welcome aboard!', 'ok');
  } catch (err) {
    toast(err.message || 'Registration failed', 'err');
  } finally { setBusy(btn, false); }
  return false;
}

function setBusy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.textContent; btn.disabled = true; btn.textContent = label || '…'; }
  else { btn.disabled = false; if (btn.dataset.label) btn.textContent = btn.dataset.label; }
}

async function enterApp() {
  // Refresh the user object with the freshly issued token (in case register
  // returned before the row was fully flushed) and load the workspace.
  try { STATE.user = await api('/auth/me'); } catch (e) { /* token is valid */ }
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('app').classList.add('active');
  paintUser();
  await nav('dashboard');
}
function paintUser() {
  const u = STATE.user;
  if (!u) return;
  const nm = document.getElementById('userName'); if (nm) nm.textContent = u.name || u.email;
  const av = document.getElementById('userAvatar');
  if (av) av.textContent = (u.name || u.email || '?').trim().charAt(0).toUpperCase();
  const rl = document.querySelector('.user-chip .u-role');
  if (rl) rl.textContent = cap(u.role) + ' · ' + (u.default_language || 'en-US');
}
function logout() {
  clearAuth();
  STATE.user = null;
  STATE.currentProjectId = null;
  DATA.projects = []; DATA.queue = []; DATA.script = null; DATA.runs = [];
  showAuth();
}
function showAuth() {
  document.getElementById('app').classList.remove('active');
  document.getElementById('authScreen').style.display = 'flex';
  switchAuth('login');
}
function cap(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }

/* ---------- NAVIGATION (async: render skeleton, fetch, re-render) ---------- */
const PAGES = {
  dashboard: { title: 'Dashboard', sub: 'Production overview · live from the pipeline' },
  create:    { title: 'Create Video', sub: 'Configure a new AI-generated video for the pipeline' },
  editor:    { title: 'Script Editor', sub: 'Write, structure & preview narration scripts' },
  queue:     { title: 'Pipeline Queue', sub: 'Live workflow execution status' },
  approvals: { title: 'Approvals & Publishing', sub: 'Review generated videos before they go live' },
  analytics: { title: 'Analytics', sub: 'Performance across YouTube & Facebook' },
  settings:  { title: 'Settings', sub: 'Languages, voices, integrations & AI providers' },
};

async function nav(view) {
  if (!getToken()) return showAuth();
  STATE.view = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  const p = PAGES[view] || PAGES.dashboard;
  document.getElementById('pageTitle').textContent = p.title;
  document.getElementById('pageSub').textContent = p.sub;
  document.getElementById('sidebar').classList.remove('open');
  paintView(view);                                   // skeleton from cached DATA
  if (LOAD[view]) {
    try { await LOAD[view](); }
    catch (err) { toast(err.message || String(err), 'err'); }
    paintView(view);                                 // re-render with fresh data
  }
  window.scrollTo(0, 0);
}
function paintView(view) {
  const c = document.getElementById('content');
  c.innerHTML = '<div class="view active">' + (RENDER[view] || RENDER.dashboard)() + '</div>';
  if (AFTER[view]) AFTER[view]();
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

/* ---------- TOAST ---------- */
function toast(msg, type = 'ok', title) {
  const icons = {
    ok:   'M20 6L9 17l-5-5',
    warn: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    err:  'M18 6L6 18M6 6l12 12',
  };
  const titles = { ok: 'Success', warn: 'Heads up', err: 'Error' };
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML =
    '<div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + icons[type] + '"/></svg></div>' +
    '<div><div class="t-title">' + (title || titles[type]) + '</div><div class="t-body">' + msg + '</div></div>';
  const box = document.getElementById('toasts');
  box.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transform = 'translateX(20px)';
    setTimeout(() => t.remove(), 250);
  }, 3600);
}
