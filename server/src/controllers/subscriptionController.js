const db = require('../config/database');

// Get current subscription
async function getCurrentSubscription(req, res) {
  try {
    const { householdId, userId } = req.user;
    
    // Get subscription with plan features
    const result = await db.query(
      `SELECT
        s.id,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.trial_ends_at,
        s.transaction_count_current_period,
        sp.id as plan_id,
        sp.name as plan_name,
        sp.display_name as plan_display_name,
        sp.description as plan_description,
        sp.price_monthly,
        sp.is_custom,
        json_object_agg(
          pf.feature_key,
          pf.feature_value
        ) FILTER (WHERE pf.feature_key IS NOT NULL) as features
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       LEFT JOIN plan_features pf ON sp.id = pf.plan_id
       WHERE s.household_id = $1
       GROUP BY s.id, s.status, s.current_period_start, s.current_period_end,
                s.cancel_at_period_end, s.trial_ends_at, s.transaction_count_current_period,
                sp.id, sp.name, sp.display_name, sp.description, sp.price_monthly, sp.is_custom`,
      [householdId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }
    
    const subscription = result.rows[0];
    
    // Get user-specific feature overrides
    const overridesResult = await db.query(
      `SELECT feature_key, feature_value
       FROM user_feature_overrides
       WHERE user_id = $1
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );
    
    // Merge user overrides with plan features
    // User overrides take precedence
    const features = { ...subscription.features };
    overridesResult.rows.forEach(override => {
      features[override.feature_key] = override.feature_value;
    });
    
    subscription.features = features;
    
    res.json(subscription);
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
}

// Get available plans for upgrade
async function getAvailablePlans(req, res) {
  try {
    const result = await db.query(
      `SELECT 
        sp.id,
        sp.name,
        sp.display_name,
        sp.description,
        sp.price_monthly,
        json_object_agg(
          pf.feature_key, 
          pf.feature_value
        ) FILTER (WHERE pf.feature_key IS NOT NULL) as features
       FROM subscription_plans sp
       LEFT JOIN plan_features pf ON sp.id = pf.plan_id
       WHERE sp.is_active = true 
         AND sp.is_custom = false
       GROUP BY sp.id
       ORDER BY sp.sort_order`
    );

    res.json({
      plans: result.rows
    });

  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Failed to get plans' });
  }
}

// Check usage limits
async function checkUsageLimits(req, res) {
  try {
    const { householdId } = req.user;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get plan limit
    const planResult = await db.query(
      `SELECT pf.feature_value as limit
       FROM subscriptions s
       JOIN plan_features pf ON s.plan_id = pf.plan_id
       WHERE s.household_id = $1 
         AND pf.feature_key = 'transaction_limit_monthly'`,
      [householdId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const limit = JSON.parse(planResult.rows[0].limit);

    // Get current usage
    const usageResult = await db.query(
      `SELECT COALESCE(transaction_count, 0) as count
       FROM usage_tracking
       WHERE household_id = $1 AND month = $2`,
      [householdId, currentMonth]
    );

    const currentUsage = parseInt(usageResult.rows[0]?.count || 0);

    res.json({
      currentUsage: currentUsage,
      limit: limit,
      canAddTransaction: limit === null || currentUsage < limit,
      isUnlimited: limit === null,
      remaining: limit === null ? null : Math.max(0, limit - currentUsage)
    });

  } catch (err) {
    console.error('Check usage error:', err);
    res.status(500).json({ error: 'Failed to check usage' });
  }
}

module.exports = {
  getCurrentSubscription,
  getAvailablePlans,
  checkUsageLimits
};
