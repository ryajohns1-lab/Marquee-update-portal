# Ovrelixa — Private access portal

Premium, responsive product landing page for **Ovrelixa**. Connected to the existing Cloudflare Pages project \`marquee-update-portal\` (production branch \`main\`). The site is public to view; APK downloads require a valid access code.

## What is here

- Cinematic landing page, custom responsive interface previews and brand graphics.
- Real app icon/wordmark copied from the **private** \`ryajohns1-lab/marquee\` source repository (only these logo images are public).
- Access-code form that exchanges a code for a short-lived download ticket via \`POST /v1/site/ticket\` on the Cloudflare access Worker.
- No raw APK, signing key, session token, code database, secret, or private app source is hosted in this repo.
- Short installation note; no external JS/CDNs, trackers or analytics.
- \`_headers\` includes a restrictive CSP and security headers for Cloudflare Pages.

**Important:** The screenshot-like interface panels are illustrative CSS/HTML mockups, **not photos or captures of the installed application**. Replace with actual app screenshots after collecting approved images; avoid showing fake content as product claims.

## Deployment and domain

Cloudflare Pages deploys new commits to \`main\` at https://marquee-update-portal.pages.dev. The Beelink's legacy OTA path uses *GitHub Releases* directly; this site's access-gated download link is separate. Do not delete or unpublish the public transition APK until devices have migrated.

To use a future domain (for example, \`ovrelixa.com\` after purchase), add it under **Cloudflare Pages → marquee-update-portal → Custom domains**, then update the access Worker's strict \`ALLOWED_ORIGINS\` list to include the actual HTTPS domain before relying on the access form. The site config and the distribution backend do not need to be recreated just to move domains.

## How the private download works

1. The visitor opens the landing page and enters the access code in their browser.
2. \`app.js\` sends a POST request to the existing Cloudflare Worker with the code in the JSON body over HTTPS.
3. The Worker validates the code, throttles failures, checks R2 for the current private signed APK, and returns a 30-minute ticket URL.
4. The browser is given an HTTPS \`/v1/site/download/<ticket>\` URL. The Worker authorizes the ticket before delivering the protected R2 file.
5. Code and ticket are not written to localStorage, the URL, or analytics. All access checks remain server-side.

The private R2 object must be published and activation codes valid for real downloads to succeed.

## Replacing mockups with genuine screenshots

Capture clean home, detail and playback screens from the real app, edit out account keys and personal library data, export optimized .webp images, then replace the three \`.preview-slide\` mockups. Keep device support claims and content rights accurate. Avoid embedding third-party film poster artwork without a permitted usage basis.
