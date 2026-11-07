-- Phase 2 Security Hardening: Stable External Subject ID and Identity Protection
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users (google_sub) WHERE google_sub IS NOT NULL;

