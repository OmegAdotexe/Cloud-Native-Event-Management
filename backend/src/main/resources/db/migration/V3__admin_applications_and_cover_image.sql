-- Phase 3: Event Admin Approval Management & Cover Image Support
-- 1. Support direct cover image storage on events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(1000);

-- 2. Create admin_applications table for Event Admin onboarding
CREATE TABLE IF NOT EXISTS admin_applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    organization_role VARCHAR(255),
    statement TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    rejection_reason TEXT,
    reviewed_by_id BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_app_status ON admin_applications(status);
CREATE INDEX IF NOT EXISTS idx_admin_app_user ON admin_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_app_email ON admin_applications(email);

-- 3. Create admin_application_audits table for tracking all decision steps
CREATE TABLE IF NOT EXISTS admin_application_audits (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES admin_applications(id) ON DELETE CASCADE,
    actor_id BIGINT NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_app_audit_app_id ON admin_application_audits(application_id);
