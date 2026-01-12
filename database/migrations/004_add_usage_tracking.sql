-- ============================================
-- USAGE TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    transaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(household_id, month)
);

CREATE INDEX idx_usage_tracking_household_month ON usage_tracking(household_id, month);

-- Trigger for modified_at
CREATE TRIGGER update_usage_tracking_modified_at 
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_at();

-- ============================================
-- FUNCTION TO INCREMENT USAGE
-- ============================================

CREATE OR REPLACE FUNCTION increment_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO usage_tracking (household_id, month, transaction_count)
    VALUES (
        NEW.household_id,
        TO_CHAR(NEW.date, 'YYYY-MM'),
        1
    )
    ON CONFLICT (household_id, month)
    DO UPDATE SET 
        transaction_count = usage_tracking.transaction_count + 1,
        modified_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO TRACK USAGE ON TRANSACTION INSERT
-- ============================================

DROP TRIGGER IF EXISTS track_transaction_usage ON transactions;

CREATE TRIGGER track_transaction_usage
    AFTER INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.is_deleted = FALSE)
    EXECUTE FUNCTION increment_usage_count();

-- ============================================
-- SEED CURRENT USAGE FOR EXISTING TRANSACTIONS
-- ============================================

INSERT INTO usage_tracking (household_id, month, transaction_count)
SELECT 
    household_id,
    TO_CHAR(date, 'YYYY-MM') as month,
    COUNT(*) as transaction_count
FROM transactions
WHERE is_deleted = FALSE
GROUP BY household_id, TO_CHAR(date, 'YYYY-MM')
ON CONFLICT (household_id, month) 
DO UPDATE SET 
    transaction_count = EXCLUDED.transaction_count;
