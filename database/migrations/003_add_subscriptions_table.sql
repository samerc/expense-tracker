-- ============================================
-- SUBSCRIPTIONS TABLE
-- Links households to their subscription plans
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
    
    -- Stripe integration (for future payment processing)
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Billing periods
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Usage tracking
    transaction_count_current_period INTEGER DEFAULT 0,
    
    -- Trial
    trial_ends_at TIMESTAMP,
    canceled_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One subscription per household
    UNIQUE(household_id)
);

CREATE INDEX idx_subscriptions_household ON subscriptions(household_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Trigger for modified_at
CREATE TRIGGER update_subscriptions_modified_at 
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_at();

-- ============================================
-- ASSIGN EXISTING HOUSEHOLD TO FREE PLAN
-- ============================================

DO $$
DECLARE
    free_plan_id UUID;
    household_record RECORD;
BEGIN
    -- Get free plan ID
    SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'free';
    
    IF free_plan_id IS NULL THEN
        RAISE EXCEPTION 'Free plan not found. Run seed data first.';
    END IF;
    
    -- Create subscription for each household that doesn't have one
    FOR household_record IN 
        SELECT id FROM households 
        WHERE id NOT IN (SELECT household_id FROM subscriptions WHERE household_id IS NOT NULL)
    LOOP
        -- Give 14-day trial
        INSERT INTO subscriptions (
            household_id, 
            plan_id, 
            status, 
            trial_ends_at,
            current_period_start,
            current_period_end
        ) VALUES (
            household_record.id,
            free_plan_id,
            'trialing',
            NOW() + INTERVAL '14 days',
            NOW(),
            NOW() + INTERVAL '14 days'
        );
        
        RAISE NOTICE 'Created subscription for household: %', household_record.id;
    END LOOP;
    
END $$;
