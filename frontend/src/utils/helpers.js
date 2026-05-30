export const fmt = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

export const fmtShort = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch { return iso; }
};

export const statusBadge = (s) => {
  const map = {
    active: 'badge-success', inactive: 'badge-danger',
    success: 'badge-success', failed: 'badge-danger', running: 'badge-purple',
    queued: 'badge-neutral', assigned: 'badge-info',
    now: 'badge-info', scheduled: 'badge-warning',
    chrome: 'badge-info', firefox: 'badge-warning', edge: 'badge-purple',
  };
  return map[(s || '').toLowerCase()] || 'badge-neutral';
};
