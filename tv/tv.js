'use strict';
(() => {
  const config = window.OVRELIXA_TV_CONFIG || {};
  const origin = String(config.accessApiOrigin || '');
  const form = document.getElementById('tv-access-form');
  const codeField = document.getElementById('tv-code');
  const status = document.getElementById('tv-status');
  const transition = document.getElementById('public-transition');
  const deadline = document.getElementById('transition-deadline');
  const publicLink = document.getElementById('public-download');
  const normalizedCode = v => v.trim().toUpperCase().replace(/[\s-]/g, '');
  const safeDownload = url => typeof url === 'string' && url.startsWith(origin + '/v1/download/');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const code = normalizedCode(codeField.value);
    if (!/^[A-Z0-9]{16,64}$/.test(code)) {
      status.textContent = 'Enter the complete Ovrelixa TV code.'; return;
    }
    status.textContent = 'Checking your code…';
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      // Codes are POSTed and never added to an address, storage or URL fragment.
      const res = await fetch(origin + '/v1/site-ticket', {
        method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store',
        headers: {'Content-Type':'application/json'}, body: JSON.stringify({code}),
        referrerPolicy: 'no-referrer'
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !safeDownload(result.url)) throw new Error(
        res.status === 429 ? 'Too many attempts. Try again later.' : res.status === 503 ? 'Private downloads are still being prepared. Use the public transition download below.' : 'This TV access code was not accepted.'
      );
      codeField.value = '';
      status.textContent = 'Access approved. Starting secure download…';
      // Short-lived ticket scoped to this product, separate from the movie app.
      location.assign(result.url);
    } catch (err) {
      status.textContent = err.message || 'Could not contact the secure download service.';
    } finally { button.disabled = false; }
  });

  // Transition is explicitly switched on only at the secure release.
  const until = Date.parse(config.publicUntil || '');
  const active = config.publicTransition === true && Number.isFinite(until);
  if (active && /^https:\/\/github\.com\/ryajohns1-lab\/Marquee-TV-update-portal\/releases\//.test(config.publicApkUrl || '')) {
    transition.hidden = false;
    publicLink.href = config.publicApkUrl;
    deadline.textContent = Date.now() < until\n      ? 'The minimum seven-day public transition runs through ' + new Date(until).toLocaleString() + '. Public delivery stays available until secure updates have been verified.'\n      : 'The seven-day minimum has elapsed. Public delivery remains available until secure updates are verified.';
  }
})();