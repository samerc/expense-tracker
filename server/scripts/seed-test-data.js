const db = require('../src/config/database');
const { hashPassword } = require('../src/utils/auth');

const TEST_PASSWORD = 'password123';

async function seedTestData() {
  const client = await db.pool.connect();

  try {
    console.log('Starting test data seed...\n');

    // Generate password hash
    const passwordHash = await hashPassword(TEST_PASSWORD);
    console.log('Generated password hash for "password123"');

    await client.query('BEGIN');

    // ============================================
    // SUPER ADMIN
    // ============================================
    console.log('\n--- Creating Super Admin ---');

    // Create system household for super admin
    await client.query(`
      INSERT INTO households (id, name, base_currency)
      VALUES ('00000000-0000-0000-0000-000000000001', 'System Admin Household', 'USD')
      ON CONFLICT (id) DO NOTHING
    `);

    // Create super admin user
    await client.query(`
      INSERT INTO users (id, household_id, email, password_hash, name, role, is_active)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'superadmin@expensetracker.com',
        $1,
        'Super Admin',
        'super_admin',
        TRUE
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = $1,
        role = 'super_admin'
    `, [passwordHash]);
    console.log('✓ Super Admin: superadmin@expensetracker.com');

    // ============================================
    // HOUSEHOLD 1: Smith Family
    // ============================================
    console.log('\n--- Creating Smith Family ---');

    await client.query(`
      INSERT INTO households (id, name, base_currency)
      VALUES ('11111111-1111-1111-1111-111111111111', 'Smith Family', 'USD')
      ON CONFLICT (id) DO NOTHING
    `);

    // Admin: John Smith
    await client.query(`
      INSERT INTO users (id, household_id, email, password_hash, name, role, is_active)
      VALUES (
        '11111111-1111-1111-1111-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'john.smith@example.com',
        $1,
        'John Smith',
        'admin',
        TRUE
      )
      ON CONFLICT (email) DO UPDATE SET password_hash = $1
    `, [passwordHash]);
    console.log('✓ Admin: john.smith@example.com');

    // Regular user: Jane Smith
    await client.query(`
      INSERT INTO users (id, household_id, email, password_hash, name, role, is_active)
      VALUES (
        '11111111-1111-1111-1111-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'jane.smith@example.com',
        $1,
        'Jane Smith',
        'regular',
        TRUE
      )
      ON CONFLICT (email) DO UPDATE SET password_hash = $1
    `, [passwordHash]);
    console.log('✓ Regular: jane.smith@example.com');

    // Categories for Smith Family
    await client.query(`
      INSERT INTO categories (id, household_id, name, type, icon, color) VALUES
        ('11111111-2222-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Groceries', 'expense', 'ShoppingCart', '#10B981'),
        ('11111111-2222-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Dining Out', 'expense', 'UtensilsCrossed', '#F59E0B'),
        ('11111111-2222-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Transportation', 'expense', 'Car', '#3B82F6'),
        ('11111111-2222-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Entertainment', 'expense', 'Film', '#8B5CF6'),
        ('11111111-2222-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Utilities', 'expense', 'Lightbulb', '#EF4444'),
        ('11111111-2222-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Healthcare', 'expense', 'Heart', '#EC4899'),
        ('11111111-2222-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Shopping', 'expense', 'ShoppingBag', '#14B8A6'),
        ('11111111-2222-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Housing', 'expense', 'Home', '#06B6D4'),
        ('11111111-2222-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Salary', 'income', 'DollarSign', '#22C55E'),
        ('11111111-2222-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Freelance', 'income', 'Briefcase', '#3B82F6'),
        ('11111111-2222-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Investment', 'income', 'TrendingUp', '#8B5CF6')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✓ Categories created');

    // Accounts for Smith Family
    await client.query(`
      INSERT INTO accounts (id, household_id, name, type, currency, initial_balance, is_active) VALUES
        ('11111111-4444-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chase Checking', 'bank', 'USD', 5500.00, TRUE),
        ('11111111-4444-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Chase Savings', 'bank', 'USD', 15000.00, TRUE),
        ('11111111-4444-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Visa Credit Card', 'credit', 'USD', 0.00, TRUE),
        ('11111111-4444-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Cash', 'cash', 'USD', 300.00, TRUE)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✓ Accounts created');

    // Transactions for Smith Family
    // Transaction 1: January Salary
    await client.query(`
      INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted)
      VALUES ('11111111-5555-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-01-01', 'January Salary - John', 'standard', '11111111-1111-1111-1111-000000000001', FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id)
      VALUES ('11111111-6666-0000-0000-000000000001', '11111111-5555-0000-0000-000000000001', '11111111-4444-0000-0000-000000000001', 4500.00, 'USD', 1.0, 4500.00, 'income', '11111111-2222-0000-0000-000000000010')
      ON CONFLICT (id) DO NOTHING
    `);

    // Transaction 2: Grocery shopping
    await client.query(`
      INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted)
      VALUES ('11111111-5555-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '2026-01-03', 'Costco weekly groceries', 'standard', '11111111-1111-1111-1111-000000000002', FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id)
      VALUES ('11111111-6666-0000-0000-000000000002', '11111111-5555-0000-0000-000000000002', '11111111-4444-0000-0000-000000000003', -187.45, 'USD', 1.0, -187.45, 'expense', '11111111-2222-0000-0000-000000000001')
      ON CONFLICT (id) DO NOTHING
    `);

    // Transaction 3: Electric bill
    await client.query(`
      INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted)
      VALUES ('11111111-5555-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '2026-01-05', 'Electric bill - January', 'standard', '11111111-1111-1111-1111-000000000001', FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id)
      VALUES ('11111111-6666-0000-0000-000000000003', '11111111-5555-0000-0000-000000000003', '11111111-4444-0000-0000-000000000001', -145.80, 'USD', 1.0, -145.80, 'expense', '11111111-2222-0000-0000-000000000005')
      ON CONFLICT (id) DO NOTHING
    `);

    // Transaction 4: Dinner
    await client.query(`
      INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted)
      VALUES ('11111111-5555-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '2026-01-06', 'Dinner at Olive Garden', 'standard', '11111111-1111-1111-1111-000000000002', FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id)
      VALUES ('11111111-6666-0000-0000-000000000004', '11111111-5555-0000-0000-000000000004', '11111111-4444-0000-0000-000000000003', -78.50, 'USD', 1.0, -78.50, 'expense', '11111111-2222-0000-0000-000000000002')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✓ Transactions created');

    // ============================================
    // HOUSEHOLD 2: Garcia Family
    // ============================================
    console.log('\n--- Creating Garcia Family ---');

    await client.query(`
      INSERT INTO households (id, name, base_currency)
      VALUES ('22222222-2222-2222-2222-222222222222', 'Garcia Family', 'USD')
      ON CONFLICT (id) DO NOTHING
    `);

    // Admin: Maria Garcia
    await client.query(`
      INSERT INTO users (id, household_id, email, password_hash, name, role, is_active)
      VALUES (
        '22222222-2222-2222-2222-000000000001',
        '22222222-2222-2222-2222-222222222222',
        'maria.garcia@example.com',
        $1,
        'Maria Garcia',
        'admin',
        TRUE
      )
      ON CONFLICT (email) DO UPDATE SET password_hash = $1
    `, [passwordHash]);
    console.log('✓ Admin: maria.garcia@example.com');

    // Regular user: Carlos Garcia
    await client.query(`
      INSERT INTO users (id, household_id, email, password_hash, name, role, is_active)
      VALUES (
        '22222222-2222-2222-2222-000000000002',
        '22222222-2222-2222-2222-222222222222',
        'carlos.garcia@example.com',
        $1,
        'Carlos Garcia',
        'regular',
        TRUE
      )
      ON CONFLICT (email) DO UPDATE SET password_hash = $1
    `, [passwordHash]);
    console.log('✓ Regular: carlos.garcia@example.com');

    // Categories for Garcia Family
    await client.query(`
      INSERT INTO categories (id, household_id, name, type, icon, color) VALUES
        ('22222222-3333-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Groceries', 'expense', 'ShoppingCart', '#10B981'),
        ('22222222-3333-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Restaurants', 'expense', 'UtensilsCrossed', '#F59E0B'),
        ('22222222-3333-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Gas & Auto', 'expense', 'Car', '#3B82F6'),
        ('22222222-3333-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Entertainment', 'expense', 'Film', '#8B5CF6'),
        ('22222222-3333-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Bills', 'expense', 'FileText', '#EF4444'),
        ('22222222-3333-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Kids', 'expense', 'Baby', '#EC4899'),
        ('22222222-3333-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'Clothing', 'expense', 'Shirt', '#14B8A6'),
        ('22222222-3333-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'Home Improvement', 'expense', 'Wrench', '#06B6D4'),
        ('22222222-3333-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'Salary', 'income', 'DollarSign', '#22C55E'),
        ('22222222-3333-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', 'Side Business', 'income', 'Store', '#3B82F6'),
        ('22222222-3333-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 'Rental Income', 'income', 'Building', '#8B5CF6')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✓ Categories created');

    // Accounts for Garcia Family
    await client.query(`
      INSERT INTO accounts (id, household_id, name, type, currency, initial_balance, is_active) VALUES
        ('22222222-4444-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Bank of America Checking', 'bank', 'USD', 3200.00, TRUE),
        ('22222222-4444-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Ally Savings', 'bank', 'USD', 8500.00, TRUE),
        ('22222222-4444-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Amex Gold', 'credit', 'USD', 0.00, TRUE),
        ('22222222-4444-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'PayPal', 'wallet', 'USD', 450.00, TRUE)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✓ Accounts created');

    // Transactions for Garcia Family
    // Transaction 1: January Salary
    await client.query(`
      INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted)
      VALUES ('22222222-5555-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '2026-01-01', 'January Salary - Maria', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id)
      VALUES ('22222222-6666-0000-0000-000000000001', '22222222-5555-0000-0000-000000000001', '22222222-4444-0000-0000-000000000001', 3800.00, 'USD', 1.0, 3800.00, 'income', '22222222-3333-0000-0000-000000000010')
      ON CONFLICT (id) DO NOTHING
    `);

    // Transaction 2: Grocery shopping
    await client.query(`
      INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted)
      VALUES ('22222222-5555-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2026-01-04', 'Walmart groceries', 'standard', '22222222-2222-2222-2222-000000000002', FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id)
      VALUES ('22222222-6666-0000-0000-000000000002', '22222222-5555-0000-0000-000000000002', '22222222-4444-0000-0000-000000000003', -156.78, 'USD', 1.0, -156.78, 'expense', '22222222-3333-0000-0000-000000000001')
      ON CONFLICT (id) DO NOTHING
    `);

    // Transaction 3: Gas
    await client.query(`
      INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted)
      VALUES ('22222222-5555-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '2026-01-05', 'Chevron gas fill-up', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id)
      VALUES ('22222222-6666-0000-0000-000000000003', '22222222-5555-0000-0000-000000000003', '22222222-4444-0000-0000-000000000001', -67.45, 'USD', 1.0, -67.45, 'expense', '22222222-3333-0000-0000-000000000003')
      ON CONFLICT (id) DO NOTHING
    `);

    // Transaction 4: Rental income
    await client.query(`
      INSERT INTO transactions (id, household_id, date, description, type, created_by, is_deleted)
      VALUES ('22222222-5555-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', '2026-01-01', 'Rental property income', 'standard', '22222222-2222-2222-2222-000000000001', FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`
      INSERT INTO transaction_lines (id, transaction_id, account_id, amount, currency, exchange_rate_to_base, base_currency_amount, direction, category_id)
      VALUES ('22222222-6666-0000-0000-000000000004', '22222222-5555-0000-0000-000000000004', '22222222-4444-0000-0000-000000000001', 1200.00, 'USD', 1.0, 1200.00, 'income', '22222222-3333-0000-0000-000000000012')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✓ Transactions created');

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('TEST DATA SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nAll users have password: password123\n');
    console.log('Super Admin:');
    console.log('  superadmin@expensetracker.com');
    console.log('\nSmith Family:');
    console.log('  john.smith@example.com (admin)');
    console.log('  jane.smith@example.com (regular)');
    console.log('\nGarcia Family:');
    console.log('  maria.garcia@example.com (admin)');
    console.log('  carlos.garcia@example.com (regular)');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error seeding test data:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedTestData();
