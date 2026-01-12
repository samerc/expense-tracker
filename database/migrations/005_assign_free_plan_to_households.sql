-- ============================================
-- ASSIGN FREE PLAN TO EXISTING HOUSEHOLDS
-- ============================================

-- Ensure all households without a subscription get the free plan
INSERT INTO subscriptions (household_id, plan_id, status)
SELECT
    h.id,
    (SELECT id FROM subscription_plans WHERE name = 'free'),
    'active'
FROM households h
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.household_id = h.id
)
ON CONFLICT DO NOTHING;
