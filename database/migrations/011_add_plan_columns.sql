-- ============================================
-- ADD MISSING COLUMNS TO SUBSCRIPTION_PLANS
-- ============================================

ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS price_annual DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT -1,
ADD COLUMN IF NOT EXISTS max_accounts INTEGER DEFAULT -1,
ADD COLUMN IF NOT EXISTS max_budgets INTEGER DEFAULT -1,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- Update existing plans with sensible defaults
UPDATE subscription_plans SET
    price_annual = price_monthly * 10,
    max_users = CASE
        WHEN name = 'free' THEN 1
        WHEN name = 'basic' THEN 3
        WHEN name = 'pro' THEN 5
        ELSE -1
    END,
    max_accounts = CASE
        WHEN name = 'free' THEN 3
        ELSE -1
    END,
    max_budgets = -1,
    features = '{}'::jsonb
WHERE price_annual IS NULL OR price_annual = 0;
