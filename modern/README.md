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

## Blue Renaissance CMS — D1 course library

**Blue Renaissance** is the internal CMS name. It manages the Frontend Lab course pages, teacher revisions, Quiz Studio and learning analytics.

- Original **44 HTML pages** (43 lesson/quiz pages plus homepage body) have been imported into the existing Cloudflare D1 `frontend-lab-cms` database under `lab_course_sources`. Aggregate verified D1 source length: approximately 429 KiB.
- The Worker resolves course HTML in this order: **teacher-published override (D1)** → **archived course original (D1)** → **bundled static HTML**. React, CSS, JavaScript, images and the original quiz engine stay as static assets.
- Teacher CMS shows course storage status, can create a new HTML lecture, save drafts/publish/restore, and sync an individual bundled source into the D1 course library without overwriting published edits.
- Branding: the teacher console top left displays **Blue Renaissance CMS** in the original minimal design system. The requested SVG file path is `modern/frontend/public/ui/blue-renaissance-logo.svg`. **The user's actual SVG is not yet attached**; a text wordmark is used until then.

See [Blue Renaissance CMS details](docs/BLUE_RENAISSANCE.md), [learning analytics](docs/LEARNING_ANALYTICS.md), and [operations](docs/OPERATIONS.md).
