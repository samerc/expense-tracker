const db = require('../config/database');
const bcrypt = require('bcrypt');

// Get all households with stats
async function getAllHouseholds(req, res) {
  try {
    const result = await db.query(
      `SELECT 
        h.id,
        h.name,
        h.base_currency,
        h.plan_id,
        sp.name as plan_name,
        sp.display_name as plan_display_name,
        h.billing_cycle,
        h.plan_status,
        h.subscription_starts_at,
        h.subscription_ends_at,
        h.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT a.id) as account_count,
        MAX(u.last_login) as last_activity
       FROM households h
       LEFT JOIN subscription_plans sp ON h.plan_id = sp.id
       LEFT JOIN users u ON h.id = u.household_id
       LEFT JOIN accounts a ON h.id = a.household_id AND a.is_deleted = false
       GROUP BY h.id, h.name, h.base_currency, h.plan_id, sp.name, sp.display_name, 
                h.billing_cycle, h.plan_status, h.subscription_starts_at, 
                h.subscription_ends_at, h.created_at
       ORDER BY h.created_at DESC`
    );

    // Get system stats
    const statsResult = await db.query(
      `SELECT 
        COUNT(DISTINCT h.id) as total_households,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_login > NOW() - INTERVAL '30 days' THEN u.id END) as active_users_30d,
        COUNT(DISTINCT CASE WHEN sp.price_monthly > 0 THEN h.id END) as paid_households
       FROM households h
       LEFT JOIN users u ON h.id = u.household_id
       LEFT JOIN subscription_plans sp ON h.plan_id = sp.id`
    );

    res.json({
      households: result.rows,
      stats: statsResult.rows[0]
    });
  } catch (err) {
    console.error('Get all households error:', err);
    res.status(500).json({ error: 'Failed to get households' });
  }
}

