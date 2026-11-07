'use strict';
(() => {
  const config = window.OVRELIXA_TV_CONFIG || {};
  const origin = String(config.accessApiOrigin || '').replace(/\/$/, '');
  const form = document.getElementById('tv-access-form');
  const codeField = document.getElementById('tv-code');
  const status = document.getElementById('tv-status');
  const button = form.querySelector('button');
  const downloadResult = document.getElementById('tv-download-result');
  const downloadLink = document.getElementById('tv-private-download');
  const releaseLabel = document.getElementById('tv-release-label');
  const releaseNotes = document.getElementById('tv-download-notes');
  const transition = document.getElementById('public-transition');
  const deadline = document.getElementById('transition-deadline');
  const publicLink = document.getElementById('public-download');
  const normalizedCode = value => value.trim().toUpperCase().replace(/[\s-]/g, '');

  function approvedUrl(value) {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      if (url.origin !== origin || url.protocol !== 'https:' ||
          !/^\/v1\/download\/[a-f0-9]{64}$/i.test(url.pathname) ||
          url.search || url.hash) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function clearDownload() {
    downloadResult.hidden = true;
    downloadLink.removeAttribute('href');
    releaseNotes.textContent = '';
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    const code = normalizedCode(codeField.value);
    clearDownload();
    if (!/^[A-Z0-9]{16,64}$/.test(code)) {
      status.textContent = 'Enter the complete Ovrelixa TV access code.';
      codeField.focus();
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    button.disabled = true;
    codeField.disabled = true;
    status.textContent = 'Verifying your access code…';

    try {
      // Codes are sent by POST, never stored in a download URL or browser storage.
      const response = await fetch(origin + '/v1/site-ticket', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        referrerPolicy: 'no-referrer',
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Too many attempts. Try again in 15 minutes.');
        if (response.status === 503) throw new Error('The private download is temporarily unavailable.');
        if (response.status === 400 || response.status === 403) throw new Error('The TV access code was not accepted.');
        throw new Error('The secure access service is unavailable.');
      }

      const payload = await response.json();
      const url = approvedUrl(payload.url);
      if (!url || !Number.isSafeInteger(payload.versionCode) ||
          typeof payload.versionName !== 'string') {
        throw new Error('The download service returned an unexpected response.');
      }

      downloadLink.href = url;
      releaseLabel.textContent = 'Ovrelixa TV ' + payload.versionName +
        ' · Build ' + payload.versionCode + ' · Fire TV / Android TV';
      releaseNotes.textContent = typeof payload.notes === 'string' ? payload.notes.slice(0, 600) : '';
      downloadResult.hidden = false;
      codeField.value = '';
      status.textContent = 'Access verified. Select Download Ovrelixa TV below.';
    } catch (error) {
      if (error.name === 'AbortError') status.textContent = 'Connection timed out. Try again.';
      else if (error instanceof TypeError) status.textContent = 'Connection problem. Please try again.';
      else status.textContent = error.message || 'Could not contact the download service.';
    } finally {
      clearTimeout(timer);
      codeField.disabled = false;
      button.disabled = false;
    }
  });

  // During the public-to-private handoff, keep the existing signed installer available.
  const until = Date.parse(config.publicUntil || '');
  const active = config.publicTransition === true && Number.isFinite(until);
  if (active && /^https:\/\/github\.com\/ryajohns1-lab\/Marquee-TV-update-portal\/releases\//.test(config.publicApkUrl || '')) {
    transition.hidden = false;
    publicLink.href = config.publicApkUrl;
    deadline.textContent = Date.now() < until
      ? 'The minimum seven-day public transition runs through ' + new Date(until).toLocaleString() + '. Public delivery stays available until secure updates have been verified.'
      : 'The seven-day minimum has elapsed. Public delivery remains available until secure updates are verified.';
  }
})();
