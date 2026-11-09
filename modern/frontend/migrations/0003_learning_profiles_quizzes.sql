-- Frontend Lab learning features. Additive and rerunnable on the existing D1.
-- All authenticated access is enforced by the Worker; this SQL grants no browser access.
CREATE TABLE IF NOT EXISTS lab_student_profiles (
  access_subject TEXT PRIMARY KEY REFERENCES lab_students(access_subject) ON DELETE CASCADE,
  student_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lab_quiz_sets (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  draft_json TEXT NOT NULL DEFAULT '[]',
  published_json TEXT,
  published_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  edited_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_lab_quizzes_published ON lab_quiz_sets(published_at);
CREATE TABLE IF NOT EXISTS lab_quiz_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL REFERENCES lab_quiz_sets(slug) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  questions_json TEXT NOT NULL,
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  edited_by TEXT NOT NULL,
  UNIQUE(slug,version)
);
CREATE INDEX IF NOT EXISTS idx_lab_quiz_versions_slug ON lab_quiz_versions(slug,version DESC);
CREATE TABLE IF NOT EXISTS lab_quiz_attempts (
  attempt_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES lab_student_profiles(student_id),
  access_subject TEXT NOT NULL,
  quiz_key TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  quiz_kind TEXT NOT NULL CHECK (quiz_kind IN ('managed','legacy')),
  quiz_version INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
  total_count INTEGER NOT NULL CHECK (total_count >= 1),
  score_percent INTEGER NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lab_attempt_student_date ON lab_quiz_attempts(access_subject,submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_attempt_student_id ON lab_quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_lab_attempt_quiz ON lab_quiz_attempts(quiz_key,submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_attempt_date ON lab_quiz_attempts(submitted_at DESC);
