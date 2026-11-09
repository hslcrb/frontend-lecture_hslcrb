-- Teacher-only additional password and one-time email recovery. Passwords are NEVER stored.
CREATE TABLE IF NOT EXISTS lab_teacher_credentials (
  email TEXT PRIMARY KEY,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  hash_iterations INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lab_teacher_sessions (
  session_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  access_subject TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (email) REFERENCES lab_teacher_credentials(email) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lab_teacher_session_expiry ON lab_teacher_sessions(expires_at);
CREATE TABLE IF NOT EXISTS lab_teacher_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (email) REFERENCES lab_teacher_credentials(email) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lab_teacher_reset_expiry ON lab_teacher_reset_tokens(expires_at);
