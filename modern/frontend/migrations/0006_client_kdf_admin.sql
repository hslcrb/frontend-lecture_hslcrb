-- Security compatibility: legacy credentials retain server-side PBKDF2 verification.
-- New accounts use PBKDF2-SHA256 (120,000 iterations) on the client
-- and a server-secret HMAC verifier so Workers Free does not run slow KDFs.
ALTER TABLE lab_teacher_credentials ADD COLUMN hash_scheme TEXT NOT NULL DEFAULT 'server_pbkdf2_v1';
