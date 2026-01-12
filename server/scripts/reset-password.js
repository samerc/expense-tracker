/**
 * Reset password for a user
 * Usage: node scripts/reset-password.js <email> <new-password>
 */

const db = require('../src/config/database');
const { hashPassword } = require('../src/utils/auth');

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('Usage: node scripts/reset-password.js <email> <new-password>');
    console.log('Example: node scripts/reset-password.js samer@example.com password123');
    process.exit(1);
  }

  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`Found user: ${user.name} (${user.email})`);

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, modified_at = NOW() WHERE id = $2',
      [passwordHash, user.id]
    );

    console.log('Password updated successfully!');
    console.log(`You can now log in with: ${email} / ${newPassword}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.pool.end();
  }
}

resetPassword();
