# Frontend Lab Modernization (hslcrb proposal)

This directory introduces a private, content-managed evolution of **JJinMangGo/frontend-lecture**. The teacher's original HTML, stylesheet system, quizzes and design remain in the repo root **unchanged**. React is used for the new home portal and onboarding, while legacy lesson URLs and interactive scripts are retained.

## Architecture

- **modern/frontend**: React 19, Vite, Cloudflare Workers Static Assets. A server-side Worker validates a **Cloudflare Access signed JWT**, then requires a student display name separately before returning any lesson/quiz body. A missing Access identity or incomplete configuration fails closed.
- **modern/cms**: Payload CMS 3 running on Next.js 16/OpenNext/Workers with D1 and R2. Admin logins are protected by a separate teacher-only Access policy and Payload credentials. Teachers can version, draft, publish, or undo HTML/JavaScript/CSS content changes.
- **modern/supabase**: one dedicated PostgreSQL table stores the verified Access subject, verified email and separately entered student name. RLS enabled; no browser access/policies; a server-only service role credential performs reads/writes.
- **31 hand-drawn SVG icons** replace card emoji. The original typography, spacing, layout and CSS tokens come from the teacher's source.

## Folder layout

- frontend/src/ — React home renderer and student name onboarding
- frontend/worker/ — signed Access JWT verification, student records, published CMS overrides and protected legacy lesson fallback
- frontend/scripts/sync-original.mjs — copy original pages/assets into the build, stripping legacy analytics but retaining quiz scripts
- frontend/public/ui/icons/ — thirty-one original SVG glyphs
- frontend/tests/ — portable Node unit/static tests (no GitHub Actions required)
- cms/src/ — executable Payload CMS adapted from the official Cloudflare D1 template
- cms/scripts/seed-legacy.mjs — optional, idempotent import of original HTML/JS/CSS into Payload
- supabase/migrations/ — audited student table DDL
- docs/ — deployment, onboarding and security guidance
- PR_DRAFT.md — proposal text; **do not open an upstream PR until explicitly requested**

## Local checks

From a full fork checkout:

    cd modern/frontend
    npm install
    npm test
    npm run build

The frontend build executes sync-original first, using the teacher's up-to-date source files in the repo root. Deployed project should use root directory `modern/frontend` and build command `npm run build`. If dependencies are installed, the project can run with `npm run dev`.

CMS:

    cd modern/cms
    corepack enable
    pnpm install
    pnpm dev

The CMS needs a D1 database (for documents), R2 bucket (media), and a PAYLOAD_SECRET. The official template's deploy scripts and migration workflow are retained. See [deployment](docs/DEPLOYMENT.md) for secure provisioning and onboarding.

## Important security limits

The original GitHub Pages site at learn.jjinmango.kr is public. Its hosting is not controlled by this proposal: new Access authentication **does not retroactively protect the old public Pages URL**. Only the teacher can decide to switch the official domain, and should do so after real login/quiz/browser regression tests.

Deployment is **not** complete merely because code is committed: Cloudflare currently requires R2 activation, and Google OAuth + private Supabase project have not been configured yet. Do not route students to a broken or publicly accessible staging site.

### Copyright and contribution

The original author retains ownership of the source lectures and layout. No blanket license has been assumed or added. An upstream pull request remains deferred until the owner and contributor explicitly agree to submit it.
