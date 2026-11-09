# Frontend Lab - Live deployment & remaining verification

Production: https://frontend-lab.rhee.life
Cloudflare Worker: frontend-lab-web
GitHub source: hslcrb/frontend-lecture_hslcrb
GitHub production branch: main (fork)
Historical development branch: feat/cloudflare-free-d1-cms-20261109
Build root: modern/frontend
Build: npm test && npm run build
Deploy: npx wrangler deploy
Google Access app: Frontend Lab — Google login
Google IdP: Frontend Lab Google
Policy: Allow Everyone, Google IDP only; no email whitelist
Access team: long-flower-8d9c.cloudflareaccess.com
Access AUD: 9223d412d1840b0bd76ae01e4eb4d2ebe44311aebfa633e3eb37e1d7af70c925
D1: frontend-lab-cms
D1 ID: 84a90c4b-fdc4-4bc0-9030-acf7ba26f069

## Teacher-only tasks remaining
1. Ask the teacher who controls spacejh72@gmail.com to open the Cloudflare destination-address verification invitation and click Verify email address. Until then, the free email recovery service cannot deliver reset emails. No one else can approve possession of that mailbox.
2. In Google Cloud Auth Platform -> Audience, switch the Google OAuth app to Production if it is still Testing. Cloudflare's Allow Everyone policy does not override Google's Testing restrictions.
3. After Google login, visit https://frontend-lab.rhee.life/admin from spacejh72@gmail.com. Set a strong administrator password of 12-128 characters ONCE; it remains in D1 across redeployments. Later logins require Google + password, session expires after 12h.
4. Verify password reset: Forgot Password -> mail link valid for 15min once -> update password. Previously issued admin sessions become invalid.
5. Test a separate student Google account -> input a name -> open each lecture/quiz. Another Google account not signed into teacher must get 403 on /admin.

## Confirmed / not confirmed
- Confirmed: Cloudflare Worker deployment and 140 static assets, live custom domain binding, Access policy and AUD matching, D1 tables created, synthetic D1 CRUD tested.
- Not confirmed: real browser Google authorization, teacher mailbox verification, actual recovery-email delivery, page/quiz visual regression and teacher password setup.

## Data/privacy
Students can be from any Google account, but Cloudflare Access Free seat and Workers/D1 usage limits remain. D1 records only Access subject, verified email, entered name and timestamps. Before classroom rollout the teacher should approve data handling purpose, notice, retention and deletion.

No paid Payload, R2, or Supabase project is necessary. No upstream PR sent.

## Project documentation

See [full development history](DEVELOPMENT_HISTORY.md), [architecture](ARCHITECTURE.md), [operations and rollback](OPERATIONS.md), and [validation checklist](VALIDATION.md).
