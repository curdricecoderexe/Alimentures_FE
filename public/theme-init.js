/* Admin/staff dark mode: apply the saved theme before first paint so a reload
   never flashes the light theme. A file (not inline) to satisfy the CSP. */
try {
  if (/^\/(admin|staff)(\/|$)/.test(location.pathname) && localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch (e) { /* storage blocked — fall back to light */ }
