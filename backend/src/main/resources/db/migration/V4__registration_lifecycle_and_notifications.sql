-- Phase 4: Registration Lifecycle, Concurrency & Notifications
-- 1. Remove rigid check constraints to allow new notification and registration types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Guarantee unique participant registration per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_event_participant ON registrations(event_id, participant_id);

-- 3. Optimized composite index for event capacity counts
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON registrations(event_id, status);

-- 4. Optimized index for participant registration lookup
CREATE INDEX IF NOT EXISTS idx_registrations_participant_date ON registrations(participant_id, registered_at DESC);

-- 5. Optimized index for recipient notification querying and unread counts
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_date ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id) WHERE read_at IS NULL;

