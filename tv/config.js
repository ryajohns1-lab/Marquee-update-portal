// This is public website configuration, never a secret.
// The TV Worker must use separate product/device authorization and R2 objects.
// Do not enable public transition until a protected TV build is released.
window.OVRELIXA_TV_CONFIG = Object.freeze({
  accessApiOrigin: 'https://ovrelixa-tv-access-api.ryajohns1.workers.dev',
  publicTransition: false,
  publicUntil: '',
  publicApkUrl: 'https://github.com/ryajohns1-lab/Marquee-TV-update-portal/releases/latest/download/ovrelixa-tv.apk'
});