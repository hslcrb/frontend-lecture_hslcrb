# Security and privacy model

- **Authentication** — Cloudflare Access verifies Google identity at the edge. React Worker verifies signed RS256 JWT with the configured Access app AUD and team JWKS again. Email/subject HTTP headers alone are never trusted.
- **Enrollment** — an independent student-name form is mandatory after Google login. No lecture HTML, quiz JS/CSS, CMS HTML, or original-home endpoint is served before enrollment. Browser boot assets are deliberately allowed so the form can load.
- **Student data** — Supabase PostgreSQL table with server-only service-role access, RLS enabled and public grants revoked. Store only Access subject, verified email, name, creation and update timestamps. No public roster endpoint or anonymous table policy.
- **Admin boundary** — private CMS Worker on a teacher-only Google Access application, plus Payload's own authentication and authorization. Only authenticated Payload users may edit pages/assets. Published documents are readable by the bound frontend service.
- **Service binding** — the React Worker calls the CMS Worker internally; it does not forward a teacher password or expose a bearer token to students. Cloudflare does not propagate ctx.access over service bindings, so do not infer downstream identity from it.
- **Fail closed** — incorrect Access team/AUD or invalid JWT yields denied requests; unavailable Supabase results in 503 rather than bypassing name registration.
- **Data minimization** — define a school-approved purpose, student/guardian notice where applicable, retention duration, correction/deletion process, access logging limits and an authorized teacher administrator before live deployment.
- **Teacher source** — original repository and its currently public GitHub Pages URL remain public; protecting the new Cloudflare Worker does not retroactively hide these files.
- **CMS editors** — HTML/JS edit capability is effectively code execution in student browsers. Restrict CMS write access to trusted instructors, audit versions, and test content before publishing. Cloudflare Access is one layer, not a security substitute for author review.
- **Operational review** — test all routes through workers.dev, preview URL and custom domains; revoke leaked credentials; run Supabase Security Advisors and keep dependencies patched.
