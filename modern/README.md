# Frontend Lab - Free Cloudflare deployment

Live URL: https://frontend-lab.rhee.life

- Frontend: React 19 + Cloudflare Workers Free, preserves original lesson HTML/CSS/JS and page styles.
- Google OAuth: Cloudflare Access Google identity provider only; Allow Everyone (NO email whitelist). Google Cloud OAuth must be published to Production to avoid Test user restrictions.
- Students: after Google sign-in must register a separate student name (2-40 characters) stored in D1.
- Teacher: only Google-verified spacejh72@gmail.com can enter /admin. The teacher creates a password once, stored permanently as salted PBKDF2 hash in D1, then enters Google + password to manage lessons. 12h admin session, password persists across deployments.
- Recovery: one-time link emailed to teacher address by Cloudflare Email Service; requires that teacher first verifies the Cloudflare Email Routing destination-address invitation. Link usable once for 15 minutes, protected by Google login too.
- D1 CMS: draft/publish/hide/restore HTML, JS and CSS, plus teacher-only student roster.
- Database: frontend-lab-cms, 6 lab tables. No R2, Payload, or paid Worker required.
- Source: hslcrb/frontend-lecture_hslcrb; Cloudflare Workers Builds uses the Fork's main after the documented merge; the historical development branch remains as an archive. GitHub Actions not used.
- Cloudflare build and Worker deployment successful (140 assets). Real browser login/enrollment/password E2E NOT yet verified by the teacher.

Original lesson files and the teacher's original repository are unchanged. Upstream PR postponed until user's explicit final approval.

## Project documentation

- [Full development history and decisions](docs/DEVELOPMENT_HISTORY.md)
- [System architecture, D1 model and auth flows](docs/ARCHITECTURE.md)
- [Deployment, operations, recovery and rollback](docs/OPERATIONS.md)
- [Tests performed vs. outstanding browser validation](docs/VALIDATION.md)
- [Deployment and next steps](docs/DEPLOYMENT.md) | [Security](docs/SECURITY.md)

The original professor's public site and official repository were not changed by this project. Public GitHub hosting does not imply a right to relicense the lectures.

## Student learning platform (2026-11-09 extension)

- Students get a stable `FL-...` ID and private [My Page](https://frontend-lab.rhee.life/me) with scores and activity timeline.
- Teachers see a [minimal learning dashboard](https://frontend-lab.rhee.life/admin) with student performance metrics, SVG charts, per-student reports, and a structured Quiz Studio.
- The Quiz Studio adds/edits choice & short-answer questions, options, answer keys, explanations, drafts, published versions and version restore. Original quizzes can be copied into a managed quiz without changing the original HTML/JS.
- Original unified quiz controller is instrumented at **build time in a copy only**, so legacy quiz scores can also be recorded when the answer catalog is unchanged.
- Grading is performed in the Worker against server-side answer keys. The original legacy JS still contains answers; scores are for formative practice, not proctored exams.

Detailed [feature design and privacy boundaries](docs/LEARNING_ANALYTICS.md) and [implementation log](docs/FEATURE_LOG_2026-11-09.md). The new features require migration `0003_learning_profiles_quizzes.sql` in the existing D1.
