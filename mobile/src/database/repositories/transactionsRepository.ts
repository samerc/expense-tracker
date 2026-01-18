import { getDatabase } from '../index';
import { generateUUID } from '../../utils/uuid';

export interface TransactionLine {
  id: string;
  server_id?: string;
  transaction_id: string;
  account_id: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  direction: 'income' | 'expense' | 'transfer';
  category_id?: string;
  notes?: string;
  // Joined data
  category?: { id: string; name: string; icon?: string; color?: string };
  account?: { id: string; name: string; currency: string };
}

export interface Transaction {
  id: string;
  server_id?: string;
  date: string;
  title: string;
  description?: string;
  type?: 'standard' | 'transfer' | 'mixed';
  is_deleted: boolean;
  sync_status: 'pending' | 'synced' | 'conflict' | 'deleted';
  created_at: string;
  modified_at: string;
  lines: TransactionLine[];
}

export interface CreateTransactionLineInput {
  account_id: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  direction: 'income' | 'expense' | 'transfer';
  category_id?: string;
  notes?: string;
}

export interface CreateTransactionInput {
  date: string;
  title: string;
  description?: string;
  lines: CreateTransactionLineInput[];
}

export interface UpdateTransactionInput {
  date?: string;
  title?: string;
  description?: string;
  lines?: CreateTransactionLineInput[];
}

// Get all transactions with lines
export const getAllTransactions = async (options?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}): Promise<Transaction[]> => {
  const db = getDatabase();

  let query = `
    SELECT * FROM transactions
    WHERE is_deleted = 0 AND sync_status != 'deleted'
  `;
  const params: any[] = [];

  if (options?.startDate) {
    query += ' AND date >= ?';
    params.push(options.startDate);
  }
  if (options?.endDate) {
    query += ' AND date <= ?';
    params.push(options.endDate);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options?.offset) {
    query += ' OFFSET ?';
    params.push(options.offset);
  }

  const transactions = await db.getAllAsync<Transaction>(query, params);

  // Fetch lines for each transaction
  const result: Transaction[] = [];
  for (const tx of transactions) {
    const lines = await getTransactionLines(tx.id);
    result.push({
      ...tx,
      is_deleted: Boolean(tx.is_deleted),
      lines,
    });
  }

  return result;
};

// Get transaction by ID
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  const db = getDatabase();

  const transaction = await db.getFirstAsync<Transaction>(
    `SELECT * FROM transactions WHERE id = ? AND sync_status != 'deleted'`,
    [id]
  );

  if (!transaction) return null;

  const lines = await getTransactionLines(id);

  return {
    ...transaction,
    is_deleted: Boolean(transaction.is_deleted),
    lines,
  };
};

// Get transaction lines with joined data
const getTransactionLines = async (transactionId: string): Promise<TransactionLine[]> => {
  const db = getDatabase();

  const lines = await db.getAllAsync<TransactionLine & {
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    account_name?: string;
    account_currency?: string;
  }>(
    `SELECT
      tl.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      a.name as account_name,
      a.currency as account_currency
    FROM transaction_lines tl
    LEFT JOIN categories c ON tl.category_id = c.id
    LEFT JOIN accounts a ON tl.account_id = a.id
    WHERE tl.transaction_id = ? AND tl.sync_status != 'deleted'`,
    [transactionId]
  );

  return lines.map((line) => ({
    ...line,
    category: line.category_id
      ? { id: line.category_id, name: line.category_name!, icon: line.category_icon, color: line.category_color }
      : undefined,
    account: { id: line.account_id, name: line.account_name!, currency: line.account_currency! },
  }));
};

// Create new transaction
export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  const db = getDatabase();
  const transactionId = generateUUID();
  const now = new Date().toISOString();

  // Determine transaction type
  const hasIncome = input.lines.some((l) => l.direction === 'income');
  const hasExpense = input.lines.some((l) => l.direction === 'expense');
  const hasTransfer = input.lines.some((l) => l.direction === 'transfer');

  let type: 'standard' | 'transfer' | 'mixed' = 'standard';
  if (hasTransfer && !hasIncome && !hasExpense) {
    type = 'transfer';
  } else if ((hasIncome && hasExpense) || hasTransfer) {
    type = 'mixed';
  }

  // Insert transaction
  await db.runAsync(
    `INSERT INTO transactions (id, date, title, description, type, is_deleted, sync_status, created_at, modified_at)
     VALUES (?, ?, ?, ?, ?, 0, 'pending', ?, ?)`,
    [transactionId, input.date, input.title, input.description || null, type, now, now]
  );

  // Insert lines
  for (const line of input.lines) {
    const lineId = generateUUID();
    const baseAmount = line.amount * (line.exchange_rate || 1);

    await db.runAsync(
      `INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate, base_amount, direction, category_id, notes, sync_status, created_at, modified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        lineId,
        transactionId,
        line.account_id,
        line.amount,
        line.currency,
        line.exchange_rate || 1,
        baseAmount,
        line.direction,
        line.category_id || null,
        line.notes || null,
        now,
        now,
      ]
    );

    // Update allocation if expense
    if (line.direction === 'expense' && line.category_id) {
      await updateAllocationSpent(line.category_id, input.date, Math.abs(line.amount));
    }
  }

  const transaction = await getTransactionById(transactionId);
  if (!transaction) throw new Error('Failed to create transaction');

  return transaction;
};

// Update transaction
export const updateTransaction = async (id: string, input: UpdateTransactionInput): Promise<Transaction> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get existing transaction to restore allocations
  const existingTx = await getTransactionById(id);
  if (!existingTx) throw new Error('Transaction not found');

  // Restore allocations from old lines
  for (const line of existingTx.lines) {
    if (line.direction === 'expense' && line.category_id) {
      await updateAllocationSpent(line.category_id, existingTx.date, -Math.abs(line.amount));
    }
  }

  // Update transaction header
  const updates: string[] = [];
  const values: any[] = [];

  if (input.date !== undefined) {
    updates.push('date = ?');
    values.push(input.date);
  }
  if (input.title !== undefined) {
    updates.push('title = ?');
    values.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }

  updates.push('modified_at = ?');
  values.push(now);
  updates.push("sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END");

  values.push(id);

  if (updates.length > 2) {
    await db.runAsync(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Update lines if provided
  if (input.lines) {
    // Delete old lines
    await db.runAsync(
      `UPDATE transaction_lines SET sync_status = 'deleted', modified_at = ? WHERE transaction_id = ?`,
      [now, id]
    );

    // Insert new lines
    const txDate = input.date || existingTx.date;
    for (const line of input.lines) {
      const lineId = generateUUID();
      const baseAmount = line.amount * (line.exchange_rate || 1);

      await db.runAsync(
        `INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate, base_amount, direction, category_id, notes, sync_status, created_at, modified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          lineId,
          id,
          line.account_id,
          line.amount,
          line.currency,
          line.exchange_rate || 1,
          baseAmount,
          line.direction,
          line.category_id || null,
          line.notes || null,
          now,
          now,
        ]
      );

      // Update allocation if expense
      if (line.direction === 'expense' && line.category_id) {
        await updateAllocationSpent(line.category_id, txDate, Math.abs(line.amount));
      }
    }
  }

  const transaction = await getTransactionById(id);
  if (!transaction) throw new Error('Transaction not found');

  return transaction;
};

