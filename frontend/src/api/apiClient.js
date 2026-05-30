export function getToken() { return localStorage.getItem('ap_token'); }
export function getUser()  { try { return JSON.parse(localStorage.getItem('ap_user') || 'null'); } catch { return null; } }

// Central API fetch — injects JWT on every request
export async function api(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  if (res.status === 401) {
    localStorage.removeItem('ap_token');
    localStorage.removeItem('ap_user');
    window.location.href = '/autopropel/dashboard/#/login';
  }
  return res;
}
