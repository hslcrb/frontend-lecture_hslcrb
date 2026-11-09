-- Blue Renaissance 2: native D1 lesson content and revisions.
-- Keep legacy lab_course_sources as a read-only rollback archive.
CREATE TABLE IF NOT EXISTS br_lessons (
  slug TEXT PRIMARY KEY,
  source_path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '일반',
  summary TEXT NOT NULL DEFAULT '',
  draft_html TEXT NOT NULL DEFAULT '',
  published_html TEXT,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  CHECK(length(slug) BETWEEN 3 AND 100),
  CHECK(length(title) BETWEEN 1 AND 180),
  CHECK(length(draft_html) <= 450000)
);
CREATE INDEX IF NOT EXISTS idx_br_lessons_catalog ON br_lessons(published,category,sort_order);
CREATE TABLE IF NOT EXISTS br_lesson_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL REFERENCES br_lessons(slug) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_html TEXT NOT NULL,
  action TEXT NOT NULL,
  edited_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_br_lesson_versions_lookup ON br_lesson_versions(slug,id DESC);
CREATE TABLE IF NOT EXISTS br_legacy_quiz_map (
  legacy_path TEXT PRIMARY KEY,
  quiz_slug TEXT NOT NULL REFERENCES lab_quiz_sets(slug),
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);
