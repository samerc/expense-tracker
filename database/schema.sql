-- ============================================
-- EXPENSE TRACKER DATABASE SCHEMA
-- Version: 1.0
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HOUSEHOLDS & USERS
-- ============================================

CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'regular')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_household ON users(household_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- ACCOUNTS
-- ============================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'bank', 'credit', 'wallet')),
    currency VARCHAR(3) NOT NULL,
    initial_balance DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_household ON accounts(household_id);

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'system')),
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_household ON categories(household_id);

-- ============================================
-- TRANSACTIONS & LINES
-- ============================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('standard', 'transfer', 'mixed')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_transactions_household ON transactions(household_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_not_deleted ON transactions(is_deleted) WHERE is_deleted = FALSE;

CREATE TABLE transaction_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    exchange_rate_to_base DECIMAL(10, 6),
    exchange_rate_date DATE,
    base_currency_amount DECIMAL(15, 2) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('income', 'expense', 'transfer')),
    category_id UUID REFERENCES categories(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_transfer_no_category 
        CHECK ((direction = 'transfer' AND category_id IS NULL) 
            OR (direction != 'transfer' AND category_id IS NOT NULL))
);

CREATE INDEX idx_transaction_lines_transaction ON transaction_lines(transaction_id);
CREATE INDEX idx_transaction_lines_account ON transaction_lines(account_id);
CREATE INDEX idx_transaction_lines_category ON transaction_lines(category_id);
CREATE INDEX idx_transaction_lines_direction ON transaction_lines(direction);

-- ============================================
-- ALLOCATIONS (YNAB-style envelope budgeting)
-- ============================================

CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month DATE NOT NULL,  -- First day of month (YYYY-MM-01)
    allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- Budget goal for the month
    available_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- Money funded into envelope
    spent_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,      -- Money spent from envelope
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Each category can only have one allocation per month per household
    UNIQUE(household_id, category_id, month)
);

CREATE INDEX idx_allocations_household ON allocations(household_id);
CREATE INDEX idx_allocations_month ON allocations(month);
CREATE INDEX idx_allocations_category ON allocations(category_id);
CREATE INDEX idx_allocations_household_month ON allocations(household_id, month);

CREATE TABLE transaction_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_line_id UUID NOT NULL REFERENCES transaction_lines(id) ON DELETE CASCADE,
    allocation_id UUID NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,  -- Amount allocated from this envelope
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(transaction_line_id, allocation_id)
);

CREATE INDEX idx_ta_line ON transaction_allocations(transaction_line_id);
CREATE INDEX idx_ta_allocation ON transaction_allocations(allocation_id);

-- ============================================
-- BUDGETS
-- ============================================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    planned_amount DECIMAL(15, 2) NOT NULL,
    planned_currency VARCHAR(3) NOT NULL,
    month VARCHAR(7) NOT NULL,
    alert_threshold_percent INTEGER DEFAULT 80,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(household_id, category_id, month)
);

CREATE INDEX idx_budgets_household ON budgets(household_id);
CREATE INDEX idx_budgets_month ON budgets(month);

-- ============================================
-- SYNC LOG
-- ============================================

CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL,
    sync_direction VARCHAR(20) NOT NULL CHECK (sync_direction IN ('upload', 'download')),
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_synced INTEGER,
    status VARCHAR(20) CHECK (status IN ('success', 'partial', 'failed'))
);

CREATE INDEX idx_sync_logs_user ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_device ON sync_logs(device_id);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE modified_at
-- ============================================

CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_households_modified_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_users_modified_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_accounts_modified_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_categories_modified_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_transactions_modified_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_transaction_lines_modified_at BEFORE UPDATE ON transaction_lines
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_allocations_modified_at BEFORE UPDATE ON allocations
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_budgets_modified_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View: Account balances (calculated)
CREATE OR REPLACE VIEW account_balances AS
SELECT 
    a.id as account_id,
    a.name as account_name,
    a.type,
    a.currency,
    a.initial_balance,
    COALESCE(SUM(tl.amount), 0) as transaction_total,
    a.initial_balance + COALESCE(SUM(tl.amount), 0) as current_balance,
    a.household_id
FROM accounts a
LEFT JOIN transaction_lines tl ON a.id = tl.account_id
LEFT JOIN transactions t ON tl.transaction_id = t.id
WHERE a.is_active = TRUE 
  AND (t.is_deleted = FALSE OR t.is_deleted IS NULL)
GROUP BY a.id, a.name, a.type, a.currency, a.initial_balance, a.household_id;

-- View: Allocation status (calculated)
CREATE OR REPLACE VIEW allocation_status AS
SELECT
    al.id as allocation_id,
    c.name as category_name,
    al.month,
    al.allocated_amount,
    al.available_amount,
    al.spent_amount,
    al.available_amount - al.spent_amount as balance,
    CASE
        WHEN al.spent_amount = 0 THEN 'unused'
        WHEN al.spent_amount >= al.available_amount THEN 'overspent'
        WHEN al.spent_amount >= al.allocated_amount THEN 'over_budget'
        ELSE 'on_track'
    END as status,
    al.household_id
FROM allocations al
JOIN categories c ON al.category_id = c.id;

-- View: Budget status (calculated)
CREATE OR REPLACE VIEW budget_status AS
SELECT 
    b.id as budget_id,
    b.month,
    c.name as category_name,
    b.planned_amount,
    b.planned_currency,
    b.alert_threshold_percent,
    COALESCE(SUM(ABS(tl.base_currency_amount)), 0) as actual_spent,
    b.planned_amount - COALESCE(SUM(ABS(tl.base_currency_amount)), 0) as remaining,
    CASE 
        WHEN b.planned_amount > 0 THEN 
            (COALESCE(SUM(ABS(tl.base_currency_amount)), 0) / b.planned_amount * 100)
        ELSE 0
    END as percent_used,
    CASE 
        WHEN b.planned_amount > 0 AND 
             (COALESCE(SUM(ABS(tl.base_currency_amount)), 0) / b.planned_amount * 100) < b.alert_threshold_percent 
            THEN 'safe'
        WHEN b.planned_amount > 0 AND 
             (COALESCE(SUM(ABS(tl.base_currency_amount)), 0) / b.planned_amount * 100) >= b.alert_threshold_percent AND
             (COALESCE(SUM(ABS(tl.base_currency_amount)), 0) / b.planned_amount * 100) < 100
            THEN 'warning'
        WHEN COALESCE(SUM(ABS(tl.base_currency_amount)), 0) >= b.planned_amount 
            THEN 'exceeded'
        ELSE 'safe'
    END as status,
    b.household_id,
    b.category_id
FROM budgets b
JOIN categories c ON b.category_id = c.id
LEFT JOIN transaction_lines tl ON tl.category_id = b.category_id 
    AND tl.direction = 'expense'
LEFT JOIN transactions t ON tl.transaction_id = t.id
    AND TO_CHAR(t.date, 'YYYY-MM') = b.month
    AND t.is_deleted = FALSE
WHERE b.is_active = TRUE
GROUP BY b.id, b.month, c.name, b.planned_amount, b.planned_currency, 
         b.alert_threshold_percent, b.household_id, b.category_id;