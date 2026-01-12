const db = require('../config/database');

// Get all transactions with filters
// Get all transactions with filters
async function getAllTransactions(req, res) {
  try {
    const { householdId } = req.user;
    const { startDate, endDate, accountId, categoryId, type, limit = 50, offset = 0 } = req.query;

    // Build main query
    let query = `
      SELECT
        t.id,
        t.date,
        t.title,
        t.description,
        t.type,
        t.created_by,
        t.created_at,
        t.modified_at,
        u.name as created_by_name,
        (
          SELECT json_agg(
            json_build_object(
              'id', tl.id,
              'accountId', tl.account_id,
              'accountName', a.name,
              'amount', tl.amount,
              'currency', tl.currency,
              'baseCurrencyAmount', tl.base_currency_amount,
              'direction', tl.direction,
              'categoryId', tl.category_id,
              'categoryName', c.name,
              'notes', tl.notes
            )
          )
          FROM transaction_lines tl
          LEFT JOIN accounts a ON tl.account_id = a.id
          LEFT JOIN categories c ON tl.category_id = c.id
          WHERE tl.transaction_id = t.id
        ) as lines
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.household_id = $1 AND t.is_deleted = false
    `;

    const params = [householdId];
    let paramCount = 2;

    // Add filters
    if (startDate) {
      query += ` AND t.date >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND t.date <= $${paramCount++}`;
      params.push(endDate);
    }

    if (accountId) {
      query += ` AND EXISTS (
        SELECT 1 FROM transaction_lines tl 
        WHERE tl.transaction_id = t.id AND tl.account_id = $${paramCount++}
      )`;
      params.push(accountId);
    }

    if (categoryId) {
      query += ` AND EXISTS (
        SELECT 1 FROM transaction_lines tl 
        WHERE tl.transaction_id = t.id AND tl.category_id = $${paramCount++}
      )`;
      params.push(categoryId);
    }

    if (type) {
      query += ` AND t.type = $${paramCount++}`;
      params.push(type);
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC`;
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Process transactions to add calculated fields
    const transactions = result.rows.map(t => {
      const lines = t.lines || [];
      
      // Determine actual type from lines (for "standard" transactions)
      let actualType = t.type;
      if (t.type === 'standard' && lines.length > 0) {
        const allIncome = lines.every(l => l.direction === 'income');
        const allExpense = lines.every(l => l.direction === 'expense');
        
        if (allIncome) {
          actualType = 'income';
        } else if (allExpense) {
          actualType = 'expense';
        }
      }
      
      return {
        ...t,
        type: actualType,
      };
    });

    // Build count query with same filters
    let countQuery = `
      SELECT COUNT(*) FROM transactions t
      WHERE t.household_id = $1 AND t.is_deleted = false
    `;

    const countParams = [householdId];
    let countParamIndex = 2;

    if (startDate) {
      countQuery += ` AND t.date >= $${countParamIndex++}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ` AND t.date <= $${countParamIndex++}`;
      countParams.push(endDate);
    }

    if (accountId) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM transaction_lines tl 
        WHERE tl.transaction_id = t.id AND tl.account_id = $${countParamIndex++}
      )`;
      countParams.push(accountId);
    }

    if (categoryId) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM transaction_lines tl 
        WHERE tl.transaction_id = t.id AND tl.category_id = $${countParamIndex++}
      )`;
      countParams.push(categoryId);
    }

    if (type) {
      countQuery += ` AND t.type = $${countParamIndex++}`;
      countParams.push(type);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + transactions.length < total,
      },
    });

  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
}

