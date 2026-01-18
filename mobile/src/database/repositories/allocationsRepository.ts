import { getDatabase } from '../index';
import { generateUUID } from '../../utils/uuid';

export interface Allocation {
  id: string;
  server_id?: string;
  category_id: string;
  month: string;
  allocated_amount: number;
  available_amount: number;
  spent_amount: number;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'conflict' | 'deleted';
  created_at: string;
  modified_at: string;
  // Computed
  balance?: number;
  // Joined
  category?: { id: string; name: string; icon?: string; color?: string; type: string };
}

export interface CreateAllocationInput {
  category_id: string;
  month: string;
  allocated_amount?: number;
  available_amount?: number;
  notes?: string;
}

export interface UpdateAllocationInput {
  allocated_amount?: number;
  available_amount?: number;
  spent_amount?: number;
  notes?: string;
}

// Get all allocations for a month
export const getAllocationsByMonth = async (month: string): Promise<Allocation[]> => {
  const db = getDatabase();
  const monthDate = month + '-01';

  const allocations = await db.getAllAsync<Allocation & {
    category_name: string;
    category_icon?: string;
    category_color?: string;
    category_type: string;
  }>(
    `SELECT
      a.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      c.type as category_type
    FROM allocations a
    JOIN categories c ON a.category_id = c.id
    WHERE a.month = ? AND a.sync_status != 'deleted' AND c.is_active = 1
    ORDER BY c.name`,
    [monthDate]
  );

  return allocations.map((a) => ({
    ...a,
    balance: a.available_amount - a.spent_amount,
    category: {
      id: a.category_id,
      name: a.category_name,
      icon: a.category_icon,
      color: a.category_color,
      type: a.category_type,
    },
  }));
};

// Get allocation by ID
export const getAllocationById = async (id: string): Promise<Allocation | null> => {
  const db = getDatabase();

  const allocation = await db.getFirstAsync<Allocation & {
    category_name: string;
    category_icon?: string;
    category_color?: string;
    category_type: string;
  }>(
    `SELECT
      a.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      c.type as category_type
    FROM allocations a
    JOIN categories c ON a.category_id = c.id
    WHERE a.id = ? AND a.sync_status != 'deleted'`,
    [id]
  );

  if (!allocation) return null;

  return {
    ...allocation,
    balance: allocation.available_amount - allocation.spent_amount,
    category: {
      id: allocation.category_id,
      name: allocation.category_name,
      icon: allocation.category_icon,
      color: allocation.category_color,
      type: allocation.category_type,
    },
  };
};

