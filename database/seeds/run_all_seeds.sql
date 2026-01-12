-- ============================================
-- RUN ALL SEED FILES
-- ============================================
-- Execute this file to run all seeds in order:
-- psql -U samer -d expense_tracker -h localhost -f database/seeds/run_all_seeds.sql

-- First, run the migration to add super_admin role
\echo 'Running migration: 006_add_super_admin_role.sql'
\i ../migrations/006_add_super_admin_role.sql

-- Run seeds in order
\echo 'Running seed: 001_super_admin.sql'
\i 001_super_admin.sql

\echo 'Running seed: 002_default_plans.sql'
\i 002_default_plans.sql

\echo 'Running seed: 003_default_categories.sql (skipping - requires demo_household_id variable)'
-- \i 003_default_categories.sql

\echo 'Running seed: 004_test_households.sql'
\i 004_test_households.sql

\echo 'Running seed: 005_test_accounts_transactions.sql'
\i 005_test_accounts_transactions.sql

\echo 'All seeds completed successfully!'

-- ============================================
-- TEST USER CREDENTIALS
-- ============================================
-- All test users have the password: password123
--
-- Super Admin:
--   Email: superadmin@expensetracker.com
--   Password: password123
--   Role: super_admin
--
-- Smith Family (Household 1):
--   Admin: john.smith@example.com / password123
--   Regular: jane.smith@example.com / password123
--
-- Garcia Family (Household 2):
--   Admin: maria.garcia@example.com / password123
--   Regular: carlos.garcia@example.com / password123
-- ============================================
