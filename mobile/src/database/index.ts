import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SCHEMA_VERSION, DEFAULT_CATEGORIES, DEFAULT_ACCOUNT } from './schema';
import { generateUUID } from '../utils/uuid';

let db: SQLite.SQLiteDatabase | null = null;

// Initialize database connection
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('expense_tracker.db');

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.execAsync(CREATE_TABLES_SQL);

  // Check and run migrations
  await runMigrations();

  // Seed default data if first run
  await seedDefaultData();

  return db;
};

// Get database instance (throws if not initialized)
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};

// Run any pending migrations
const runMigrations = async (): Promise<void> => {
  const database = getDatabase();

  // Get current schema version
  const result = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = 'schema_version'"
  );

  const currentVersion = result ? parseInt(result.value, 10) : 0;

  if (currentVersion < SCHEMA_VERSION) {
    // Run migrations here in the future
    // For now, just update the version

    await database.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', ?, datetime('now'))`,
      [SCHEMA_VERSION.toString()]
    );
  }
};

// Seed default data for new users
const seedDefaultData = async (): Promise<void> => {
  const database = getDatabase();

  // Check if already seeded
  const seeded = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = 'data_seeded'"
  );

  if (seeded?.value === 'true') return;

  // Create default user profile (local-only)
  const userId = generateUUID();
  const householdId = generateUUID();

  await database.runAsync(
    `INSERT INTO user_profile (id, name, household_id, household_name, base_currency, plan_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, 'My Profile', householdId, 'My Household', 'USD', 'free']
  );

  // Create default categories
  for (const category of DEFAULT_CATEGORIES) {
    const categoryId = generateUUID();
    await database.runAsync(
      `INSERT INTO categories (id, name, type, icon, color, sync_status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [categoryId, category.name, category.type, category.icon, category.color]
    );
  }

  // Create default account
  const accountId = generateUUID();
  await database.runAsync(
    `INSERT INTO accounts (id, name, type, currency, initial_balance, sync_status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [accountId, DEFAULT_ACCOUNT.name, DEFAULT_ACCOUNT.type, DEFAULT_ACCOUNT.currency, DEFAULT_ACCOUNT.initial_balance]
  );

  // Mark as seeded
  await database.runAsync(
    `INSERT INTO app_settings (key, value) VALUES ('data_seeded', 'true')`
  );
};

// Reset database (for development/testing)
export const resetDatabase = async (): Promise<void> => {
  const database = getDatabase();

  // Drop all tables
  await database.execAsync(`
    DROP TABLE IF EXISTS sync_conflicts;
    DROP TABLE IF EXISTS sync_log;
    DROP TABLE IF EXISTS transaction_allocations;
    DROP TABLE IF EXISTS allocations;
    DROP TABLE IF EXISTS transaction_lines;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS user_profile;
    DROP TABLE IF EXISTS app_settings;
  `);

  // Recreate tables
  await database.execAsync(CREATE_TABLES_SQL);

  // Re-seed default data
  await seedDefaultData();
};

// Export types for use in repositories
export type Database = SQLite.SQLiteDatabase;
