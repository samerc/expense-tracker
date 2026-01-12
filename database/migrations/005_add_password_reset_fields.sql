-- ============================================
-- ADD PASSWORD RESET FIELDS TO USERS TABLE
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token);
