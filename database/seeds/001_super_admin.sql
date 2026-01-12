-- ============================================
-- SUPER ADMIN SEED DATA
-- ============================================
-- Note: Run migration 006_add_super_admin_role.sql first!
-- Password for all test users: "password123"
-- bcrypt hash generated with cost factor 10

-- Create a system household for super admin
INSERT INTO households (id, name, base_currency) VALUES
    ('00000000-0000-0000-0000-000000000001', 'System Admin Household', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Super Admin User
-- Email: superadmin@expensetracker.com
-- Password: password123
INSERT INTO users (id, household_id, email, password_hash, name, role, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     'superadmin@expensetracker.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjEfV0YELR4GJQxqChBE.jmJOCTG4y',
     'Super Admin',
     'super_admin',
     TRUE)
ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    name = 'Super Admin';
