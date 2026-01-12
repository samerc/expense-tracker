const db = require('../config/database');

// Get all budgets with status
async function getAllBudgets(req, res) {
  try {
    const { householdId } = req.user;
    const { month, year } = req.query;
    
    let query = `
      SELECT
        b.id,
        b.category_id,
        b.planned_amount,
        b.planned_currency,
        b.month,
        b.alert_threshold_percent,
        b.is_active,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        bs.actual_spent,
        bs.remaining,
        bs.percent_used,
        bs.status
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN budget_status bs ON b.id = bs.budget_id
      WHERE b.household_id = $1 AND b.is_active = true
    `;
    
    const params = [householdId];
    let paramCount = 2;
    
    if (month && year) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      query += ` AND b.month = $${paramCount++}`;
      params.push(monthStr);
    } else if (year) {
      query += ` AND b.month LIKE $${paramCount++}`;
      params.push(`${year}-%`);
    }
    
    query += ` ORDER BY b.month DESC, c.name`;
    
    const result = await db.query(query, params);
    
    // Group by month
    const grouped = {};
    result.rows.forEach(budget => {
      if (!grouped[budget.month]) {
        grouped[budget.month] = [];
      }
      grouped[budget.month].push(budget);
    });
    
    res.json({
      budgets: result.rows,
      grouped: grouped,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ error: 'Failed to get budgets' });
  }
}

// Get single budget by ID
async function getBudgetById(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT
        b.id,
        b.category_id,
        b.planned_amount,
        b.planned_currency,
        b.month,
        b.alert_threshold_percent,
        b.is_active,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        bs.actual_spent,
        bs.remaining,
        bs.percent_used,
        bs.status
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN budget_status bs ON b.id = bs.budget_id
      WHERE b.id = $1 AND b.household_id = $2`,
      [id, householdId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const budget = result.rows[0];
    
    // Get transactions for this budget
    const transactionsResult = await db.query(
      `SELECT
        t.id as transaction_id,
        t.date,
        t.description,
        tl.id as line_id,
        tl.amount,
        tl.base_currency_amount,
        a.name as account_name
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      JOIN accounts a ON tl.account_id = a.id
      WHERE tl.category_id = $1
        AND tl.direction = 'expense'
        AND TO_CHAR(t.date, 'YYYY-MM') = $2
        AND t.is_deleted = false
        AND t.household_id = $3
      ORDER BY t.date DESC, t.created_at DESC`,
      [budget.category_id, budget.month, householdId]
    );
    
    budget.transactions = transactionsResult.rows;
    
    res.json(budget);
  } catch (err) {
    console.error('Get budget error:', err);
    res.status(500).json({ error: 'Failed to get budget' });
  }
}

// Create new budget (admin only)
async function createBudget(req, res) {
  try {
    const { householdId } = req.user;
    
    console.log('CREATE BUDGET - Request body:', req.body);
    
    const {
      category_id,        // Changed from categoryId
      planned_amount,     // Changed from plannedAmount
      planned_currency,   // Changed from plannedCurrency
      month,
      alert_threshold_percent  // Changed from alertThresholdPercent
    } = req.body;
    
    // Validation
    if (!category_id || !planned_amount || !month) {
      return res.status(400).json({
        error: 'Category ID, planned amount, and month are required'
      });
    }
    
    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        error: 'Month must be in YYYY-MM format'
      });
    }
    
    // Check if budget already exists for this category/month
    const existingResult = await db.query(
      `SELECT id FROM budgets
       WHERE household_id = $1 AND category_id = $2 AND month = $3`,
      [householdId, category_id, month]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Budget already exists for this category and month'
      });
    }

    // Get household's base currency if not provided
    let currency = planned_currency;
    if (!currency) {
      const householdResult = await db.query(
        'SELECT base_currency FROM households WHERE id = $1',
        [householdId]
      );
      currency = householdResult.rows[0]?.base_currency || 'USD';
    }
    
    // Insert budget
    const result = await db.query(
      `INSERT INTO budgets (
        household_id,
        category_id,
        planned_amount,
        planned_currency,
        month,
        alert_threshold_percent
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        householdId,
        category_id,
        planned_amount,
        currency,
        month,
        alert_threshold_percent || 80
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create budget error:', err);
    res.status(500).json({ error: 'Failed to create budget' });
  }
}

// Update budget (admin only)
async function updateBudget(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;
    const { planned_amount, alert_threshold_percent, is_active } = req.body; // Changed to snake_case
    
    // Check budget exists
    const checkResult = await db.query(
      'SELECT id FROM budgets WHERE id = $1 AND household_id = $2',
      [id, householdId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (planned_amount !== undefined) {
      updates.push(`planned_amount = $${paramCount++}`);
      values.push(planned_amount);
    }
    
    if (alert_threshold_percent !== undefined) {
      updates.push(`alert_threshold_percent = $${paramCount++}`);
      values.push(alert_threshold_percent);
    }
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await db.query(
      `UPDATE budgets
       SET ${updates.join(', ')}, modified_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(500).json({ error: 'Failed to update budget' });
  }
}

// Delete budget (admin only, soft delete)
async function deleteBudget(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE budgets 
       SET is_active = false
       WHERE id = $1 AND household_id = $2
       RETURNING id, month`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({
      message: 'Budget deactivated successfully',
      budget: result.rows[0]
    });

  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
}

// Get budget summary for a month
async function getBudgetSummary(req, res) {
  try {
    const { householdId } = req.user;
    const { month } = req.params; // YYYY-MM format

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ 
        error: 'Month must be in YYYY-MM format' 
      });
    }

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_budgets,
        SUM(b.planned_amount) as total_planned,
        SUM(bs.actual_spent) as total_spent,
        SUM(bs.remaining) as total_remaining,
        COUNT(*) FILTER (WHERE bs.status = 'safe') as safe_count,
        COUNT(*) FILTER (WHERE bs.status = 'warning') as warning_count,
        COUNT(*) FILTER (WHERE bs.status = 'exceeded') as exceeded_count
      FROM budgets b
      LEFT JOIN budget_status bs ON b.id = bs.budget_id
      WHERE b.household_id = $1 
        AND b.month = $2 
        AND b.is_active = true`,
      [householdId, month]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Get budget summary error:', err);
    res.status(500).json({ error: 'Failed to get budget summary' });
  }
}

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary
};
