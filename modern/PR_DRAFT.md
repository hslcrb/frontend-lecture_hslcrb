# Proposed PR — not submitted

Title: feat: optional private React Frontend Lab with Payload CMS on Cloudflare

## Purpose
Modernize the teacher's lecture site without rewriting or deleting the existing teaching materials and HTML/CSS/JS design system.

## Additions
- Standalone React 19 portal and Cloudflare Worker with signed Google/Access JWT validation.
- Separate mandatory student-name registration in dedicated RLS-protected Supabase.
- Payload CMS 3 (official Cloudflare D1/R2 Next.js 16 template), versioned HTML/JS/CSS content with published/draft rollback.
- Preserve original quiz scoring, demos, lesson file URLs and visual layout.
- Replace only card emoji with 31 original SVG icons.
- Add local tests and deployment/security/teacher onboarding docs.

## Preservation
The original 31 HTML teaching pages and their assets stay in place at repository root. The modern build copies them at build time, and no live domain cutover occurs.

## Remaining acceptance work
Real Google Access provider/AUD, R2 enablement, dedicated Supabase project, D1 migrations, browser quiz and UI regression checks, and owner-approved domain migration. No PR until the user explicitly authorizes submission.

## Copyright
Retain upstream JJinMangGo ownership. This PR does not introduce a license to the teacher's teaching materials.
