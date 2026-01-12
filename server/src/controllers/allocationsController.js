const db = require('../config/database');

// Get allocations for a specific month
async function getAllocations(req, res) {
  try {
    const { householdId } = req.user;
    const { month } = req.query; // Format: YYYY-MM-01

    if (!month) {
      return res.status(400).json({ error: 'Month is required (format: YYYY-MM-01)' });
    }

    // Get allocations with category details
    const result = await db.query(
      `SELECT
        a.id,
        a.category_id,
        a.month,
        a.allocated_amount,
        a.available_amount,
        a.spent_amount,
        a.notes,
        c.name as category_name,
        c.icon,
        c.color,
        (a.available_amount - a.spent_amount) as balance,
        (a.allocated_amount - a.available_amount) as to_fund
       FROM allocations a
       JOIN categories c ON a.category_id = c.id
       WHERE a.household_id = $1 AND a.month = $2
       ORDER BY c.name`,
      [householdId, month]
    );

    // Calculate totals
    const totalAllocated = result.rows.reduce((sum, row) => sum + parseFloat(row.allocated_amount), 0);
    const totalAvailable = result.rows.reduce((sum, row) => sum + parseFloat(row.available_amount), 0);
    const totalSpent = result.rows.reduce((sum, row) => sum + parseFloat(row.spent_amount), 0);
    const totalBalance = totalAvailable - totalSpent;

    // Calculate unallocated income (income that hasn't been allocated to envelopes)
    const unallocatedResult = await db.query(
      `SELECT 
        COALESCE(SUM(ABS(tl.base_currency_amount)), 0) as total_income
       FROM transaction_lines tl
       JOIN transactions t ON tl.transaction_id = t.id
       WHERE t.household_id = $1
         AND tl.direction = 'income'
         AND DATE_TRUNC('month', t.date) = $2
         AND t.is_deleted = false`,
      [householdId, month]
    );

    const totalIncome = parseFloat(unallocatedResult.rows[0].total_income);
    const unallocatedFunds = totalIncome - totalAvailable;

    res.json({
      allocations: result.rows,
      summary: {
        totalAllocated,
        totalAvailable,
        totalSpent,
        totalBalance,
        totalIncome,
        unallocatedFunds,
        toFund: totalAllocated - totalAvailable
      },
      month
    });
  } catch (err) {
    console.error('Get allocations error:', err);
    res.status(500).json({ error: 'Failed to get allocations' });
  }
}

