const db = require('../config/database');

// Dashboard summary
async function getDashboardSummary(req, res) {
  try {
    const { householdId } = req.user;
    
    // Get current month's income and expenses
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const result = await db.query(
      `SELECT
        COALESCE(SUM(ABS(tl.base_currency_amount)) FILTER (WHERE tl.direction = 'income'), 0) as income,
        COALESCE(SUM(ABS(tl.base_currency_amount)) FILTER (WHERE tl.direction = 'expense'), 0) as expenses
       FROM transaction_lines tl
       JOIN transactions t ON tl.transaction_id = t.id
       WHERE t.household_id = $1
         AND t.is_deleted = false
         AND TO_CHAR(t.date, 'YYYY-MM') = $2`,
      [householdId, currentMonth]
    );
    
    const income = parseFloat(result.rows[0]?.income || 0);
    const expenses = parseFloat(result.rows[0]?.expenses || 0);
    
    // Get account balances
    const accountsResult = await db.query(
      `SELECT 
        COUNT(*) as total_accounts,
        COALESCE(SUM(current_balance), 0) as total_balance
       FROM accounts
       WHERE household_id = $1 AND is_deleted = false`,
      [householdId]
    );
    
    const totalAccounts = parseInt(accountsResult.rows[0]?.total_accounts || 0);
    const totalBalance = parseFloat(accountsResult.rows[0]?.total_balance || 0);
    
    res.json({
      currentMonth: {
        income,
        expenses,
        net: income - expenses
      },
      accounts: {
        total: totalAccounts,
        totalBalance
      }
    });
  } catch (err) {
    console.error('Get dashboard summary error:', err);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
}

// Expenses by category
async function getExpensesByCategory(req, res) {
  try {
    const { householdId } = req.user;
    const { startDate, endDate, limit = 10 } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }
    
    const queryText = `SELECT
        c.id as category_id,
        c.name as category_name,
        c.icon,
        c.color,
        COALESCE(SUM(ABS(tl.base_currency_amount)), 0) as total_amount,
        COUNT(DISTINCT t.id) as transaction_count
       FROM categories c
       LEFT JOIN transaction_lines tl ON c.id = tl.category_id AND tl.direction = 'expense'
       LEFT JOIN transactions t ON tl.transaction_id = t.id AND t.household_id = $1 AND t.is_deleted = false
       WHERE (c.household_id = $1 OR (c.type = 'system' AND c.household_id IS NULL))
         AND (c.type = 'expense' OR c.type = 'system')
         AND c.is_active = true
         AND (t.id IS NULL OR t.date BETWEEN $2 AND $3)
       GROUP BY c.id, c.name, c.icon, c.color
       HAVING SUM(ABS(tl.base_currency_amount)) > 0
       ORDER BY total_amount DESC
       LIMIT $4`;
    
    const params = [householdId, startDate, endDate, limit];
    
//    console.log('Query params:', params);
    
    const result = await db.query(queryText, params);
    
//  console.log('Query returned', result.rows.length, 'categories');
//  console.log('Results:', result.rows);
    
    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
    
//    console.log('Total expenses:', total);
    
    res.json({
      categories: result.rows.map(row => ({
        ...row,
        totalAmount: parseFloat(row.total_amount),
        transactionCount: parseInt(row.transaction_count),
        percentage: total > 0 ? ((parseFloat(row.total_amount) / total) * 100).toFixed(2) : 0
      })),
      total: total,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get expenses by category error:', err);
    res.status(500).json({ error: 'Failed to get expenses by category' });
  }
}

// Income by category
async function getIncomeByCategory(req, res) {
  try {
    const { householdId } = req.user;
    const { startDate, endDate } = req.query;

    console.log('=== GET INCOME BY CATEGORY ===');
    console.log('Household:', householdId);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }
    
    const result = await db.query(
      `SELECT
        c.id as category_id,
        c.name as category_name,
        c.icon,
        c.color,
        COALESCE(SUM(ABS(tl.base_currency_amount)), 0) as total_amount,
        COUNT(DISTINCT t.id) as transaction_count
       FROM categories c
       LEFT JOIN transaction_lines tl ON c.id = tl.category_id AND tl.direction = 'income'
       LEFT JOIN transactions t ON tl.transaction_id = t.id AND t.household_id = $1 AND t.is_deleted = false
       WHERE (c.household_id = $1 OR (c.type = 'system' AND c.household_id IS NULL))
         AND (c.type = 'income' OR c.type = 'system')
         AND c.is_active = true
         AND (t.id IS NULL OR t.date BETWEEN $2 AND $3)
       GROUP BY c.id, c.name, c.icon, c.color
       HAVING SUM(ABS(tl.base_currency_amount)) > 0
       ORDER BY total_amount DESC`,
      [householdId, startDate, endDate]
    );
    
    console.log('Query returned', result.rows.length, 'categories');
    console.log('Raw results:', result.rows);

    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
    
        console.log('Total income calculated:', total);

    res.json({
      categories: result.rows.map(row => ({
        ...row,
        totalAmount: parseFloat(row.total_amount),
        transactionCount: parseInt(row.transaction_count),
        percentage: total > 0 ? ((parseFloat(row.total_amount) / total) * 100).toFixed(2) : 0
      })),
      total: total,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get income by category error:', err);
    res.status(500).json({ error: 'Failed to get income by category' });
  }
}

// Spending trends over time
async function getSpendingTrends(req, res) {
  try {
    const { householdId } = req.user;
    const { startDate, endDate } = req.query;
    
    console.log('=== GET SPENDING TRENDS ===');
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }
    
    const result = await db.query(
      `SELECT
        TO_CHAR(t.date, 'YYYY-MM') as month,
        COALESCE(SUM(ABS(tl.base_currency_amount)) FILTER (WHERE tl.direction = 'income'), 0) as income,
        COALESCE(SUM(ABS(tl.base_currency_amount)) FILTER (WHERE tl.direction = 'expense'), 0) as expenses
       FROM transactions t
       JOIN transaction_lines tl ON t.id = tl.transaction_id
       WHERE t.household_id = $1
         AND t.is_deleted = false
         AND t.date BETWEEN $2 AND $3
       GROUP BY TO_CHAR(t.date, 'YYYY-MM')
       ORDER BY month ASC`,
      [householdId, startDate, endDate]
    );
    
 //   console.log('Trends query returned:', result.rows);
    
    res.json({
      trends: result.rows.map(row => ({
        month: row.month,
        income: parseFloat(row.income),
        expenses: parseFloat(row.expenses),
        net: parseFloat(row.income) - parseFloat(row.expenses)
      })),
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get spending trends error:', err);
    res.status(500).json({ error: 'Failed to get spending trends' });
  }
}

// Account balances over time
async function getAccountBalancesOverTime(req, res) {
  try {
    const { householdId } = req.user;
    const { accountId, startDate, endDate } = req.query;
    
    if (!accountId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Account ID, start date, and end date are required'
      });
    }
    
    // Get account initial balance
    const accountResult = await db.query(
      `SELECT initial_balance FROM accounts WHERE id = $1 AND household_id = $2`,
      [accountId, householdId]
    );
    
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const initialBalance = parseFloat(accountResult.rows[0].initial_balance);
    
    // Get transactions for this account in date range
    const result = await db.query(
      `SELECT
        t.date,
        tl.amount,
        t.description
       FROM transaction_lines tl
       JOIN transactions t ON tl.transaction_id = t.id
       WHERE tl.account_id = $1
         AND t.household_id = $2
         AND t.date BETWEEN $3 AND $4
         AND t.is_deleted = false
       ORDER BY t.date ASC, t.created_at ASC`,
      [accountId, householdId, startDate, endDate]
    );
    
    // Calculate running balance
    let runningBalance = initialBalance;
    const balances = result.rows.map(row => {
      runningBalance += parseFloat(row.amount);
      return {
        date: row.date,
        balance: runningBalance,
        description: row.description
      };
    });
    
    res.json({
      accountId,
      initialBalance,
      balances,
      finalBalance: runningBalance
    });
  } catch (err) {
    console.error('Get account balances error:', err);
    res.status(500).json({ error: 'Failed to get account balances' });
  }
}

// Top expenses
async function getTopExpenses(req, res) {
  try {
    const { householdId } = req.user;
    const { startDate, endDate, limit = 10 } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }
    
    const result = await db.query(
      `SELECT
        t.id as transaction_id,
        t.date,
        t.description,
        c.name as category_name,
        c.icon,
        c.color,
        ABS(tl.base_currency_amount) as amount
       FROM transactions t
       JOIN transaction_lines tl ON t.id = tl.transaction_id
       LEFT JOIN categories c ON tl.category_id = c.id
       WHERE t.household_id = $1
         AND t.is_deleted = false
         AND tl.direction = 'expense'
         AND t.date BETWEEN $2 AND $3
       ORDER BY amount DESC
       LIMIT $4`,
      [householdId, startDate, endDate, limit]
    );
    
    res.json({
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get top expenses error:', err);
    res.status(500).json({ error: 'Failed to get top expenses' });
  }
}

// Get transactions for a specific category
async function getCategoryTransactions(req, res) {
  try {
    const { householdId } = req.user;
    const { categoryId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    const result = await db.query(
      `SELECT
        t.id as transaction_id,
        t.date,
        t.description,
        tl.amount,
        tl.base_currency_amount,
        a.name as account_name
       FROM transactions t
       JOIN transaction_lines tl ON t.id = tl.transaction_id
       JOIN accounts a ON tl.account_id = a.id
       WHERE t.household_id = $1
         AND tl.category_id = $2
         AND t.date BETWEEN $3 AND $4
         AND t.is_deleted = false
       ORDER BY t.date DESC, t.created_at DESC`,
      [householdId, categoryId, startDate, endDate]
    );

    res.json({
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get category transactions error:', err);
    res.status(500).json({ error: 'Failed to get category transactions' });
  }
}

// Export transactions to CSV
async function exportTransactionsCSV(req, res) {
  try {
    const { householdId } = req.user;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }
    
    const result = await db.query(
      `SELECT
        t.date,
        t.description,
        c.name as category,
        a.name as account,
        tl.direction,
        ABS(tl.amount) as amount,
        tl.currency
       FROM transactions t
       JOIN transaction_lines tl ON t.id = tl.transaction_id
       JOIN accounts a ON tl.account_id = a.id
       LEFT JOIN categories c ON tl.category_id = c.id
       WHERE t.household_id = $1
         AND t.is_deleted = false
         AND t.date BETWEEN $2 AND $3
       ORDER BY t.date DESC, t.created_at DESC`,
      [householdId, startDate, endDate]
    );
    
    // Build CSV
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Currency'];
    const rows = result.rows.map(row => [
      row.date,
      row.description,
      row.category || 'Uncategorized',
      row.account,
      row.direction,
      row.amount,
      row.currency
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${startDate}_${endDate}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Export transactions CSV error:', err);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
}

module.exports = {
  getDashboardSummary,
  getExpensesByCategory,
  getIncomeByCategory,
  getSpendingTrends,
  getAccountBalancesOverTime,
  getTopExpenses,
  getCategoryTransactions,
  exportTransactionsCSV
};