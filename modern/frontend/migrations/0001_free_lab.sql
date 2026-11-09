-- Frontend Lab FREE. Dedicated D1 database: frontend-lab-cms.
-- Run via wrangler d1 migrations apply (remote) or Cloudflare D1 API.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lab_students (
  access_subject TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  student_name TEXT NOT NULL CHECK (length(trim(student_name)) BETWEEN 2 AND 40),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lab_students_email ON lab_students(email);

CREATE TABLE IF NOT EXISTS lab_content (
  path TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('html','css','js')),
  draft_source TEXT NOT NULL,
  published_source TEXT,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0,1)),
  edited_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_lab_content_updated ON lab_content(updated_at);

CREATE TABLE IF NOT EXISTS lab_content_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL REFERENCES lab_content(path) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('publish','hide','show','restore')),
  previous_source TEXT,
  previous_hidden INTEGER NOT NULL DEFAULT 0 CHECK (previous_hidden IN (0,1)),
  actor_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lab_versions_path ON lab_content_versions(path,id DESC);
