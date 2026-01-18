// SQLite Schema for Expense Tracker Mobile
// Mirrors server schema with sync tracking additions

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
-- ============================================
-- SETTINGS (local app settings and user state)
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- USER & HOUSEHOLD (local user profile)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    email TEXT,
    name TEXT NOT NULL,
    household_id TEXT,
    household_name TEXT,
    base_currency TEXT DEFAULT 'USD',
    is_synced INTEGER DEFAULT 0,
    plan_type TEXT DEFAULT 'free',
    created_at TEXT DEFAULT (datetime('now')),
    modified_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit', 'wallet')),
    currency TEXT NOT NULL DEFAULT 'USD',
    initial_balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'deleted')),
    created_at TEXT DEFAULT (datetime('now')),
    modified_at TEXT DEFAULT (datetime('now')),
    server_modified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_accounts_sync_status ON accounts(sync_status);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'system')),
    icon TEXT,
    color TEXT,
    is_active INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'deleted')),
    created_at TEXT DEFAULT (datetime('now')),
    modified_at TEXT DEFAULT (datetime('now')),
    server_modified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_sync_status ON categories(sync_status);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('standard', 'transfer', 'mixed')),
    is_deleted INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'deleted')),
    created_at TEXT DEFAULT (datetime('now')),
    modified_at TEXT DEFAULT (datetime('now')),
    server_modified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_sync_status ON transactions(sync_status);
CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted ON transactions(is_deleted) WHERE is_deleted = 0;

-- ============================================
-- TRANSACTION LINES
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_lines (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES accounts(id),
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    exchange_rate REAL DEFAULT 1,
    base_amount REAL NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('income', 'expense', 'transfer')),
    category_id TEXT REFERENCES categories(id),
    notes TEXT,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'deleted')),
    created_at TEXT DEFAULT (datetime('now')),
    modified_at TEXT DEFAULT (datetime('now')),
    server_modified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_transaction_lines_transaction ON transaction_lines(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_lines_account ON transaction_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_transaction_lines_category ON transaction_lines(category_id);

-- ============================================
-- ALLOCATIONS (Envelope Budgeting)
-- ============================================
CREATE TABLE IF NOT EXISTS allocations (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    allocated_amount REAL DEFAULT 0,
    available_amount REAL DEFAULT 0,
    spent_amount REAL DEFAULT 0,
    notes TEXT,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'deleted')),
    created_at TEXT DEFAULT (datetime('now')),
    modified_at TEXT DEFAULT (datetime('now')),
    server_modified_at TEXT,
    UNIQUE(category_id, month)
);

CREATE INDEX IF NOT EXISTS idx_allocations_month ON allocations(month);
CREATE INDEX IF NOT EXISTS idx_allocations_category ON allocations(category_id);

-- ============================================
-- TRANSACTION ALLOCATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_allocations (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    transaction_line_id TEXT NOT NULL REFERENCES transaction_lines(id) ON DELETE CASCADE,
    allocation_id TEXT NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'deleted')),
    created_at TEXT DEFAULT (datetime('now')),
    modified_at TEXT DEFAULT (datetime('now')),
    server_modified_at TEXT,
    UNIQUE(transaction_line_id, allocation_id)
);

CREATE INDEX IF NOT EXISTS idx_ta_line ON transaction_allocations(transaction_line_id);
CREATE INDEX IF NOT EXISTS idx_ta_allocation ON transaction_allocations(allocation_id);

-- ============================================
-- SYNC LOG (track sync history)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_log (
    id TEXT PRIMARY KEY,
    sync_direction TEXT NOT NULL CHECK (sync_direction IN ('upload', 'download', 'full')),
    sync_timestamp TEXT DEFAULT (datetime('now')),
    records_uploaded INTEGER DEFAULT 0,
    records_downloaded INTEGER DEFAULT 0,
    conflicts_detected INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('success', 'partial', 'failed')),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(sync_timestamp);

-- ============================================
-- PENDING CONFLICTS (for user resolution)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    local_data TEXT NOT NULL,
    server_data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    resolved INTEGER DEFAULT 0,
    resolution TEXT CHECK (resolution IN ('keep_local', 'keep_server', 'merged'))
);

CREATE INDEX IF NOT EXISTS idx_conflicts_unresolved ON sync_conflicts(resolved) WHERE resolved = 0;
`;

// Default categories to seed for new users
export const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#F59E0B' },
  { name: 'Transportation', type: 'expense', icon: 'car', color: '#3B82F6' },
  { name: 'Shopping', type: 'expense', icon: 'shopping-cart', color: '#EC4899' },
  { name: 'Housing', type: 'expense', icon: 'home', color: '#8B5CF6' },
  { name: 'Utilities', type: 'expense', icon: 'bolt', color: '#F97316' },
  { name: 'Entertainment', type: 'expense', icon: 'gamepad', color: '#10B981' },
  { name: 'Healthcare', type: 'expense', icon: 'heart', color: '#EF4444' },
  { name: 'Personal', type: 'expense', icon: 'gift', color: '#6366F1' },
  // Income categories
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10B981' },
  { name: 'Freelance', type: 'income', icon: 'wallet', color: '#3B82F6' },
  { name: 'Investments', type: 'income', icon: 'chart-line', color: '#8B5CF6' },
  { name: 'Other Income', type: 'income', icon: 'piggy-bank', color: '#F59E0B' },
];

// Default account for new users
export const DEFAULT_ACCOUNT = {
  name: 'Cash',
  type: 'cash',
  currency: 'USD',
  initial_balance: 0,
};
