# Security and privacy, free edition

- Cloudflare Access permits any Google identity (not arbitrary unauthenticated traffic); the only enabled login method for this app is Frontend Lab Google. Workers verify the Access-signed RS256 JWT, team issuer and AUD again.
- Students must input a separate name before lecture HTML, JavaScript/CSS, quiz and original homepage data are available. These student records are stored in D1.
- Only the verified Google account spacejh72@gmail.com is teacher. In addition to Google login, teacher must authenticate using a password, with a short-lived hashed session token in an HttpOnly/Secure/SameSite=Strict cookie. Admin APIs require both.
- Teacher password is not stored in plaintext. Each credential uses a random salt + PBKDF2-SHA256 (120k iterations). A strong 12+ character passphrase is recommended. D1 record persists while browser sessions expire at 12 hours.
- Five wrong password attempts cause a 15-minute lock. Password setup is allowed only while no teacher credential exists.
- Email recovery uses a crypto-secure 256-bit token; only SHA-256 of token is stored in D1. Valid for 15 minutes, used once. Resets revoke all existing sessions. Sending to the teacher mailbox is blocked until Cloudflare Email Routing recipient verification.
- All mutations check exact Origin + JSON Content-Type + X-Frontend-Lab header and use parameterized D1 statements. No plain passwords/tokens are logged or committed.
- Both workers.dev and preview URLs are disabled. Access is attached to the custom domain.
- Google OAuth external Testing vs Production is a separate Google Cloud setting. Cloudflare Free seats and D1/Worker quotas are not infinite; no email whitelist does not mean unlimited usage.
- The teacher's original GitHub Pages site remains publicly available and is outside the new Cloudflare Access control.
- This is not a substitute for real-browser authentication tests, teacher account consent, or a student personal-information collection/retention notice.
