-- ============================================
-- TEST ACCOUNTS AND TRANSACTIONS SEED DATA
-- ============================================
-- Run after 004_test_households.sql

-- ============================================
-- ACCOUNTS FOR SMITH FAMILY
-- ============================================

INSERT INTO accounts (id, household_id, name, type, currency, initial_balance, is_active) VALUES
    ('11111111-4444-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chase Checking', 'bank', 'USD', 5500.00, TRUE),
    ('11111111-4444-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Chase Savings', 'bank', 'USD', 15000.00, TRUE),
    ('11111111-4444-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Visa Credit Card', 'credit', 'USD', 0.00, TRUE),
    ('11111111-4444-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Cash', 'cash', 'USD', 300.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ACCOUNTS FOR GARCIA FAMILY
-- ============================================

INSERT INTO accounts (id, household_id, name, type, currency, initial_balance, is_active) VALUES
    ('22222222-4444-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Bank of America Checking', 'bank', 'USD', 3200.00, TRUE),
    ('22222222-4444-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Ally Savings', 'bank', 'USD', 8500.00, TRUE),
    ('22222222-4444-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Amex Gold', 'credit', 'USD', 0.00, TRUE),
    ('22222222-4444-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'PayPal', 'wallet', 'USD', 450.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TRANSACTIONS FOR SMITH FAMILY
-- ============================================

-- Transaction 1: January Salary (John)
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('11111111-5555-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-01-01', 'January Salary - John', 'standard', '11111111-1111-1111-1111-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('11111111-6666-0000-0000-000000000001', '11111111-5555-0000-0000-000000000001', '11111111-4444-0000-0000-000000000001', 4500.00, 'USD', 1.0, 4500.00, 'income', '11111111-2222-0000-0000-000000000010')
ON CONFLICT (id) DO NOTHING;

-- Transaction 2: Grocery shopping at Costco
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('11111111-5555-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '2026-01-03', 'Costco weekly groceries', 'standard', '11111111-1111-1111-1111-000000000002', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('11111111-6666-0000-0000-000000000002', '11111111-5555-0000-0000-000000000002', '11111111-4444-0000-0000-000000000003', -187.45, 'USD', 1.0, -187.45, 'expense', '11111111-2222-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Transaction 3: Electric bill
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('11111111-5555-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '2026-01-05', 'Electric bill - January', 'standard', '11111111-1111-1111-1111-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('11111111-6666-0000-0000-000000000003', '11111111-5555-0000-0000-000000000003', '11111111-4444-0000-0000-000000000001', -145.80, 'USD', 1.0, -145.80, 'expense', '11111111-2222-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- Transaction 4: Date night dinner
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('11111111-5555-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '2026-01-06', 'Dinner at Olive Garden', 'standard', '11111111-1111-1111-1111-000000000002', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('11111111-6666-0000-0000-000000000004', '11111111-5555-0000-0000-000000000004', '11111111-4444-0000-0000-000000000003', -78.50, 'USD', 1.0, -78.50, 'expense', '11111111-2222-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Transaction 5: Gas station
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('11111111-5555-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '2026-01-07', 'Shell gas station', 'standard', '11111111-1111-1111-1111-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('11111111-6666-0000-0000-000000000005', '11111111-5555-0000-0000-000000000005', '11111111-4444-0000-0000-000000000003', -52.30, 'USD', 1.0, -52.30, 'expense', '11111111-2222-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Transaction 6: Transfer to savings
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('11111111-5555-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '2026-01-02', 'Monthly savings transfer', 'transfer', '11111111-1111-1111-1111-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('11111111-6666-0000-0000-000000000006', '11111111-5555-0000-0000-000000000006', '11111111-4444-0000-0000-000000000001', -500.00, 'USD', 1.0, -500.00, 'transfer', NULL),
    ('11111111-6666-0000-0000-000000000007', '11111111-5555-0000-0000-000000000006', '11111111-4444-0000-0000-000000000002', 500.00, 'USD', 1.0, 500.00, 'transfer', NULL)
ON CONFLICT (id) DO NOTHING;

-- Transaction 7: Netflix subscription
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('11111111-5555-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '2026-01-01', 'Netflix monthly', 'standard', '11111111-1111-1111-1111-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('11111111-6666-0000-0000-000000000008', '11111111-5555-0000-0000-000000000007', '11111111-4444-0000-0000-000000000003', -15.99, 'USD', 1.0, -15.99, 'expense', '11111111-2222-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- Transaction 8: Freelance income
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('11111111-5555-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '2026-01-05', 'Web design project payment', 'standard', '11111111-1111-1111-1111-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('11111111-6666-0000-0000-000000000009', '11111111-5555-0000-0000-000000000008', '11111111-4444-0000-0000-000000000001', 750.00, 'USD', 1.0, 750.00, 'income', '11111111-2222-0000-0000-000000000011')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TRANSACTIONS FOR GARCIA FAMILY
-- ============================================

-- Transaction 1: January Salary (Maria)
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '2026-01-01', 'January Salary - Maria', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000001', '22222222-5555-0000-0000-000000000001', '22222222-4444-0000-0000-000000000001', 3800.00, 'USD', 1.0, 3800.00, 'income', '22222222-3333-0000-0000-000000000010')
ON CONFLICT (id) DO NOTHING;

-- Transaction 2: Grocery shopping at Walmart
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-01-04', 'Walmart groceries', 'standard', '22222222-2222-2222-2222-000000000002', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000002', '22222222-5555-0000-0000-000000000002', '22222222-4444-0000-0000-000000000003', -156.78, 'USD', 1.0, -156.78, 'expense', '22222222-3333-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Transaction 3: Gas for the car
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '2026-01-05', 'Chevron gas fill-up', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000003', '22222222-5555-0000-0000-000000000003', '22222222-4444-0000-0000-000000000001', -67.45, 'USD', 1.0, -67.45, 'expense', '22222222-3333-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Transaction 4: Restaurant lunch
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', '2026-01-06', 'Chipotle lunch', 'standard', '22222222-2222-2222-2222-000000000002', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000004', '22222222-5555-0000-0000-000000000004', '22222222-4444-0000-0000-000000000003', -24.50, 'USD', 1.0, -24.50, 'expense', '22222222-3333-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Transaction 5: Kids school supplies
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', '2026-01-03', 'Target - school supplies', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000005', '22222222-5555-0000-0000-000000000005', '22222222-4444-0000-0000-000000000003', -89.99, 'USD', 1.0, -89.99, 'expense', '22222222-3333-0000-0000-000000000006')
ON CONFLICT (id) DO NOTHING;

-- Transaction 6: Internet bill
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', '2026-01-07', 'Xfinity Internet', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000006', '22222222-5555-0000-0000-000000000006', '22222222-4444-0000-0000-000000000001', -79.99, 'USD', 1.0, -79.99, 'expense', '22222222-3333-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- Transaction 7: Movie tickets
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', '2026-01-06', 'AMC movie tickets', 'standard', '22222222-2222-2222-2222-000000000002', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000007', '22222222-5555-0000-0000-000000000007', '22222222-4444-0000-0000-000000000004', -45.00, 'USD', 1.0, -45.00, 'expense', '22222222-3333-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- Transaction 8: Side business income
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', '2026-01-04', 'Etsy shop sales', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000008', '22222222-5555-0000-0000-000000000008', '22222222-4444-0000-0000-000000000004', 320.00, 'USD', 1.0, 320.00, 'income', '22222222-3333-0000-0000-000000000011')
ON CONFLICT (id) DO NOTHING;

-- Transaction 9: Transfer to savings
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', '2026-01-02', 'Savings transfer', 'transfer', '22222222-2222-2222-2222-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000009', '22222222-5555-0000-0000-000000000009', '22222222-4444-0000-0000-000000000001', -400.00, 'USD', 1.0, -400.00, 'transfer', NULL),
    ('22222222-6666-0000-0000-000000000010', '22222222-5555-0000-0000-000000000009', '22222222-4444-0000-0000-000000000002', 400.00, 'USD', 1.0, 400.00, 'transfer', NULL)
ON CONFLICT (id) DO NOTHING;

-- Transaction 10: Rental income
INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted) VALUES
    ('22222222-5555-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', '2026-01-01', 'Rental property income', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id) VALUES
    ('22222222-6666-0000-0000-000000000011', '22222222-5555-0000-0000-000000000010', '22222222-4444-0000-0000-000000000001', 1200.00, 'USD', 1.0, 1200.00, 'income', '22222222-3333-0000-0000-000000000012')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ALLOCATIONS FOR SMITH FAMILY (January 2026)
-- ============================================

INSERT INTO allocations (id, household_id, name, category_ids, planned_amount, planned_currency, period_type, period_start_date, period_end_date, is_active) VALUES
    ('11111111-7777-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Groceries Budget', ARRAY['11111111-2222-0000-0000-000000000001']::UUID[], 600.00, 'USD', 'monthly', '2026-01-01', '2026-01-31', TRUE),
    ('11111111-7777-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Dining Out Budget', ARRAY['11111111-2222-0000-0000-000000000002']::UUID[], 300.00, 'USD', 'monthly', '2026-01-01', '2026-01-31', TRUE),
    ('11111111-7777-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Transportation Budget', ARRAY['11111111-2222-0000-0000-000000000003']::UUID[], 200.00, 'USD', 'monthly', '2026-01-01', '2026-01-31', TRUE),
    ('11111111-7777-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Entertainment Budget', ARRAY['11111111-2222-0000-0000-000000000004']::UUID[], 150.00, 'USD', 'monthly', '2026-01-01', '2026-01-31', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ALLOCATIONS FOR GARCIA FAMILY (January 2026)
-- ============================================

INSERT INTO allocations (id, household_id, name, category_ids, planned_amount, planned_currency, period_type, period_start_date, period_end_date, is_active) VALUES
    ('22222222-7777-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Groceries Budget', ARRAY['22222222-3333-0000-0000-000000000001']::UUID[], 500.00, 'USD', 'monthly', '2026-01-01', '2026-01-31', TRUE),
    ('22222222-7777-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Restaurants Budget', ARRAY['22222222-3333-0000-0000-000000000002']::UUID[], 200.00, 'USD', 'monthly', '2026-01-01', '2026-01-31', TRUE),
    ('22222222-7777-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Gas & Auto Budget', ARRAY['22222222-3333-0000-0000-000000000003']::UUID[], 250.00, 'USD', 'monthly', '2026-01-01', '2026-01-31', TRUE),
    ('22222222-7777-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Kids Expenses Budget', ARRAY['22222222-3333-0000-0000-000000000006']::UUID[], 300.00, 'USD', 'monthly', '2026-01-01', '2026-01-31', TRUE)
ON CONFLICT (id) DO NOTHING;
