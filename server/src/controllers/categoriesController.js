const db = require('../config/database');

// Get all categories (system + household)
async function getAllCategories(req, res) {
  try {
    const { householdId } = req.user;

    const result = await db.query(
      `SELECT 
        id,
        name,
        type,
        icon,
        color,
        is_active,
        CASE WHEN household_id IS NULL THEN true ELSE false END as is_system
       FROM categories
       WHERE (household_id = $1 OR household_id IS NULL)
         AND is_active = true
       ORDER BY 
         CASE type 
           WHEN 'system' THEN 3
           WHEN 'expense' THEN 1
           WHEN 'income' THEN 2
         END,
         name`,
      [householdId]
    );

    // Group by type
    const grouped = {
      expense: [],
      income: [],
      system: []
    };

    result.rows.forEach(cat => {
      grouped[cat.type].push(cat);
    });

    res.json({
      categories: result.rows,
      grouped: grouped,
      count: result.rows.length
    });

  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to get categories' });
  }
}

// Get single category by ID
async function getCategoryById(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        id,
        name,
        type,
        icon,
        color,
        is_active,
        CASE WHEN household_id IS NULL THEN true ELSE false END as is_system
       FROM categories
       WHERE id = $1 
         AND (household_id = $2 OR household_id IS NULL)`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ error: 'Failed to get category' });
  }
}

// Create new category (admin only)
async function createCategory(req, res) {
  try {
    const { householdId } = req.user;
    const { name, type, icon, color } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({ 
        error: 'Name and type are required' 
      });
    }

    const validTypes = ['income', 'expense'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Type must be one of: ${validTypes.join(', ')}` 
      });
    }

    const result = await db.query(
      `INSERT INTO categories (household_id, name, type, icon, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, type, icon, color, is_active, created_at`,
      [householdId, name, type, icon || null, color || null]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

// Update category (admin only)
async function updateCategory(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;
    const { name, icon, color, isActive } = req.body;

    // Check category exists, belongs to household, and is not system
    const checkResult = await db.query(
      `SELECT id FROM categories 
       WHERE id = $1 AND household_id = $2`,
      [id, householdId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Category not found or cannot be modified' 
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    
    const result = await db.query(
      `UPDATE categories 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, type, icon, color, is_active, modified_at`,
      values
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

// Get category spending/income history by month
async function getCategorySpendingHistory(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;
    const { months = 12 } = req.query;

    // Get category info first to determine type
    const categoryResult = await db.query(
      `SELECT id, name, type, icon, color
       FROM categories
       WHERE id = $1 AND (household_id = $2 OR household_id IS NULL)`,
      [id, householdId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categoryResult.rows[0];
    // Use category type to filter transactions (income categories show income, expense categories show expense)
    const direction = category.type === 'income' ? 'income' : 'expense';

    // Get monthly data for this category
    const result = await db.query(
      `SELECT
        TO_CHAR(t.date, 'YYYY-MM') as month,
        TO_CHAR(t.date, 'Mon YYYY') as month_label,
        SUM(ABS(tl.base_currency_amount)) as total,
        COUNT(tl.id) as transaction_count
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      WHERE tl.category_id = $1
        AND t.household_id = $2
        AND t.is_deleted = false
        AND tl.direction = $3
        AND t.date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${parseInt(months) - 1} months'
      GROUP BY TO_CHAR(t.date, 'YYYY-MM'), TO_CHAR(t.date, 'Mon YYYY')
      ORDER BY TO_CHAR(t.date, 'YYYY-MM') ASC`,
      [id, householdId, direction]
    );

    // Fill in missing months with zero
    const data = [];
    const now = new Date();
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const date = new Date(year, month, 1);

      // Format month key as YYYY-MM
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const existing = result.rows.find(r => r.month === monthKey);
      data.push({
        month: monthKey,
        monthLabel: monthLabel,
        total: existing ? parseFloat(existing.total) : 0,
        transactionCount: existing ? parseInt(existing.transaction_count) : 0
      });
    }

    // Calculate stats
    const totals = data.map(d => d.total);
    const nonZeroTotals = totals.filter(t => t > 0);

    res.json({
      category: category,
      data: data,
      stats: {
        total: totals.reduce((a, b) => a + b, 0),
        average: nonZeroTotals.length > 0
          ? nonZeroTotals.reduce((a, b) => a + b, 0) / nonZeroTotals.length
          : 0,
        max: Math.max(...totals),
        min: Math.min(...nonZeroTotals.length > 0 ? nonZeroTotals : [0]),
        monthsWithSpending: nonZeroTotals.length
      }
    });

  } catch (err) {
    console.error('Get category spending history error:', err);
    res.status(500).json({ error: 'Failed to get category spending history' });
  }
}

// Delete category (admin only, soft delete)
async function deleteCategory(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;

    // Cannot delete system categories
    const checkResult = await db.query(
      `SELECT id FROM categories 
       WHERE id = $1 AND household_id = $2`,
      [id, householdId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Category not found or cannot be deleted' 
      });
    }

    const result = await db.query(
      `UPDATE categories 
       SET is_active = false
       WHERE id = $1
       RETURNING id, name`,
      [id]
    );

    res.json({
      message: 'Category deactivated successfully',
      category: result.rows[0]
    });

  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategorySpendingHistory,
  createCategory,
  updateCategory,
  deleteCategory
};
