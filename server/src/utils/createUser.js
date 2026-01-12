const db = require('../config/database');
const { hashPassword } = require('./auth');

async function createUser() {
  try {
    const email = 'samer@example.com';
    const password = 'password123';
    const name = 'Samer';
    const householdId = '10000000-0000-0000-0000-000000000001';
    const userId = '20000000-0000-0000-0000-000000000001';

    // Hash the password
    const passwordHash = await hashPassword(password);
    console.log('Password hash generated:', passwordHash);

    // Delete existing user if exists
    await db.query('DELETE FROM users WHERE email = $1', [email]);

    // Insert user with proper hash
    await db.query(
      `INSERT INTO users (id, household_id, email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, householdId, email, passwordHash, name, 'admin']
    );

    console.log('✓ User created successfully');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: admin`);

    process.exit(0);
  } catch (err) {
    console.error('✗ Error creating user:', err);
    process.exit(1);
  }
}

createUser();
