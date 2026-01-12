-- ============================================
-- ADD SUPER_ADMIN ROLE TO USERS TABLE
-- ============================================

-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new check constraint that includes super_admin
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'regular', 'super_admin'));
