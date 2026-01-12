const db = require('../config/database');
const { clearUserCache } = require('../middleware/featureAccess');

// ============================================
// VIEW PLANS
// ============================================

// Get all available plans
async function getAllPlans(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.display_name,
        sp.description,
        sp.price_monthly,
        sp.is_custom,
        sp.sort_order,
        json_object_agg(
          pf.feature_key, 
          pf.feature_value
        ) FILTER (WHERE pf.feature_key IS NOT NULL) as features
      FROM subscription_plans sp
      LEFT JOIN plan_features pf ON sp.id = pf.plan_id
      WHERE sp.is_active = true
      GROUP BY sp.id
      ORDER BY sp.sort_order
    `);

    res.json({
      plans: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Failed to get plans' });
  }
}

// Get single plan details
async function getPlanDetails(req, res) {
  try {
    const { planId } = req.params;

    const result = await db.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.display_name,
        sp.description,
        sp.price_monthly,
        sp.is_custom,
        json_object_agg(
          pf.feature_key, 
          pf.feature_value
        ) FILTER (WHERE pf.feature_key IS NOT NULL) as features
      FROM subscription_plans sp
      LEFT JOIN plan_features pf ON sp.id = pf.plan_id
      WHERE sp.id = $1
      GROUP BY sp.id
    `, [planId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get plan details error:', err);
    res.status(500).json({ error: 'Failed to get plan details' });
  }
}

// ============================================
// MODIFY PLANS (ADMIN ONLY)
// ============================================

// Update plan features
async function updatePlanFeatures(req, res) {
  const client = await db.pool.connect();
  
  try {
    const { planId } = req.params;
    const { features } = req.body;

    if (!features || typeof features !== 'object') {
      return res.status(400).json({ error: 'Features object required' });
    }

    // Check plan exists
    const planCheck = await client.query(
      'SELECT id, name FROM subscription_plans WHERE id = $1',
      [planId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    await client.query('BEGIN');

    // Delete existing features
    await client.query(
      'DELETE FROM plan_features WHERE plan_id = $1',
      [planId]
    );

    // Insert new features
    for (const [key, value] of Object.entries(features)) {
      await client.query(
        `INSERT INTO plan_features (plan_id, feature_key, feature_value)
         VALUES ($1, $2, $3)`,
        [planId, key, JSON.stringify(value)]
      );
    }

    await client.query('COMMIT');

    // Clear cache for all users on this plan
    // (In production, you'd clear cache more efficiently)

    res.json({
      message: 'Plan features updated successfully',
      planId,
      planName: planCheck.rows[0].name,
      featuresCount: Object.keys(features).length
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update plan features error:', err);
    res.status(500).json({ error: 'Failed to update plan features' });
  } finally {
    client.release();
  }
}

// ============================================
// CUSTOM PLANS
// ============================================

// Create custom plan
async function createCustomPlan(req, res) {
  const client = await db.pool.connect();
  
  try {
    const { userId } = req.user;
    const {
      name,
      displayName,
      description,
      features
    } = req.body;

    if (!name || !displayName || !features) {
      return res.status(400).json({ 
        error: 'Name, display name, and features required' 
      });
    }

    await client.query('BEGIN');

    // Create custom plan
    const planResult = await client.query(
      `INSERT INTO subscription_plans 
       (name, display_name, description, price_monthly, is_custom, created_by)
       VALUES ($1, $2, $3, 0, true, $4)
       RETURNING id, name, display_name`,
      [name, displayName, description || null, userId]
    );

    const planId = planResult.rows[0].id;

    // Add features
    for (const [key, value] of Object.entries(features)) {
      await client.query(
        `INSERT INTO plan_features (plan_id, feature_key, feature_value)
         VALUES ($1, $2, $3)`,
        [planId, key, JSON.stringify(value)]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Custom plan created successfully',
      plan: planResult.rows[0],
      featuresCount: Object.keys(features).length
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create custom plan error:', err);
    res.status(500).json({ error: 'Failed to create custom plan' });
  } finally {
    client.release();
  }
}

// Assign plan to household
// Assign plan to household
async function assignPlanToHousehold(req, res) {
  try {
    const { householdId, planId, reason } = req.body;

    if (!householdId || !planId) {
      return res.status(400).json({ 
        error: 'Household ID and plan ID required' 
      });
    }

    // Check plan exists
    const planCheck = await db.query(
      'SELECT name, display_name FROM subscription_plans WHERE id = $1',
      [planId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Update subscription
    const result = await db.query(
      `UPDATE subscriptions
       SET plan_id = $1, status = 'active', modified_at = NOW()
       WHERE household_id = $2
       RETURNING id`,
      [planId, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household subscription not found' });
    }

    // CLEAR CACHE FOR ALL USERS IN THIS HOUSEHOLD
    const usersResult = await db.query(
      'SELECT id FROM users WHERE household_id = $1',
      [householdId]
    );

    usersResult.rows.forEach(user => {
      clearUserCache(user.id, householdId);
    });

    res.json({
      message: 'Plan assigned successfully',
      householdId,
      plan: planCheck.rows[0],
      reason: reason || 'admin_assignment',
      cacheCleared: true
    });

  } catch (err) {
    console.error('Assign plan error:', err);
    res.status(500).json({ error: 'Failed to assign plan' });
  }
}

// ============================================
// USER FEATURE OVERRIDES
// ============================================

// Grant features to specific user
async function grantUserFeatures(req, res) {
  try {
    const { userId: adminId } = req.user;
    const {
      targetUserId,
      features,
      reason,
      expiresAt
    } = req.body;

    if (!targetUserId || !features) {
      return res.status(400).json({ 
        error: 'Target user ID and features required' 
      });
    }

    for (const [key, value] of Object.entries(features)) {
      await db.query(
        `INSERT INTO user_feature_overrides 
         (user_id, feature_key, feature_value, granted_by, reason, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, feature_key)
         DO UPDATE SET 
           feature_value = $3,
           granted_by = $4,
           reason = $5,
           expires_at = $6`,
        [targetUserId, key, JSON.stringify(value), adminId, reason, expiresAt]
      );
    }

    // Clear cache for this user
    const userResult = await db.query(
      'SELECT household_id FROM users WHERE id = $1',
      [targetUserId]
    );
    
    if (userResult.rows.length > 0) {
      clearUserCache(targetUserId, userResult.rows[0].household_id);
    }

    res.json({
      message: 'User features granted successfully',
      userId: targetUserId,
      features,
      expiresAt: expiresAt || 'never'
    });

  } catch (err) {
    console.error('Grant user features error:', err);
    res.status(500).json({ error: 'Failed to grant user features' });
  }
}

module.exports = {
  getAllPlans,
  getPlanDetails,
  updatePlanFeatures,
  createCustomPlan,
  assignPlanToHousehold,
  grantUserFeatures
};