// Get or create allocation for category/month
export const getOrCreateAllocation = async (categoryId: string, month: string): Promise<Allocation> => {
  const db = getDatabase();
  const monthDate = month.length === 7 ? month + '-01' : month;

  let allocation = await db.getFirstAsync<Allocation>(
    `SELECT * FROM allocations WHERE category_id = ? AND month = ? AND sync_status != 'deleted'`,
    [categoryId, monthDate]
  );

  if (!allocation) {
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO allocations (id, category_id, month, allocated_amount, available_amount, spent_amount, sync_status, created_at, modified_at)
       VALUES (?, ?, ?, 0, 0, 0, 'pending', ?, ?)`,
      [id, categoryId, monthDate, now, now]
    );

    allocation = await db.getFirstAsync<Allocation>(
      `SELECT * FROM allocations WHERE id = ?`,
      [id]
    );
  }

  return allocation!;
};

// Create allocation
export const createAllocation = async (input: CreateAllocationInput): Promise<Allocation> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();
  const monthDate = input.month.length === 7 ? input.month + '-01' : input.month;

  await db.runAsync(
    `INSERT INTO allocations (id, category_id, month, allocated_amount, available_amount, spent_amount, notes, sync_status, created_at, modified_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, 'pending', ?, ?)`,
    [
      id,
      input.category_id,
      monthDate,
      input.allocated_amount || 0,
      input.available_amount || 0,
      input.notes || null,
      now,
      now,
    ]
  );

  const allocation = await getAllocationById(id);
  if (!allocation) throw new Error('Failed to create allocation');

  return allocation;
};

// Update allocation
export const updateAllocation = async (id: string, input: UpdateAllocationInput): Promise<Allocation> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (input.allocated_amount !== undefined) {
    updates.push('allocated_amount = ?');
    values.push(input.allocated_amount);
  }
  if (input.available_amount !== undefined) {
    updates.push('available_amount = ?');
    values.push(input.available_amount);
  }
  if (input.spent_amount !== undefined) {
    updates.push('spent_amount = ?');
    values.push(input.spent_amount);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes);
  }

  updates.push('modified_at = ?');
  values.push(now);
  updates.push("sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END");

  values.push(id);

  await db.runAsync(
    `UPDATE allocations SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const allocation = await getAllocationById(id);
  if (!allocation) throw new Error('Allocation not found');

  return allocation;
};

// Fund income to allocation (add to available_amount)
export const fundAllocation = async (id: string, amount: number): Promise<Allocation> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE allocations SET
      available_amount = available_amount + ?,
      modified_at = ?,
      sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END
    WHERE id = ?`,
    [amount, now, id]
  );

  const allocation = await getAllocationById(id);
  if (!allocation) throw new Error('Allocation not found');

  return allocation;
};

// Move money between allocations
export const moveMoney = async (fromId: string, toId: string, amount: number): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Deduct from source
  await db.runAsync(
    `UPDATE allocations SET
      available_amount = available_amount - ?,
      modified_at = ?,
      sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END
    WHERE id = ?`,
    [amount, now, fromId]
  );

  // Add to destination
  await db.runAsync(
    `UPDATE allocations SET
      available_amount = available_amount + ?,
      modified_at = ?,
      sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END
    WHERE id = ?`,
    [amount, now, toId]
  );
};

// Get unallocated funds (total income - total funded)
export const getUnallocatedFunds = async (month: string): Promise<number> => {
  const db = getDatabase();
  const monthDate = month.length === 7 ? month + '-01' : month;
  const startDate = monthDate;
  const endDate = month.substring(0, 7) + '-31';

  // Get total income for the month
  const incomeResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(ABS(tl.amount)), 0) as total
    FROM transaction_lines tl
    JOIN transactions t ON tl.transaction_id = t.id
    WHERE tl.direction = 'income'
      AND t.date >= ? AND t.date <= ?
      AND t.is_deleted = 0 AND t.sync_status != 'deleted'
      AND tl.sync_status != 'deleted'`,
    [startDate, endDate]
  );

  // Get total funded amount for the month
  const fundedResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(available_amount), 0) as total
    FROM allocations
    WHERE month = ? AND sync_status != 'deleted'`,
    [monthDate]
  );

  const totalIncome = incomeResult?.total || 0;
  const totalFunded = fundedResult?.total || 0;

  return totalIncome - totalFunded;
};

// Get summary for a month
export const getAllocationSummary = async (month: string): Promise<{
  totalAllocated: number;
  totalAvailable: number;
  totalSpent: number;
  totalBalance: number;
  unallocatedFunds: number;
}> => {
  const db = getDatabase();
  const monthDate = month.length === 7 ? month + '-01' : month;

  const result = await db.getFirstAsync<{
    totalAllocated: number;
    totalAvailable: number;
    totalSpent: number;
  }>(
    `SELECT
      COALESCE(SUM(allocated_amount), 0) as totalAllocated,
      COALESCE(SUM(available_amount), 0) as totalAvailable,
      COALESCE(SUM(spent_amount), 0) as totalSpent
    FROM allocations
    WHERE month = ? AND sync_status != 'deleted'`,
    [monthDate]
  );

  const unallocatedFunds = await getUnallocatedFunds(month);

  return {
    totalAllocated: result?.totalAllocated || 0,
    totalAvailable: result?.totalAvailable || 0,
    totalSpent: result?.totalSpent || 0,
    totalBalance: (result?.totalAvailable || 0) - (result?.totalSpent || 0),
    unallocatedFunds,
  };
};

// Get allocations pending sync
export const getPendingSyncAllocations = async (): Promise<Allocation[]> => {
  const db = getDatabase();

  const allocations = await db.getAllAsync<Allocation>(
    `SELECT * FROM allocations WHERE sync_status IN ('pending', 'deleted')`
  );

  return allocations;
};

// Mark allocation as synced
export const markAllocationSynced = async (id: string, serverId: string): Promise<void> => {
  const db = getDatabase();

  await db.runAsync(
    `UPDATE allocations SET sync_status = 'synced', server_id = ?, server_modified_at = modified_at WHERE id = ?`,
    [serverId, id]
  );
};
