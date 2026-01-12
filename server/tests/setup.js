const db = require('../src/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Test data storage
const testData = {
  household: null,
  users: {},
  accounts: [],
  categories: [],
  transactions: [],
  allocations: [],
};

// Generate JWT token for test user
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      householdId: user.household_id,
    },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '24h' }
  );
}

// Create test household
async function createTestHousehold(name = 'Test Household') {
  const result = await db.query(
    `INSERT INTO households (name, base_currency)
     VALUES ($1, 'USD')
     RETURNING *`,
    [name]
  );
  testData.household = result.rows[0];
  return testData.household;
}

// Create test user
async function createTestUser(options = {}) {
  const {
    email = `test-${Date.now()}@example.com`,
    password = 'TestPassword123!',
    name = 'Test User',
    role = 'regular',
    householdId = testData.household?.id,
  } = options;

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.query(
    `INSERT INTO users (household_id, email, password_hash, name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, household_id, email, name, role, created_at`,
    [householdId, email, passwordHash, name, role]
  );

  const user = result.rows[0];
  user.token = generateToken(user);
  user.plainPassword = password;

  testData.users[role] = user;
  return user;
}

// Create test account
async function createTestAccount(options = {}) {
  const {
    name = 'Test Account',
    type = 'bank',
    currency = 'USD',
    initialBalance = 1000,
    householdId = testData.household?.id,
  } = options;

  const result = await db.query(
    `INSERT INTO accounts (household_id, name, type, currency, initial_balance)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [householdId, name, type, currency, initialBalance]
  );

  const account = result.rows[0];
  testData.accounts.push(account);
  return account;
}

// Create test category
async function createTestCategory(options = {}) {
  const {
    name = 'Test Category',
    type = 'expense',
    icon = 'ShoppingCart',
    color = '#3B82F6',
    householdId = testData.household?.id,
  } = options;

  const result = await db.query(
    `INSERT INTO categories (household_id, name, type, icon, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [householdId, name, type, icon, color]
  );

  const category = result.rows[0];
  testData.categories.push(category);
  return category;
}

// Create test transaction with lines
async function createTestTransaction(options = {}) {
  const {
    title = 'Test Transaction',
    description = 'Test description',
    date = new Date().toISOString().split('T')[0],
    type = 'standard',
    lines = [],
    householdId = testData.household?.id,
    userId = testData.users.regular?.id,
  } = options;

  // Create transaction header
  const txResult = await db.query(
    `INSERT INTO transactions (household_id, date, title, description, type, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [householdId, date, title, description, type, userId]
  );

  const transaction = txResult.rows[0];

  // Create transaction lines
  for (const line of lines) {
    await db.query(
      `INSERT INTO transaction_lines
       (transaction_id, account_id, amount, currency, exchange_rate_to_base,
        exchange_rate_date, base_currency_amount, direction, category_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        transaction.id,
        line.accountId,
        Math.abs(line.amount),
        line.currency || 'USD',
        line.exchangeRate || 1,
        date,
        Math.abs(line.amount) * (line.exchangeRate || 1),
        line.direction || 'expense',
        line.categoryId,
        line.notes || null,
      ]
    );
  }

  testData.transactions.push(transaction);
  return transaction;
}

// Create test allocation
async function createTestAllocation(options = {}) {
  const {
    categoryId,
    month = new Date().toISOString().slice(0, 7) + '-01',
    allocatedAmount = 500,
    availableAmount = 500,
    spentAmount = 0,
    householdId = testData.household?.id,
  } = options;

  const result = await db.query(
    `INSERT INTO allocations (household_id, category_id, month, allocated_amount, available_amount, spent_amount)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [householdId, categoryId, month, allocatedAmount, availableAmount, spentAmount]
  );

  const allocation = result.rows[0];
  testData.allocations.push(allocation);
  return allocation;
}

// Clean up test data
async function cleanupTestData() {
  try {
    if (testData.household?.id) {
      // Delete in order respecting foreign keys
      // First delete transaction_allocations via transaction_lines
      await db.query(`
        DELETE FROM transaction_allocations
        WHERE transaction_line_id IN (
          SELECT tl.id FROM transaction_lines tl
          JOIN transactions t ON tl.transaction_id = t.id
          WHERE t.household_id = $1
        )`, [testData.household.id]);
      await db.query('DELETE FROM transaction_lines WHERE transaction_id IN (SELECT id FROM transactions WHERE household_id = $1)', [testData.household.id]);
      await db.query('DELETE FROM transactions WHERE household_id = $1', [testData.household.id]);
      await db.query('DELETE FROM allocations WHERE household_id = $1', [testData.household.id]);
      await db.query('DELETE FROM budgets WHERE household_id = $1', [testData.household.id]);
      await db.query('DELETE FROM accounts WHERE household_id = $1', [testData.household.id]);
      await db.query('DELETE FROM categories WHERE household_id = $1', [testData.household.id]);
      // invitations table might not exist
      try {
        await db.query('DELETE FROM invitations WHERE household_id = $1', [testData.household.id]);
      } catch (e) { /* ignore if table doesn't exist */ }
      await db.query('DELETE FROM users WHERE household_id = $1', [testData.household.id]);
      await db.query('DELETE FROM households WHERE id = $1', [testData.household.id]);
    }

    // Reset test data
    testData.household = null;
    testData.users = {};
    testData.accounts = [];
    testData.categories = [];
    testData.transactions = [];
    testData.allocations = [];
  } catch (err) {
    console.error('Error cleaning up test data:', err);
  }
}

// Initialize test environment
async function initializeTestEnv() {
  const household = await createTestHousehold();
  const regularUser = await createTestUser({ role: 'regular' });
  const adminUser = await createTestUser({
    email: `admin-${Date.now()}@example.com`,
    name: 'Admin User',
    role: 'admin',
  });
  const superAdminUser = await createTestUser({
    email: `super-${Date.now()}@example.com`,
    name: 'Super Admin',
    role: 'super_admin',
  });

  const account = await createTestAccount();
  const expenseCategory = await createTestCategory({
    name: 'Food',
    type: 'expense',
  });
  const incomeCategory = await createTestCategory({
    name: 'Salary',
    type: 'income',
  });

  return {
    household,
    users: { regular: regularUser, admin: adminUser, superAdmin: superAdminUser },
    account,
    categories: { expense: expenseCategory, income: incomeCategory },
  };
}

// Global setup and teardown
beforeAll(async () => {
  // Ensure we have a database connection
  try {
    await db.query('SELECT 1');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    throw err;
  }
});

afterAll(async () => {
  await db.pool.end();
});

module.exports = {
  testData,
  generateToken,
  createTestHousehold,
  createTestUser,
  createTestAccount,
  createTestCategory,
  createTestTransaction,
  createTestAllocation,
  cleanupTestData,
  initializeTestEnv,
  db,
};
