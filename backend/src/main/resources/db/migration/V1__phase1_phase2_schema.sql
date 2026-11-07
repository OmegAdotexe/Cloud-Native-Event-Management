-- Phase 1 & Phase 2 Schema Synchronization Migration
-- 1. Ensure user columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_operator BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(1000);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'APPROVED';

-- 2. Ensure events table has institutional_only column
ALTER TABLE events ADD COLUMN IF NOT EXISTS institutional_only BOOLEAN DEFAULT FALSE;

-- 3. Add index on event duplicate check fields for fast lookups
CREATE INDEX IF NOT EXISTS idx_events_duplicate_check ON events (created_by_id, title, venue, start_time);

