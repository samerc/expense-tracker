-- ============================================
-- SEED DATA FOR EXPENSE TRACKER
-- ============================================

-- ============================================
-- SYSTEM CATEGORIES (household_id = NULL)
-- ============================================

INSERT INTO categories (id, household_id, name, type, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', NULL, 'Balance Adjustment', 'system', TRUE),
    ('00000000-0000-0000-0000-000000000002', NULL, 'Transfer', 'system', TRUE);

-- ============================================
-- TEST HOUSEHOLD
-- ============================================

INSERT INTO households (id, name, base_currency) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Samer Family', 'USD');

-- ============================================
-- ADMIN USER
-- Password: "password123"
-- In production, this will be properly hashed
-- ============================================

INSERT INTO users (id, household_id, email, password_hash, name, role) VALUES
    ('20000000-0000-0000-0000-000000000001', 
     '10000000-0000-0000-0000-000000000001',
     'samer@example.com',
     '$2a$10$rKJHxQ7mZ8kLxN8K.vQYYeXqZ9W8KqN5Lx8wX5qN8vY9zN6Kx7Lx8',
     'Samer',
     'admin');

-- ============================================
-- HOUSEHOLD CATEGORIES
-- ============================================

INSERT INTO categories (id, household_id, name, type, icon, color) VALUES
    -- Expense categories
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Groceries', 'expense', '🛒', '#4CAF50'),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Dining Out', 'expense', '🍽️', '#FF9800'),
    ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Transportation', 'expense', '🚗', '#2196F3'),
    ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Entertainment', 'expense', '🎬', '#9C27B0'),
    ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Utilities', 'expense', '💡', '#FF5722'),
    ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Insurance', 'expense', '🛡️', '#607D8B'),
    ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Healthcare', 'expense', '🏥', '#F44336'),
    ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'Shopping', 'expense', '🛍️', '#E91E63'),
    ('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Education', 'expense', '📚', '#3F51B5'),
    ('30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'Housing', 'expense', '🏠', '#795548'),
    
    -- Income categories
    ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'Salary', 'income', '💰', '#8BC34A'),
    ('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'Freelance', 'income', '💼', '#CDDC39'),
    ('30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'Investment', 'income', '📈', '#009688'),
    ('30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001', 'Gift', 'income', '🎁', '#00BCD4');

-- ============================================
-- ACCOUNTS
-- ============================================

INSERT INTO accounts (id, household_id, name, type, currency, initial_balance) VALUES
    ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Main Checking', 'bank', 'USD', 5000.00),
    ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Savings Account', 'bank', 'USD', 10000.00),
    ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Credit Card', 'credit', 'USD', 0.00),
    ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Cash Wallet', 'cash', 'USD', 200.00),
    ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'EUR Account', 'bank', 'EUR', 1000.00);

-- ============================================
-- SAMPLE TRANSACTIONS
-- ============================================

-- Transaction 1: Simple grocery expense
INSERT INTO transactions (id, household_id, date, description, type, created_by) VALUES
    ('50000000-0000-0000-0000-000000000001', 
     '10000000-0000-0000-0000-000000000001',
     '2025-01-15',
     'Supermarket shopping',
     'standard',
     '20000000-0000-0000-0000-000000000001');

INSERT INTO transaction_lines (transaction_id, account_id, amount, currency, exchange_rate_to_base, exchange_rate_date, base_currency_amount, direction, category_id) VALUES
    ('50000000-0000-0000-0000-000000000001',
     '40000000-0000-0000-0000-000000000001', -- Main Checking
     -87.50,
     'USD',
     1.0,
     '2025-01-15',
     -87.50,
     'expense',
     '30000000-0000-0000-0000-000000000001'); -- Groceries

-- Transaction 2: Salary income
INSERT INTO transactions (id, household_id, date, description, type, created_by) VALUES
    ('50000000-0000-0000-0000-000000000002', 
     '10000000-0000-0000-0000-000000000001',
     '2025-01-01',
     'January salary',
     'standard',
     '20000000-0000-0000-0000-000000000001');

INSERT INTO transaction_lines (transaction_id, account_id, amount, currency, exchange_rate_to_base, exchange_rate_date, base_currency_amount, direction, category_id) VALUES
    ('50000000-0000-0000-0000-000000000002',
     '40000000-0000-0000-0000-000000000001', -- Main Checking
     3500.00,
     'USD',
     1.0,
     '2025-01-01',
     3500.00,
     'income',
     '30000000-0000-0000-0000-000000000011'); -- Salary

-- Transaction 3: Transfer between accounts
INSERT INTO transactions (id, household_id, date, description, type, created_by) VALUES
    ('50000000-0000-0000-0000-000000000003', 
     '10000000-0000-0000-0000-000000000001',
     '2025-01-05',
     'Transfer to savings',
     'transfer',
     '20000000-0000-0000-0000-000000000001');

INSERT INTO transaction_lines (transaction_id, account_id, amount, currency, exchange_rate_to_base, exchange_rate_date, base_currency_amount, direction, category_id) VALUES
    ('50000000-0000-0000-0000-000000000003',
     '40000000-0000-0000-0000-000000000001', -- Main Checking (source)
     -1000.00,
     'USD',
     1.0,
     '2025-01-05',
     -1000.00,
     'transfer',
     NULL),
    ('50000000-0000-0000-0000-000000000003',
     '40000000-0000-0000-0000-000000000002', -- Savings (destination)
     1000.00,
     'USD',
     1.0,
     '2025-01-05',
     1000.00,
     'transfer',
     NULL);

-- Transaction 4: Split transaction (restaurant + tip)
INSERT INTO transactions (id, household_id, date, description, type, created_by) VALUES
    ('50000000-0000-0000-0000-000000000004', 
     '10000000-0000-0000-0000-000000000001',
     '2025-01-10',
     'Dinner at restaurant',
     'standard',
     '20000000-0000-0000-0000-000000000001');

INSERT INTO transaction_lines (transaction_id, account_id, amount, currency, exchange_rate_to_base, exchange_rate_date, base_currency_amount, direction, category_id, notes) VALUES
    ('50000000-0000-0000-0000-000000000004',
     '40000000-0000-0000-0000-000000000003', -- Credit Card
     -85.00,
     'USD',
     1.0,
     '2025-01-10',
     -85.00,
     'expense',
     '30000000-0000-0000-0000-000000000002', -- Dining Out
     'Main bill'),
    ('50000000-0000-0000-0000-000000000004',
     '40000000-0000-0000-0000-000000000003', -- Credit Card
     -15.00,
     'USD',
     1.0,
     '2025-01-10',
     -15.00,
     'expense',
     '30000000-0000-0000-0000-000000000002', -- Dining Out
     'Tip');

-- Transaction 5: Multi-currency expense
INSERT INTO transactions (id, household_id, date, description, type, created_by) VALUES
    ('50000000-0000-0000-0000-000000000005', 
     '10000000-0000-0000-0000-000000000001',
     '2025-01-12',
     'Online shopping from EU',
     'standard',
     '20000000-0000-0000-0000-000000000001');

INSERT INTO transaction_lines (transaction_id, account_id, amount, currency, exchange_rate_to_base, exchange_rate_date, base_currency_amount, direction, category_id) VALUES
    ('50000000-0000-0000-0000-000000000005',
     '40000000-0000-0000-0000-000000000005', -- EUR Account
     -50.00,
     'EUR',
     1.10, -- 1 EUR = 1.10 USD
     '2025-01-12',
     -55.00, -- 50 * 1.10
     'expense',
     '30000000-0000-0000-0000-000000000008'); -- Shopping

-- ============================================
-- ALLOCATIONS
-- ============================================

-- January 2025 allocations
INSERT INTO allocations (id, household_id, name, category_ids, planned_amount, planned_currency, period_type, period_start_date, period_end_date) VALUES
    ('60000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Groceries - January',
     ARRAY['30000000-0000-0000-0000-000000000001'::UUID],
     600.00,
     'USD',
     'monthly',
     '2025-01-01',
     '2025-01-31'),
    ('60000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000001',
     'Dining Out - January',
     ARRAY['30000000-0000-0000-0000-000000000002'::UUID],
     300.00,
     'USD',
     'monthly',
     '2025-01-01',
     '2025-01-31'),
    ('60000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000001',
     'Entertainment - January',
     ARRAY['30000000-0000-0000-0000-000000000004'::UUID],
     200.00,
     'USD',
     'monthly',
     '2025-01-01',
     '2025-01-31');

-- Link some transactions to allocations
INSERT INTO transaction_line_allocations (transaction_line_id, allocation_id, linked_manually) VALUES
    ((SELECT id FROM transaction_lines WHERE transaction_id = '50000000-0000-0000-0000-000000000001' LIMIT 1),
     '60000000-0000-0000-0000-000000000001', -- Groceries allocation
     FALSE);

-- ============================================
-- BUDGETS
-- ============================================

INSERT INTO budgets (household_id, category_id, planned_amount, planned_currency, month, alert_threshold_percent) VALUES
    ('10000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001', -- Groceries
     600.00,
     'USD',
     '2025-01',
     80),
    ('10000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002', -- Dining Out
     400.00,
     'USD',
     '2025-01',
     80),
    ('10000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000003', -- Transportation
     250.00,
     'USD',
     '2025-01',
     85);
