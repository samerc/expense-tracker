import { getDatabase } from '../index';
import { generateUUID } from '../../utils/uuid';

export interface Account {
  id: string;
  server_id?: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'wallet';
  currency: string;
  initial_balance: number;
  is_active: boolean;
  sync_status: 'pending' | 'synced' | 'conflict' | 'deleted';
  created_at: string;
  modified_at: string;
  // Computed field
  balance?: number;
}

export interface CreateAccountInput {
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'wallet';
  currency: string;
  initial_balance?: number;
}

export interface UpdateAccountInput {
  name?: string;
  type?: 'cash' | 'bank' | 'credit' | 'wallet';
  currency?: string;
  initial_balance?: number;
  is_active?: boolean;
}

// Get all active accounts with computed balances
export const getAllAccounts = async (): Promise<Account[]> => {
  const db = getDatabase();

  const accounts = await db.getAllAsync<Account & { transaction_total: number }>(
    `SELECT
      a.*,
      COALESCE(SUM(
        CASE
          WHEN tl.direction = 'income' THEN ABS(tl.amount)
          WHEN tl.direction = 'expense' THEN -ABS(tl.amount)
          ELSE tl.amount
        END
      ), 0) as transaction_total
    FROM accounts a
    LEFT JOIN transaction_lines tl ON a.id = tl.account_id
    LEFT JOIN transactions t ON tl.transaction_id = t.id AND t.is_deleted = 0
    WHERE a.is_active = 1 AND a.sync_status != 'deleted'
    GROUP BY a.id
    ORDER BY a.created_at DESC`
  );

  return accounts.map((a) => ({
    ...a,
    is_active: Boolean(a.is_active),
    balance: a.initial_balance + (a.transaction_total || 0),
  }));
};

// Get account by ID
export const getAccountById = async (id: string): Promise<Account | null> => {
  const db = getDatabase();

  const account = await db.getFirstAsync<Account & { transaction_total: number }>(
    `SELECT
      a.*,
      COALESCE(SUM(
        CASE
          WHEN tl.direction = 'income' THEN ABS(tl.amount)
          WHEN tl.direction = 'expense' THEN -ABS(tl.amount)
          ELSE tl.amount
        END
      ), 0) as transaction_total
    FROM accounts a
    LEFT JOIN transaction_lines tl ON a.id = tl.account_id
    LEFT JOIN transactions t ON tl.transaction_id = t.id AND t.is_deleted = 0
    WHERE a.id = ? AND a.sync_status != 'deleted'
    GROUP BY a.id`,
    [id]
  );

  if (!account) return null;

  return {
    ...account,
    is_active: Boolean(account.is_active),
    balance: account.initial_balance + (account.transaction_total || 0),
  };
};

// Create new account
export const createAccount = async (input: CreateAccountInput): Promise<Account> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency, initial_balance, is_active, sync_status, created_at, modified_at)
     VALUES (?, ?, ?, ?, ?, 1, 'pending', ?, ?)`,
    [id, input.name, input.type, input.currency, input.initial_balance || 0, now, now]
  );

  const account = await getAccountById(id);
  if (!account) throw new Error('Failed to create account');

  return account;
};

// Update account
export const updateAccount = async (id: string, input: UpdateAccountInput): Promise<Account> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.type !== undefined) {
    updates.push('type = ?');
    values.push(input.type);
  }
  if (input.currency !== undefined) {
    updates.push('currency = ?');
    values.push(input.currency);
  }
  if (input.initial_balance !== undefined) {
    updates.push('initial_balance = ?');
    values.push(input.initial_balance);
  }
  if (input.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(input.is_active ? 1 : 0);
  }

  // Always update modified_at and set sync_status to pending
  updates.push('modified_at = ?');
  values.push(now);
  updates.push("sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END");

  values.push(id);

  await db.runAsync(
    `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const account = await getAccountById(id);
  if (!account) throw new Error('Account not found');

  return account;
};

// Soft delete account
export const deleteAccount = async (id: string): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE accounts SET is_active = 0, sync_status = 'deleted', modified_at = ? WHERE id = ?`,
    [now, id]
  );
};

// Get total balance across all accounts
export const getTotalBalance = async (): Promise<number> => {
  const accounts = await getAllAccounts();
  return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
};

// Get accounts pending sync
export const getPendingSyncAccounts = async (): Promise<Account[]> => {
  const db = getDatabase();

  const accounts = await db.getAllAsync<Account>(
    `SELECT * FROM accounts WHERE sync_status IN ('pending', 'deleted')`
  );

  return accounts.map((a) => ({
    ...a,
    is_active: Boolean(a.is_active),
  }));
};

// Mark account as synced
export const markAccountSynced = async (id: string, serverId: string): Promise<void> => {
  const db = getDatabase();

  await db.runAsync(
    `UPDATE accounts SET sync_status = 'synced', server_id = ?, server_modified_at = modified_at WHERE id = ?`,
    [serverId, id]
  );
};