// Create or update allocation (budget plan only, doesn't fund it)
async function upsertAllocation(req, res) {
  try {
    const { householdId } = req.user;
    const { categoryId, month, allocatedAmount, notes } = req.body;

    if (!categoryId || !month || allocatedAmount === undefined) {
      return res.status(400).json({ 
        error: 'Category ID, month, and allocated amount are required' 
      });
    }

    // Verify category belongs to household
    const categoryCheck = await db.query(
      `SELECT id FROM categories WHERE id = $1 AND household_id = $2`,
      [categoryId, householdId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get current available and spent amounts (preserve them)
    const currentResult = await db.query(
      `SELECT available_amount, spent_amount 
       FROM allocations 
       WHERE household_id = $1 AND category_id = $2 AND month = $3`,
      [householdId, categoryId, month]
    );

    const availableAmount = currentResult.rows.length > 0 
      ? parseFloat(currentResult.rows[0].available_amount) 
      : 0;

    const spentAmount = currentResult.rows.length > 0 
      ? parseFloat(currentResult.rows[0].spent_amount) 
      : 0;

    // Upsert allocation
    const result = await db.query(
      `INSERT INTO allocations (household_id, category_id, month, allocated_amount, available_amount, spent_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (household_id, category_id, month)
       DO UPDATE SET
         allocated_amount = $4,
         notes = $7,
         modified_at = NOW()
       RETURNING *`,
      [householdId, categoryId, month, allocatedAmount, availableAmount, spentAmount, notes || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Upsert allocation error:', err);
    res.status(500).json({ error: 'Failed to save allocation' });
  }
}

// Fund allocations with income
async function fundAllocations(req, res) {
  try {
    const { householdId } = req.user;
    const { month, funding } = req.body; // funding = [{ allocationId, amount }, ...]

    if (!month || !funding || !Array.isArray(funding)) {
      return res.status(400).json({ 
        error: 'Month and funding array are required' 
      });
    }

    // Update available_amount for each allocation
    for (const fund of funding) {
      await db.query(
        `UPDATE allocations
         SET available_amount = available_amount + $1,
             modified_at = NOW()
         WHERE id = $2 AND household_id = $3`,
        [fund.amount, fund.allocationId, householdId]
      );
    }

    res.json({ message: 'Allocations funded successfully' });
  } catch (err) {
    console.error('Fund allocations error:', err);
    res.status(500).json({ error: 'Failed to fund allocations' });
  }
}

// Move money between allocations
async function moveAllocation(req, res) {
  try {
    const { householdId } = req.user;
    const { fromAllocationId, toAllocationId, amount } = req.body;

    if (!fromAllocationId || !toAllocationId || !amount) {
      return res.status(400).json({ 
        error: 'From allocation, to allocation, and amount are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Verify both allocations belong to household
    const allocationsCheck = await db.query(
      `SELECT id, available_amount, spent_amount 
       FROM allocations 
       WHERE id = ANY($1) AND household_id = $2`,
      [[fromAllocationId, toAllocationId], householdId]
    );

    if (allocationsCheck.rows.length !== 2) {
      return res.status(404).json({ error: 'One or both allocations not found' });
    }

    const fromAllocation = allocationsCheck.rows.find(a => a.id === fromAllocationId);
    const fromBalance = parseFloat(fromAllocation.available_amount) - parseFloat(fromAllocation.spent_amount);

    if (fromBalance < amount) {
      return res.status(400).json({ 
        error: `Insufficient funds. Available: $${fromBalance.toFixed(2)}` 
      });
    }

    // Move the money
    await db.query('BEGIN');

    await db.query(
      `UPDATE allocations
       SET available_amount = available_amount - $1,
           modified_at = NOW()
       WHERE id = $2`,
      [amount, fromAllocationId]
    );

    await db.query(
      `UPDATE allocations
       SET available_amount = available_amount + $1,
           modified_at = NOW()
       WHERE id = $2`,
      [amount, toAllocationId]
    );

    await db.query('COMMIT');

    res.json({ message: 'Funds moved successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Move allocation error:', err);
    res.status(500).json({ error: 'Failed to move funds' });
  }
}

// Delete allocation
async function deleteAllocation(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM allocations
       WHERE id = $1 AND household_id = $2
       RETURNING id`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    res.json({ message: 'Allocation deleted successfully' });
  } catch (err) {
    console.error('Delete allocation error:', err);
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
}

// Get unallocated categories for a month
async function getUnallocatedCategories(req, res) {
  try {
    const { householdId } = req.user;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    // Get expense categories that don't have allocations for this month
    const result = await db.query(
      `SELECT c.id, c.name, c.icon, c.color
       FROM categories c
       WHERE c.household_id = $1
         AND c.type = 'expense'
         AND c.is_active = true
         AND NOT EXISTS (
           SELECT 1 FROM allocations a
           WHERE a.category_id = c.id
             AND a.household_id = $1
             AND a.month = $2
         )
       ORDER BY c.name`,
      [householdId, month]
    );

    res.json({
      categories: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get unallocated categories error:', err);
    res.status(500).json({ error: 'Failed to get unallocated categories' });
  }
}

// Get transactions for an allocation
async function getAllocationTransactions(req, res) {
  try {
    const { householdId } = req.user;
    const { allocationId } = req.params;

    // Verify allocation belongs to household
    const allocationCheck = await db.query(
      `SELECT id FROM allocations WHERE id = $1 AND household_id = $2`,
      [allocationId, householdId]
    );

    if (allocationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Get all transactions linked to this allocation
    const result = await db.query(
      `SELECT 
        t.id as transaction_id,
        t.date,
        t.description,
        ta.amount,
        a.name as account_name,
        tl.id as line_id
       FROM transaction_allocations ta
       JOIN transaction_lines tl ON ta.transaction_line_id = tl.id
       JOIN transactions t ON tl.transaction_id = t.id
       JOIN accounts a ON tl.account_id = a.id
       WHERE ta.allocation_id = $1
         AND t.is_deleted = false
       ORDER BY t.date DESC, t.created_at DESC`,
      [allocationId]
    );

    res.json({
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get allocation transactions error:', err);
    res.status(500).json({ error: 'Failed to get allocation transactions' });
  }
}

module.exports = {
  getAllocations,
  upsertAllocation,
  fundAllocations,
  moveAllocation,
  deleteAllocation,
  getUnallocatedCategories,
  getAllocationTransactions 
};