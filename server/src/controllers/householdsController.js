const db = require('../config/database');

// Get household info
async function getInfo(req, res) {
  try {
    const { householdId } = req.user;

    // Get household with subscription info
    const result = await db.query(
      `SELECT
        h.id,
        h.name,
        h.base_currency,
        h.created_at,
        sp.id as plan_id,
        sp.name as plan_name,
        sp.display_name as plan_display_name,
        s.status as subscription_status,
        s.trial_ends_at,
        s.current_period_end,
        COUNT(DISTINCT u.id) as member_count
       FROM households h
       LEFT JOIN users u ON h.id = u.household_id AND u.is_active = true
       LEFT JOIN subscriptions s ON h.id = s.household_id
       LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE h.id = $1
       GROUP BY h.id, h.name, h.base_currency, h.created_at,
                sp.id, sp.name, sp.display_name,
                s.status, s.trial_ends_at, s.current_period_end`,
      [householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    const household = result.rows[0];

    res.json({
      id: household.id,
      name: household.name,
      base_currency: household.base_currency,
      plan: household.plan_name || 'free',
      planId: household.plan_id,
      planName: household.plan_display_name || 'Free',
      memberCount: parseInt(household.member_count),
      createdAt: household.created_at,
      subscription: {
        status: household.subscription_status || 'none',
        trialEndsAt: household.trial_ends_at,
        currentPeriodEnd: household.current_period_end
      }
    });
  } catch (err) {
    console.error('Get household info error:', err);
    res.status(500).json({ error: 'Failed to get household info' });
  }
}

// Update household info (admin only)
async function updateInfo(req, res) {
  try {
    const { householdId } = req.user;
    const { name, baseCurrency } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Household name is required' });
    }

    const result = await db.query(
      `UPDATE households 
       SET name = $1, base_currency = $2, modified_at = NOW()
       WHERE id = $3
       RETURNING id, name, base_currency`,
      [name, baseCurrency || 'USD', householdId]
    );

    res.json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      baseCurrency: result.rows[0].base_currency
    });
  } catch (err) {
    console.error('Update household info error:', err);
    res.status(500).json({ error: 'Failed to update household info' });
  }
}

// Get household members
async function getMembers(req, res) {
  try {
    const { householdId } = req.user;

    const result = await db.query(
      `SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.is_active,
        u.created_at,
        u.last_login
       FROM users u
       WHERE u.household_id = $1
       ORDER BY u.role DESC, u.name`,
      [householdId]
    );

    res.json({
      members: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get household members error:', err);
    res.status(500).json({ error: 'Failed to get household members' });
  }
}

module.exports = {
  getInfo,
  updateInfo,
  getMembers
};
