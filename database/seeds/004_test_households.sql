-- ============================================
-- TEST HOUSEHOLDS SEED DATA
-- ============================================
-- Creates 2 test households with admin users and regular users
-- Password for all test users: "password123"

-- ============================================
-- HOUSEHOLD 1: Smith Family
-- ============================================

INSERT INTO households (id, name, base_currency) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Smith Family', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Admin: John Smith
INSERT INTO users (id, household_id, email, password_hash, name, role, is_active) VALUES
    ('11111111-1111-1111-1111-000000000001',
     '11111111-1111-1111-1111-111111111111',
     'john.smith@example.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjEfV0YELR4GJQxqChBE.jmJOCTG4y',
     'John Smith',
     'admin',
     TRUE)
ON CONFLICT (email) DO NOTHING;

-- Regular user: Jane Smith
INSERT INTO users (id, household_id, email, password_hash, name, role, is_active) VALUES
    ('11111111-1111-1111-1111-000000000002',
     '11111111-1111-1111-1111-111111111111',
     'jane.smith@example.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjEfV0YELR4GJQxqChBE.jmJOCTG4y',
     'Jane Smith',
     'regular',
     TRUE)
ON CONFLICT (email) DO NOTHING;

-- Categories for Smith Family
INSERT INTO categories (id, household_id, name, type, icon, color) VALUES
    -- Expense categories
    ('11111111-2222-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Groceries', 'expense', 'ShoppingCart', '#10B981'),
    ('11111111-2222-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Dining Out', 'expense', 'UtensilsCrossed', '#F59E0B'),
    ('11111111-2222-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Transportation', 'expense', 'Car', '#3B82F6'),
    ('11111111-2222-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Entertainment', 'expense', 'Film', '#8B5CF6'),
    ('11111111-2222-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Utilities', 'expense', 'Lightbulb', '#EF4444'),
    ('11111111-2222-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Healthcare', 'expense', 'Heart', '#EC4899'),
    ('11111111-2222-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Shopping', 'expense', 'ShoppingBag', '#14B8A6'),
    ('11111111-2222-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Housing', 'expense', 'Home', '#06B6D4'),
    -- Income categories
    ('11111111-2222-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Salary', 'income', 'DollarSign', '#22C55E'),
    ('11111111-2222-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Freelance', 'income', 'Briefcase', '#3B82F6'),
    ('11111111-2222-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Investment', 'income', 'TrendingUp', '#8B5CF6')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- HOUSEHOLD 2: Garcia Family
-- ============================================

INSERT INTO households (id, name, base_currency) VALUES
    ('22222222-2222-2222-2222-222222222222', 'Garcia Family', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Admin: Maria Garcia
INSERT INTO users (id, household_id, email, password_hash, name, role, is_active) VALUES
    ('22222222-2222-2222-2222-000000000001',
     '22222222-2222-2222-2222-222222222222',
     'maria.garcia@example.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjEfV0YELR4GJQxqChBE.jmJOCTG4y',
     'Maria Garcia',
     'admin',
     TRUE)
ON CONFLICT (email) DO NOTHING;

-- Regular user: Carlos Garcia
INSERT INTO users (id, household_id, email, password_hash, name, role, is_active) VALUES
    ('22222222-2222-2222-2222-000000000002',
     '22222222-2222-2222-2222-222222222222',
     'carlos.garcia@example.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjEfV0YELR4GJQxqChBE.jmJOCTG4y',
     'Carlos Garcia',
     'regular',
     TRUE)
ON CONFLICT (email) DO NOTHING;

-- Categories for Garcia Family
INSERT INTO categories (id, household_id, name, type, icon, color) VALUES
    -- Expense categories
    ('22222222-3333-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Groceries', 'expense', 'ShoppingCart', '#10B981'),
    ('22222222-3333-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Restaurants', 'expense', 'UtensilsCrossed', '#F59E0B'),
    ('22222222-3333-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Gas & Auto', 'expense', 'Car', '#3B82F6'),
    ('22222222-3333-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Entertainment', 'expense', 'Film', '#8B5CF6'),
    ('22222222-3333-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Bills', 'expense', 'FileText', '#EF4444'),
    ('22222222-3333-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Kids', 'expense', 'Baby', '#EC4899'),
    ('22222222-3333-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'Clothing', 'expense', 'Shirt', '#14B8A6'),
    ('22222222-3333-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'Home Improvement', 'expense', 'Wrench', '#06B6D4'),
    -- Income categories
    ('22222222-3333-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'Salary', 'income', 'DollarSign', '#22C55E'),
    ('22222222-3333-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', 'Side Business', 'income', 'Store', '#3B82F6'),
    ('22222222-3333-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 'Rental Income', 'income', 'Building', '#8B5CF6')
ON CONFLICT (id) DO NOTHING;
