-- Blue Renaissance: content-source archive for the existing lecture HTML.
-- Static CSS/JS/media remain on Cloudflare assets; existing CMS lab_content is the editorial override.
CREATE TABLE IF NOT EXISTS lab_course_sources (
  path TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_html TEXT NOT NULL,
  source_sha TEXT NOT NULL,
  imported_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (length(path) BETWEEN 1 AND 255),
  CHECK (length(source_html) BETWEEN 1 AND 500000)
);
CREATE INDEX IF NOT EXISTS idx_lab_course_sources_updated ON lab_course_sources(updated_at);
