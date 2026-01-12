-- ============================================
-- ADD PREFERENCES COLUMN TO USERS TABLE
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
