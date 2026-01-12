-- ============================================
-- ADD MISSING COLUMNS FOR SUPER ADMIN FEATURES
-- ============================================

-- Create subscription_plans table if it doesn't exist (must be first for FK reference)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_annual DECIMAL(10, 2) DEFAULT 0,
    max_users INTEGER DEFAULT 1,
    max_accounts INTEGER DEFAULT 5,
    max_budgets INTEGER DEFAULT 3,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans if they don't exist
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_annual, max_users, max_accounts, max_budgets, sort_order)
VALUES
    ('free', 'Free', 'Basic features for personal use', 0, 0, 2, 5, 3, 1),
    ('basic', 'Basic', 'For individuals who want more', 4.99, 49.99, 3, 10, 10, 2),
    ('pro', 'Pro', 'For families and power users', 9.99, 99.99, 10, 50, 50, 3)
ON CONFLICT (name) DO NOTHING;

-- Add subscription/plan columns to households
ALTER TABLE households
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;

-- Add is_deleted to accounts (for soft delete)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add last_login to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
