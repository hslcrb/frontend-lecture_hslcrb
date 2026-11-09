# Secure deployment and launch — Frontend Lab

## Verified architecture and prerequisites

Payload's official with-cloudflare-d1 runtime is pre-committed under `modern/cms`, NOT generated at deployment. Official source: https://github.com/payloadcms/payload/tree/main/templates/with-cloudflare-d1

**Paid Workers is currently required for Payload's bundled size.** R2 was NOT enabled on the connected Cloudflare account when checked on 2026-11-09; activation is a manual account-level step that may require billing approval. A dedicated D1 database named `frontend-lab-cms` has been created (ID `84a90c4b-fdc4-4bc0-9030-acf7ba26f069`, APAC); no pre-existing D1 databases were changed.

## 1 — Google Cloud OAuth (user action)

In Google Cloud Console (https://console.cloud.google.com/apis/credentials), set up an OAuth consent screen for the users and create a **Web application** client. For a Cloudflare Zero Trust team domain `YOUR-TEAM.cloudflareaccess.com`, authorize the exact redirect URI:

    https://YOUR-TEAM.cloudflareaccess.com/cdn-cgi/access/callback

In Cloudflare Zero Trust > Settings > Authentication > Login methods > Add Google, paste the **Google OAuth Client ID and Client secret**. These belong in Cloudflare's secret configuration, NEVER in this repository or this chat.

Restrict the new frontend Access application to designated student/teacher Google accounts, or your teacher-approved organization domain. Select **Google only** as the accepted IdP, with no One-Time-PIN fallback. A policy of "Everyone" is not an appropriate student roster. Test both permitted and denied accounts.

## 2 — Cloudflare two-Worker boundary

Use a dedicated account environment and resources. CMS hostname must be protected by a separate **teacher-only** Worker-level Access policy (all routes, `workers.dev`, and previews). The `modern/cms/wrangler.jsonc` template explicitly disables `workers.dev` and preview URLs before the CMS is secured. Do not enable public routes before teacher-only Access has been applied.

Frontend hostname receives a **student-and-teacher** Worker-level Access policy (all domains and previews). The frontend ALSO verifies the RS256 Access JWT from the verified team's JWKS; set:

- `CF_ACCESS_TEAM_DOMAIN` — e.g. `your-team.cloudflareaccess.com`.
- `CF_ACCESS_AUD` — **Access application AUD tag**, not the Google OAuth client ID.
- `SUPABASE_URL` — HTTPS API URL of the dedicated project.
- `SUPABASE_SERVICE_ROLE_KEY` — secret key, set only with `wrangler secret put`.

All four values must be available to the frontend Worker at runtime; do not prefix with `VITE_` or `NEXT_PUBLIC_`. Use `npx wrangler secret put NAME` from `modern/frontend` as needed.

Cloudflare Access Worker protection: https://developers.cloudflare.com/workers/configuration/cloudflare-access/

## 3 — D1 and R2 (account owner)

After reviewing account pricing, enable R2 in your Cloudflare account dashboard. In a full local checkout:

    cd modern/cms
    corepack enable
    pnpm install
    # D1 frontend-lab-cms was already created on 2026-11-09.
    pnpm exec wrangler r2 bucket create frontend-lab-cms

The new **D1 database ID** has already been inserted into `modern/cms/wrangler.jsonc`. Check the real R2 bucket name and all bindings. Generate a long random PAYLOAD_SECRET and store it using `pnpm exec wrangler secret put PAYLOAD_SECRET`.

The original Payload template includes baseline migrations for its Users/Media collections. **Generate and review a new migration for lecture-pages, lecture-assets, versions and lab-settings** (from `modern/cms`):

    pnpm exec payload migrate:create
    pnpm run deploy

Commit the generated migration, update its migrations/index.ts as instructed by Payload, and test it on a fresh staging D1 database before using production. Do not silently apply migrations to other apps' D1 databases.

## 4 — Supabase (dedicated project)

Choose a specific Supabase organization (do not reuse the unrelated renewsejongpac database), review the project's creation price, and select region `ap-northeast-2` where practical.

Execute `modern/supabase/migrations/20261109000000_frontend_lab_students.sql` in that project's SQL editor. Run Security Advisors afterward. Copy the new project's API URL and **server-only service_role JWT** to Cloudflare secrets. The public frontend must never receive a secret DB key.

The table's `access_subject` is keyed from the signed Cloudflare Access JWT. This table grants neither `anon` nor `authenticated` browser roles any access. A teacher-approved privacy notice, deletion/retention policy and access control are required before real students register.

## 5 — Payload CMS runtime

Deploy the dedicated `frontend-lab-cms` Worker with D1/R2 and teacher-only Access. Create the initial Payload administrator account only AFTER Access is enforced. Payload's own credentials are additional protection, not a substitute for Google login.

The React Worker uses a private Cloudflare service binding named `CMS_SERVICE` to `frontend-lab-cms`. The CMS's Payload REST API serves only `status=published` documents to non-admin requests. No CMS admin password is used in the student browser.

After CMS setup, published content is editable through:
- `/admin/collections/lecture-pages`: homepage body / and all original lecture HTML paths.
- `/admin/collections/lecture-assets`: editable quiz data JS, classroom demos JS and CSS by original URL path.
- `/admin/globals/lab-settings`: private teacher operational notes.

The optional `modern/cms/scripts/seed-legacy.mjs` imports original source pages and assets without overwriting existing records. Run it only as a legitimately authenticated CMS administrator from a secure environment (CMS_URL, CMS_ADMIN_EMAIL, CMS_ADMIN_PASSWORD; CF_AUTH_COOKIE only if Access is enabled and its use approved). Do not persist credentials in shell history, chat, files or logs.

## 6 — React frontend

    cd modern/frontend
    npm install
    npm test
    npm run build
    npx wrangler deploy

Set `CMS_SERVICE` binding to `frontend-lab-cms` (deploy CMS first). Create and protect the frontend Access application; copy its AUD into frontend Worker secrets. An invalid/missing Access JWT returns 401, a configured-but-unavailable secret store returns 503, and unregistered students get 403 on all lesson HTML/JS and quiz files.

Original HTML/JS/CSS assets are copied at build time without editing the source files. React handles the homepage only; legacy lesson documents intentionally retain their original runtime scripts and URLs. Do not replace them with blank React routes.

## 7 — Acceptance / release gate

- Anonymous frontend + preview URL cannot read any lesson or API data.
- Only the intended Google IdP and approved accounts can login.
- Student with signed Access identity but no name can render only onboarding.
- Registering a 2–40 character name persists in the dedicated Supabase project.
- Existing URLs, CSS and quiz scoring still work across 375, 768 and 1440px displays.
- Teacher can publish and roll back a CMS page and JS/CSS edit without rebuilding.
- CMS admin is Google+Payload protected and no public workers.dev/preview bypass exists.
- Supabase RLS, dependency checks and Cloudflare logs show no critical issues.
- No credentials are committed, and the original teacher domain remains untouched.
- Only after owner approval should the PR be opened into JJinMangGo/frontend-lecture:main.

**Blocked pending user action:** enable R2/Workers Paid, configure Google client/Access IdP, pick Supabase organization, create an isolated DB and share only non-secret configuration identifiers.