// Get single transaction by ID
async function getTransactionById(req, res) {
  try {
    const { householdId } = req.user;
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        t.id,
        t.date,
        t.description,
        t.title,
        t.type,
        t.created_by,
        t.created_at,
        t.modified_at,
        t.version,
        u.name as created_by_name,
        json_agg(
          json_build_object(
            'id', tl.id,
            'accountId', tl.account_id,
            'accountName', a.name,
            'amount', tl.amount,
            'currency', tl.currency,
            'exchangeRateToBase', tl.exchange_rate_to_base,
            'baseCurrencyAmount', tl.base_currency_amount,
            'direction', tl.direction,
            'categoryId', tl.category_id,
            'categoryName', c.name,
            'notes', tl.notes,
            'allocationId', ta.allocation_id,
            'allocationName', al.name,
            'allocationAmount', ta.amount
          ) ORDER BY tl.created_at
        ) as lines
      FROM transactions t
      JOIN users u ON t.created_by = u.id
      LEFT JOIN transaction_lines tl ON t.id = tl.transaction_id
      LEFT JOIN accounts a ON tl.account_id = a.id
      LEFT JOIN categories c ON tl.category_id = c.id
      LEFT JOIN transaction_allocations ta ON tl.id = ta.transaction_line_id
      LEFT JOIN allocations al ON ta.allocation_id = al.id
      WHERE t.id = $1 AND t.household_id = $2 AND t.is_deleted = false
      GROUP BY t.id, t.date, t.title, t.description, t.type, t.created_by,
               t.created_at, t.modified_at, t.version, u.name`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Get transaction error:', err);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
}

// Create new transaction
async function createTransaction(req, res) {
  const client = await db.pool.connect();

  try {
    const { householdId, userId } = req.user;
    const { date, title, description, lines } = req.body;

    // Validation
    if (!date || !title || !lines || lines.length === 0) {
      return res.status(400).json({
        error: 'Date, title, and at least one transaction line are required'
      });
    }

    // Validate each line
    for (const line of lines) {
      if (!line.accountId || !line.amount || !line.currency || !line.direction) {
        return res.status(400).json({ 
          error: 'Each line must have accountId, amount, currency, and direction' 
        });
      }

      // Validate direction
      const validDirections = ['income', 'expense', 'transfer'];
      if (!validDirections.includes(line.direction)) {
        return res.status(400).json({ 
          error: `Direction must be one of: ${validDirections.join(', ')}` 
        });
      }

      // Validate category requirement
      if (line.direction !== 'transfer' && !line.categoryId) {
        return res.status(400).json({ 
          error: 'Category is required for income and expense lines' 
        });
      }

      if (line.direction === 'transfer' && line.categoryId) {
        return res.status(400).json({ 
          error: 'Category not allowed for transfer lines' 
        });
      }
    }

    // Determine transaction type
    const directions = [...new Set(lines.map(l => l.direction))];
    let transactionType;
    
    if (directions.length === 1 && directions[0] === 'transfer') {
      transactionType = 'transfer';
      // Validate transfer has exactly 2 lines
      if (lines.length !== 2) {
        return res.status(400).json({ 
          error: 'Transfer transactions must have exactly 2 lines' 
        });
      }
    } else if (directions.includes('transfer')) {
      transactionType = 'mixed';
    } else {
      transactionType = 'standard';
    }

    await client.query('BEGIN');

    // Create transaction
    const transactionResult = await client.query(
      `INSERT INTO transactions (household_id, date, title, description, type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, date, title, description, type, created_at`,
      [householdId, date, title, description || null, transactionType, userId]
    );

    const transactionId = transactionResult.rows[0].id;

    // Create transaction lines
    const createdLines = [];
    
    for (const line of lines) {
      // Calculate base currency amount (using exchange rate or 1.0 if same currency)
      const exchangeRate = line.exchangeRate || 1.0;
      const baseCurrencyAmount = line.amount * exchangeRate;

      const lineResult = await client.query(
        `INSERT INTO transaction_lines 
         (transaction_id, account_id, amount, currency, exchange_rate_to_base, 
          exchange_rate_date, base_currency_amount, direction, category_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          transactionId,
          line.accountId,
          line.amount,
          line.currency,
          exchangeRate,
          date,
          baseCurrencyAmount,
          line.direction,
          line.categoryId || null,
          line.notes || null
        ]
      );

      const lineId = lineResult.rows[0].id;

      // Link to allocation if provided
      if (line.allocationId) {
        await client.query(
          `INSERT INTO transaction_allocations
           (transaction_line_id, allocation_id, amount)
           VALUES ($1, $2, $3)`,
          [lineId, line.allocationId, Math.abs(line.amount)]
        );
      }

      createdLines.push({ ...line, id: lineId });
    }

    // AUTO-DEDUCT FROM ALLOCATIONS
    // For each expense line, check if there's an allocation for that category/month
    const transactionMonth = new Date(date).toISOString().slice(0, 7) + '-01'; // YYYY-MM-01

    for (const line of createdLines) {
      // Only process expense lines with categories
      if (line.direction === 'expense' && line.categoryId) {
        // Check if allocation exists for this category and month
        const allocationResult = await client.query(
          `SELECT id, available_amount, spent_amount
           FROM allocations
           WHERE household_id = $1
             AND category_id = $2
             AND month = $3`,
          [householdId, line.categoryId, transactionMonth]
        );

        if (allocationResult.rows.length > 0) {
          const allocation = allocationResult.rows[0];
          const expenseAmount = Math.abs(line.amount);

          // Update allocation: increase spent_amount
          await client.query(
            `UPDATE allocations
             SET spent_amount = spent_amount + $1,
                 modified_at = NOW()
             WHERE id = $2`,
            [expenseAmount, allocation.id]
          );

          // Create link between transaction line and allocation
          await client.query(
            `INSERT INTO transaction_allocations
             (transaction_line_id, allocation_id, amount)
             VALUES ($1, $2, $3)`,
            [line.id, allocation.id, expenseAmount]
          );

          console.log(`Auto-deducted $${expenseAmount} from allocation ${allocation.id}`);
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      ...transactionResult.rows[0],
      lines: createdLines
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  } finally {
    client.release();
  }
}

// Update transaction
async function updateTransaction(req, res) {
  const client = await db.pool.connect();
  
  try {
    const { householdId, userId } = req.user;
    const { id } = req.params;
    const { date, description } = req.body;

    // Check transaction exists
    const checkResult = await client.query(
      'SELECT id, version FROM transactions WHERE id = $1 AND household_id = $2 AND is_deleted = false',
      [id, householdId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await client.query('BEGIN');

    // Update transaction
    const result = await client.query(
      `UPDATE transactions 
       SET date = COALESCE($1, date),
           description = COALESCE($2, description),
           version = version + 1
       WHERE id = $3
       RETURNING id, date, description, type, version, modified_at`,
      [date, description, id]
    );

    await client.query('COMMIT');

    res.json(result.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  } finally {
    client.release();
  }
}

// Delete transaction (soft delete)
async function deleteTransaction(req, res) {
  const client = await db.pool.connect();
  
  try {
    const { householdId } = req.user;
    const { id } = req.params;

    await client.query('BEGIN');

    // Get transaction lines with their allocation links before deleting
    const linesResult = await client.query(
      `SELECT 
        tl.id as line_id,
        tl.direction,
        tl.amount,
        ta.allocation_id,
        ta.amount as allocated_amount
       FROM transaction_lines tl
       LEFT JOIN transaction_allocations ta ON tl.id = ta.transaction_line_id
       JOIN transactions t ON tl.transaction_id = t.id
       WHERE t.id = $1 AND t.household_id = $2`,
      [id, householdId]
    );

    // Restore allocation amounts for expense lines
    for (const line of linesResult.rows) {
      if (line.direction === 'expense' && line.allocation_id) {
        // Decrease spent_amount (restore the money)
        await client.query(
          `UPDATE allocations
           SET spent_amount = spent_amount - $1,
               modified_at = NOW()
           WHERE id = $2`,
          [line.allocated_amount, line.allocation_id]
        );

        console.log(`Restored $${line.allocated_amount} to allocation ${line.allocation_id}`);
      }
    }

    // Soft delete the transaction
    const result = await client.query(
      `UPDATE transactions
       SET is_deleted = true
       WHERE id = $1 AND household_id = $2
       RETURNING id, description`,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Transaction deleted successfully',
      transaction: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  } finally {
    client.release();
  }
}

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};
