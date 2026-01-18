import { getDatabase } from '../index';
import { generateUUID } from '../../utils/uuid';

export interface Category {
  id: string;
  server_id?: string;
  name: string;
  type: 'income' | 'expense' | 'system';
  icon?: string;
  color?: string;
  is_active: boolean;
  sync_status: 'pending' | 'synced' | 'conflict' | 'deleted';
  created_at: string;
  modified_at: string;
}

export interface CreateCategoryInput {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: 'income' | 'expense';
  icon?: string;
  color?: string;
  is_active?: boolean;
}

// Get all active categories
export const getAllCategories = async (): Promise<Category[]> => {
  const db = getDatabase();

  const categories = await db.getAllAsync<Category>(
    `SELECT * FROM categories
     WHERE is_active = 1 AND sync_status != 'deleted'
     ORDER BY type, name`
  );

  return categories.map((c) => ({
    ...c,
    is_active: Boolean(c.is_active),
  }));
};

// Get categories by type
export const getCategoriesByType = async (type: 'income' | 'expense'): Promise<Category[]> => {
  const db = getDatabase();

  const categories = await db.getAllAsync<Category>(
    `SELECT * FROM categories
     WHERE type = ? AND is_active = 1 AND sync_status != 'deleted'
     ORDER BY name`,
    [type]
  );

  return categories.map((c) => ({
    ...c,
    is_active: Boolean(c.is_active),
  }));
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  const db = getDatabase();

  const category = await db.getFirstAsync<Category>(
    `SELECT * FROM categories WHERE id = ? AND sync_status != 'deleted'`,
    [id]
  );

  if (!category) return null;

  return {
    ...category,
    is_active: Boolean(category.is_active),
  };
};

// Create new category
export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO categories (id, name, type, icon, color, is_active, sync_status, created_at, modified_at)
     VALUES (?, ?, ?, ?, ?, 1, 'pending', ?, ?)`,
    [id, input.name, input.type, input.icon || null, input.color || null, now, now]
  );

  const category = await getCategoryById(id);
  if (!category) throw new Error('Failed to create category');

  return category;
};

// Update category
export const updateCategory = async (id: string, input: UpdateCategoryInput): Promise<Category> => {
  const db = getDatabase();
  const now = new Date().toISOString();

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
  if (input.icon !== undefined) {
    updates.push('icon = ?');
    values.push(input.icon);
  }
  if (input.color !== undefined) {
    updates.push('color = ?');
    values.push(input.color);
  }
  if (input.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(input.is_active ? 1 : 0);
  }

  updates.push('modified_at = ?');
  values.push(now);
  updates.push("sync_status = CASE WHEN sync_status = 'synced' THEN 'pending' ELSE sync_status END");

  values.push(id);

  await db.runAsync(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const category = await getCategoryById(id);
  if (!category) throw new Error('Category not found');

  return category;
};

// Soft delete category
export const deleteCategory = async (id: string): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE categories SET is_active = 0, sync_status = 'deleted', modified_at = ? WHERE id = ?`,
    [now, id]
  );
};

// Get categories pending sync
export const getPendingSyncCategories = async (): Promise<Category[]> => {
  const db = getDatabase();

  const categories = await db.getAllAsync<Category>(
    `SELECT * FROM categories WHERE sync_status IN ('pending', 'deleted')`
  );

  return categories.map((c) => ({
    ...c,
    is_active: Boolean(c.is_active),
  }));
};

// Mark category as synced
export const markCategorySynced = async (id: string, serverId: string): Promise<void> => {
  const db = getDatabase();

  await db.runAsync(
    `UPDATE categories SET sync_status = 'synced', server_id = ?, server_modified_at = modified_at WHERE id = ?`,
    [serverId, id]
  );
};
