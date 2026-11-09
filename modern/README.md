# Frontend Lab - Free Cloudflare deployment

Live URL: https://frontend-lab.rhee.life

- Frontend: React 19 + Cloudflare Workers Free, preserves original lesson HTML/CSS/JS and page styles.
- Google OAuth: Cloudflare Access Google identity provider only; Allow Everyone (NO email whitelist). Google Cloud OAuth must be published to Production to avoid Test user restrictions.
- Students: after Google sign-in must register a separate student name (2-40 characters) stored in D1.
- Teacher: only Google-verified spacejh72@gmail.com can enter /admin. The teacher creates a password once, stored permanently as salted PBKDF2 hash in D1, then enters Google + password to manage lessons. 12h admin session, password persists across deployments.
- Recovery: one-time link emailed to teacher address by Cloudflare Email Service; requires that teacher first verifies the Cloudflare Email Routing destination-address invitation. Link usable once for 15 minutes, protected by Google login too.
- D1 CMS: draft/publish/hide/restore HTML, JS and CSS, plus teacher-only student roster.
- Database: frontend-lab-cms, 6 lab tables. No R2, Payload, or paid Worker required.
- Source: hslcrb/frontend-lecture_hslcrb; Cloudflare Workers Builds monitors feat/cloudflare-free-d1-cms-20261109. GitHub Actions not used.
- Cloudflare build and Worker deployment successful (140 assets). Real browser login/enrollment/password E2E NOT yet verified by the teacher.

Original lesson files and the teacher's original repository are unchanged. Upstream PR postponed until user's explicit final approval.

[Deployment and next steps](docs/DEPLOYMENT.md) | [Security](docs/SECURITY.md)