// Soft delete transaction
export const deleteTransaction = async (id: string): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get transaction to restore allocations
  const tx = await getTransactionById(id);
  if (tx) {
    for (const line of tx.lines) {
      if (line.direction === 'expense' && line.category_id) {
        await updateAllocationSpent(line.category_id, tx.date, -Math.abs(line.amount));
      }
    }
  }

  await db.runAsync(
    `UPDATE transactions SET is_deleted = 1, sync_status = 'deleted', modified_at = ? WHERE id = ?`,
    [now, id]
  );

  await db.runAsync(
    `UPDATE transaction_lines SET sync_status = 'deleted', modified_at = ? WHERE transaction_id = ?`,
    [now, id]
  );
};

// Helper to update allocation spent amount
const updateAllocationSpent = async (categoryId: string, date: string, amount: number): Promise<void> => {
  const db = getDatabase();
  const month = date.substring(0, 7) + '-01'; // YYYY-MM-01

  // Check if allocation exists
  const allocation = await db.getFirstAsync<{ id: string; spent_amount: number }>(
    `SELECT id, spent_amount FROM allocations WHERE category_id = ? AND month = ?`,
    [categoryId, month]
  );

  if (allocation) {
    const newSpent = Math.max(0, allocation.spent_amount + amount);
    await db.runAsync(
      `UPDATE allocations SET spent_amount = ?, modified_at = datetime('now'),
       sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END
       WHERE id = ?`,
      [newSpent, allocation.id]
    );
  } else if (amount > 0) {
    // Create new allocation for this category/month
    const allocationId = generateUUID();
    await db.runAsync(
      `INSERT INTO allocations (id, category_id, month, allocated_amount, available_amount, spent_amount, sync_status)
       VALUES (?, ?, ?, 0, 0, ?, 'pending')`,
      [allocationId, categoryId, month, amount]
    );
  }
};

// Get transactions by date range for reports
export const getTransactionsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  return getAllTransactions({ startDate, endDate });
};

// Get monthly totals
export const getMonthlyTotals = async (month: string): Promise<{ income: number; expense: number }> => {
  const db = getDatabase();
  const startDate = month + '-01';
  const endDate = month + '-31';

  const result = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
      COALESCE(SUM(CASE WHEN tl.direction = 'income' THEN ABS(tl.amount) ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN tl.direction = 'expense' THEN ABS(tl.amount) ELSE 0 END), 0) as expense
    FROM transaction_lines tl
    JOIN transactions t ON tl.transaction_id = t.id
    WHERE t.date >= ? AND t.date <= ?
      AND t.is_deleted = 0 AND t.sync_status != 'deleted'
      AND tl.sync_status != 'deleted'`,
    [startDate, endDate]
  );

  return result || { income: 0, expense: 0 };
};

// Get transactions pending sync
export const getPendingSyncTransactions = async (): Promise<Transaction[]> => {
  const db = getDatabase();

  const transactions = await db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE sync_status IN ('pending', 'deleted')`
  );

  const result: Transaction[] = [];
  for (const tx of transactions) {
    const lines = await db.getAllAsync<TransactionLine>(
      `SELECT * FROM transaction_lines WHERE transaction_id = ?`,
      [tx.id]
    );
    result.push({
      ...tx,
      is_deleted: Boolean(tx.is_deleted),
      lines,
    });
  }

  return result;
};

// Mark transaction as synced
export const markTransactionSynced = async (id: string, serverId: string): Promise<void> => {
  const db = getDatabase();

  await db.runAsync(
    `UPDATE transactions SET sync_status = 'synced', server_id = ?, server_modified_at = modified_at WHERE id = ?`,
    [serverId, id]
  );
};
