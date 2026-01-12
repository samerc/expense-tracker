-- Migration: Restructure allocations table for YNAB-style envelope budgeting
-- This changes from period-based multi-category allocations to monthly single-category envelopes

-- Drop old tables and indexes
DROP TABLE IF EXISTS transaction_line_allocations CASCADE;
DROP TABLE IF EXISTS transaction_allocations CASCADE;
DROP TABLE IF EXISTS allocations CASCADE;

-- Create new YNAB-style allocations table
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

-- Create transaction_allocations table to link transactions to envelopes
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

-- Add comment explaining the envelope budgeting model
COMMENT ON TABLE allocations IS 'YNAB-style envelope budgeting. Each row is a monthly budget envelope for one category.';
COMMENT ON COLUMN allocations.allocated_amount IS 'Budget goal - how much you plan to spend';
COMMENT ON COLUMN allocations.available_amount IS 'Funded amount - money moved into this envelope';
COMMENT ON COLUMN allocations.spent_amount IS 'Spent amount - automatically updated when transactions are created';
COMMENT ON COLUMN allocations.month IS 'First day of the budget month (e.g., 2024-01-01)';
