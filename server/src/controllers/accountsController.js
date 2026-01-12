const db = require('../config/database');

/**
 * Calculate current balance for an account based on transactions
 * current_balance = initial_balance + sum(income) - sum(expenses)
 */
const BALANCE_SUBQUERY = `
  COALESCE(a.initial_balance, 0) + COALESCE(
    (SELECT SUM(
      CASE
        WHEN tl.direction = 'income' THEN ABS(tl.amount)
        WHEN tl.direction = 'expense' THEN -ABS(tl.amount)
        ELSE 0
      END
    )
    FROM transaction_lines tl
    JOIN transactions t ON tl.transaction_id = t.id
    WHERE tl.account_id = a.id AND t.is_deleted = false
    ), 0
  )
`;

// Get all accounts for the user's household
async function getAllAccounts(req, res) {
  try {
    const { householdId } = req.user;

    const result = await db.query(
      `SELECT
        a.id,
        a.name,
        a.type,
        a.currency,
        a.initial_balance,
        a.is_active,
        a.created_at,
        a.modified_at,
        ${BALANCE_SUBQUERY} as current_balance
       FROM accounts a
       WHERE a.household_id = $1 AND a.is_active = true
       ORDER BY a.type, a.name`,
      [householdId]
    );
    res.json({
      accounts: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get accounts error:', err);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
}

// Get single account by ID
async function getAccountById(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;

    const result = await db.query(
      `SELECT
        a.id,
        a.name,
        a.type,
        a.currency,
        a.initial_balance,
        a.is_active,
        a.created_at,
        a.modified_at,
        ${BALANCE_SUBQUERY} as current_balance
       FROM accounts a
       WHERE a.id = $1 AND a.household_id = $2 AND a.is_active = true`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get account error:', err);
    res.status(500).json({ error: 'Failed to get account' });
  }
}

/**
 * Create a new account
 * Accepts: name, type, currency, initialBalance
 */
async function createAccount(req, res) {
  try {
    const { householdId } = req.user;
    const { name, type, currency, initialBalance } = req.body;

    // Validation
    if (!name || !type || !currency) {
      return res.status(400).json({
        error: 'Name, type, and currency are required'
      });
    }

    // Validate account type
    const validTypes = ['cash', 'bank', 'credit', 'wallet'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    const result = await db.query(
      `INSERT INTO accounts (household_id, name, type, currency, initial_balance)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, type, currency, initial_balance, is_active, created_at`,
      [householdId, name, type, currency, initialBalance || 0]
    );

    // Return with current_balance (same as initial for new account)
    const account = result.rows[0];
    account.current_balance = account.initial_balance;

    res.status(201).json(account);
  } catch (err) {
    console.error('Create account error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

/**
 * Update an existing account
 * Accepts: name, type, currency
 */
async function updateAccount(req, res) {
  try {
    const { id } = req.params;
    const { householdId } = req.user;
    const { name, type, currency } = req.body;

    // Validation
    if (!name && !type && !currency) {
      return res.status(400).json({
        error: 'At least one field must be provided to update'
      });
    }

    // Validate account type if provided
    if (type) {
      const validTypes = ['cash', 'bank', 'credit', 'wallet'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: `Type must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (type) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (currency) {
      updates.push(`currency = $${paramCount++}`);
      values.push(currency);
    }

    updates.push('modified_at = NOW()');

    values.push(id, householdId);

    const result = await db.query(
      `UPDATE accounts
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND household_id = $${paramCount} AND is_active = true
       RETURNING id, name, type, currency, initial_balance, is_active, created_at, modified_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update account error:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
}

// Adjust account balance by creating a balance adjustment transaction
async function adjustBalance(req, res) {
  try {
    const { householdId, userId } = req.user;
    const { id } = req.params;
    const { newBalance, description } = req.body;

    if (newBalance === undefined) {
      return res.status(400).json({ error: 'New balance is required' });
    }

    // Get current balance
    const accountResult = await db.query(
      `SELECT
        a.id,
        a.name,
        a.currency,
        ${BALANCE_SUBQUERY} as current_balance
       FROM accounts a
       WHERE a.id = $1 AND a.household_id = $2 AND a.is_active = true`,
      [id, householdId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];
    const currentBalance = parseFloat(account.current_balance);
    const adjustment = newBalance - currentBalance;

    if (adjustment === 0) {
      return res.status(400).json({ error: 'New balance is same as current balance' });
    }

    // Get or create Balance Adjustment system category for this household
    let categoryResult = await db.query(
      `SELECT id FROM categories
       WHERE name = 'Balance Adjustment' AND type = 'system' AND household_id = $1`,
      [householdId]
    );

    // Create the system category if it doesn't exist
    if (categoryResult.rows.length === 0) {
      categoryResult = await db.query(
        `INSERT INTO categories (household_id, name, type, icon, color)
         VALUES ($1, 'Balance Adjustment', 'system', 'RefreshCw', '#6B7280')
         RETURNING id`,
        [householdId]
      );
    }

    const balanceAdjustmentCategoryId = categoryResult.rows[0].id;

    // Create adjustment transaction
    const transactionResult = await db.query(
      `INSERT INTO transactions (household_id, date, title, description, type, created_by)
       VALUES ($1, CURRENT_DATE, $2, $3, 'standard', $4)
       RETURNING id`,
      [
        householdId,
        `Balance Adjustment`,
        description || `Adjustment for ${account.name}`,
        userId
      ]
    );

    const transactionId = transactionResult.rows[0].id;

    // Create transaction line
    await db.query(
      `INSERT INTO transaction_lines
       (transaction_id, account_id, amount, currency, exchange_rate_to_base,
        exchange_rate_date, base_currency_amount, direction, category_id)
       VALUES ($1, $2, $3, $4, 1.0, CURRENT_DATE, $3, $5, $6)`,
      [
        transactionId,
        id,
        Math.abs(adjustment),
        account.currency,
        adjustment > 0 ? 'income' : 'expense',
        balanceAdjustmentCategoryId
      ]
    );

    res.json({
      message: 'Balance adjusted successfully',
      account: {
        id: account.id,
        name: account.name,
        previousBalance: currentBalance,
        newBalance: newBalance,
        adjustment: adjustment
      },
      transactionId: transactionId
    });

  } catch (err) {
    console.error('Adjust balance error:', err);
    res.status(500).json({ error: 'Failed to adjust balance' });
  }
}

// Delete account (soft delete by setting is_active = false)
async function deleteAccount(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE accounts
       SET is_active = false, modified_at = NOW()
       WHERE id = $1 AND household_id = $2 AND is_active = true
       RETURNING id, name`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      message: 'Account deactivated successfully',
      account: result.rows[0]
    });

  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
}

module.exports = {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  adjustBalance,
  deleteAccount
};
