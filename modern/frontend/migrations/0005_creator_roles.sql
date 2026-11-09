-- Blue Renaissance CMS rank-based administrator grants.
-- Rank 0 creator and rank 1 teacher are immutable owner-controlled environment identities.
-- D1 stores only rank 2 delegated administrators chosen from registered students.
CREATE TABLE IF NOT EXISTS lab_admin_grants (
  access_subject TEXT PRIMARY KEY REFERENCES lab_students(access_subject) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role = 'admin'),
  granted_by_email TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_lab_admin_grants_active ON lab_admin_grants(revoked_at);
CREATE TABLE IF NOT EXISTS lab_admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email TEXT NOT NULL,
  target_subject TEXT NOT NULL,
  target_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('grant','revoke')),
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lab_admin_audit_recent ON lab_admin_audit(recorded_at DESC);
