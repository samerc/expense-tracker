const db = require('../config/database');
const { hashPassword } = require('./auth');

async function updateUserPassword() {
  try {
    const email = 'samer@example.com';
    const password = 'password123';

    // Hash the password
    const passwordHash = await hashPassword(password);
    console.log('Password hash generated');

    // Update user password
    const result = await db.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, name, role`,
      [passwordHash, email]
    );

    if (result.rows.length === 0) {
      console.log('✗ User not found');
      process.exit(1);
    }

    console.log('✓ Password updated successfully');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  User:`, result.rows[0]);

    process.exit(0);
  } catch (err) {
    console.error('✗ Error updating password:', err);
    process.exit(1);
  }
}

updateUserPassword();