// Get household details
async function getHouseholdDetails(req, res) {
  try {
    const { householdId } = req.params;

    // Get household info
    const householdResult = await db.query(
      `SELECT 
        h.*,
        sp.name as plan_name,
        sp.display_name as plan_display_name,
        sp.price_monthly,
        sp.price_annual,
        sp.max_users
       FROM households h
       LEFT JOIN subscription_plans sp ON h.plan_id = sp.id
       WHERE h.id = $1`,
      [householdId]
    );

    if (householdResult.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    // Get users
    const usersResult = await db.query(
      `SELECT id, email, name, role, is_active, last_login, created_at
       FROM users
       WHERE household_id = $1
       ORDER BY role DESC, name`,
      [householdId]
    );

    // Get usage stats
    const statsResult = await db.query(
      `SELECT 
        COUNT(DISTINCT a.id) as account_count,
        COUNT(DISTINCT c.id) as category_count,
        COUNT(DISTINCT b.id) as budget_count,
        COUNT(DISTINCT t.id) as transaction_count
       FROM households h
       LEFT JOIN accounts a ON h.id = a.household_id AND a.is_deleted = false
       LEFT JOIN categories c ON h.id = c.household_id AND c.is_active = true
       LEFT JOIN budgets b ON h.id = b.household_id AND b.is_active = true
       LEFT JOIN transactions t ON h.id = t.household_id AND t.is_deleted = false
       WHERE h.id = $1`,
      [householdId]
    );

    res.json({
      household: householdResult.rows[0],
      users: usersResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (err) {
    console.error('Get household details error:', err);
    res.status(500).json({ error: 'Failed to get household details' });
  }
}

// Update household plan
async function updateHouseholdPlan(req, res) {
  try {
    const { householdId } = req.params;
    const { planId, billingCycle, status } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Verify plan exists
    const planCheck = await db.query(
      'SELECT id FROM subscription_plans WHERE id = $1',
      [planId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const result = await db.query(
      `UPDATE households
       SET plan_id = $1,
           billing_cycle = COALESCE($2, billing_cycle),
           plan_status = COALESCE($3, plan_status),
           subscription_starts_at = COALESCE(subscription_starts_at, NOW())
       WHERE id = $4
       RETURNING *`,
      [planId, billingCycle, status, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update household plan error:', err);
    res.status(500).json({ error: 'Failed to update household plan' });
  }
}

// Suspend/activate household
async function toggleHouseholdStatus(req, res) {
  try {
    const { householdId } = req.params;
    const { status } = req.body; // 'active' or 'suspended'

    if (!['active', 'suspended', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be active, suspended, or cancelled' 
      });
    }

    const result = await db.query(
      `UPDATE households
       SET plan_status = $1
       WHERE id = $2
       RETURNING id, name, plan_status`,
      [status, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle household status error:', err);
    res.status(500).json({ error: 'Failed to update household status' });
  }
}

// Get all subscription plans
async function getAllPlans(req, res) {
  try {
    const result = await db.query(
      `SELECT 
        id,
        name,
        display_name,
        description,
        price_monthly,
        price_annual,
        max_users,
        max_accounts,
        max_budgets,
        features,
        is_active,
        created_at
       FROM subscription_plans
       ORDER BY price_monthly ASC`
    );

    res.json({
      plans: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get all plans error:', err);
    res.status(500).json({ error: 'Failed to get plans' });
  }
}

// Create subscription plan
async function createPlan(req, res) {
  try {
    const { 
      name, 
      displayName, 
      description, 
      priceMonthly, 
      priceAnnual,
      maxUsers,
      maxAccounts,
      maxBudgets,
      features
    } = req.body;

    if (!name || !displayName || priceMonthly === undefined) {
      return res.status(400).json({ 
        error: 'Name, display name, and monthly price are required' 
      });
    }

    const result = await db.query(
      `INSERT INTO subscription_plans 
       (name, display_name, description, price_monthly, price_annual, 
        max_users, max_accounts, max_budgets, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        displayName,
        description || null,
        priceMonthly,
        priceAnnual || 0,
        maxUsers || 1,
        maxAccounts || 5,
        maxBudgets || 3,
        features || {}
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create plan error:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Plan name already exists' });
    }
    res.status(500).json({ error: 'Failed to create plan' });
  }
}

// Update subscription plan
async function updatePlan(req, res) {
  try {
    const { planId } = req.params;
    const { 
      displayName, 
      description, 
      priceMonthly, 
      priceAnnual,
      maxUsers,
      maxAccounts,
      maxBudgets,
      features,
      isActive
    } = req.body;

    const result = await db.query(
      `UPDATE subscription_plans
       SET display_name = COALESCE($1, display_name),
           description = COALESCE($2, description),
           price_monthly = COALESCE($3, price_monthly),
           price_annual = COALESCE($4, price_annual),
           max_users = COALESCE($5, max_users),
           max_accounts = COALESCE($6, max_accounts),
           max_budgets = COALESCE($7, max_budgets),
           features = COALESCE($8, features),
           is_active = COALESCE($9, is_active),
           modified_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [displayName, description, priceMonthly, priceAnnual, maxUsers, 
       maxAccounts, maxBudgets, features, isActive, planId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update plan error:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
}

// Create household
async function createHousehold(req, res) {
  try {
    const { name, baseCurrency, planId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Household name is required' });
    }

    const result = await db.query(
      `INSERT INTO households (name, base_currency, plan_id, plan_status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [name, baseCurrency || 'USD', planId || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create household error:', err);
    res.status(500).json({ error: 'Failed to create household' });
  }
}

// Update household
async function updateHousehold(req, res) {
  try {
    const { householdId } = req.params;
    const { name, baseCurrency, planId } = req.body;

    const result = await db.query(
      `UPDATE households
       SET name = COALESCE($1, name),
           base_currency = COALESCE($2, base_currency),
           plan_id = COALESCE($3, plan_id)
       WHERE id = $4
       RETURNING *`,
      [name, baseCurrency, planId || null, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update household error:', err);
    res.status(500).json({ error: 'Failed to update household' });
  }
}

// Create user
async function createUser(req, res) {
  try {
    const { email, password, name, role, householdId, isActive } = req.body;

    if (!email || !password || !name || !householdId) {
      return res.status(400).json({
        error: 'Email, password, name, and household ID are required'
      });
    }

    // Verify household exists
    const householdCheck = await db.query(
      'SELECT id FROM households WHERE id = $1',
      [householdId]
    );

    if (householdCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    // Check if email already exists
    const emailCheck = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, household_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, household_id, is_active, created_at`,
      [email.toLowerCase(), passwordHash, name, role || 'regular', householdId, isActive !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

// Update user
async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { name, email, role, isActive, password, householdId } = req.body;

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email.toLowerCase());
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }
    if (householdId !== undefined) {
      updates.push(`household_id = $${paramIndex++}`);
      values.push(householdId);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);

    const result = await db.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, email, name, role, household_id, is_active, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
}

// Delete user
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, email, name`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

// Reset user password
async function resetUserPassword(req, res) {
  try {
    const { userId } = req.params;

    // Generate random password (12 chars, alphanumeric + special)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user
    const result = await db.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2
       RETURNING id, email, name`,
      [passwordHash, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the new password (display to admin since email not working)
    res.json({
      message: 'Password reset successfully',
      user: result.rows[0],
      newPassword: newPassword,
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

module.exports = {
  getAllHouseholds,
  getHouseholdDetails,
  createHousehold,
  updateHousehold,
  updateHouseholdPlan,
  toggleHouseholdStatus,
  getAllPlans,
  createPlan,
  updatePlan,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
};
