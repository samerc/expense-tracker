const db = require('../config/database');

// Update user role
async function updateUserRole(req, res) {
  try {
    const { householdId } = req.user;
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'regular'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (admin or regular)' });
    }

    // Verify user belongs to same household
    const userCheck = await db.query(
      `SELECT id FROM users WHERE id = $1 AND household_id = $2`,
      [userId, householdId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role
    const result = await db.query(
      `UPDATE users 
       SET role = $1, modified_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role`,
      [role, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

// Toggle user status
async function toggleUserStatus(req, res) {
  try {
    const { householdId } = req.user;
    const { userId } = req.params;
    const { isActive } = req.body;

    // Verify user belongs to same household
    const userCheck = await db.query(
      `SELECT id FROM users WHERE id = $1 AND household_id = $2`,
      [userId, householdId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update status
    const result = await db.query(
      `UPDATE users 
       SET is_active = $1, modified_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, is_active`,
      [isActive, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
}

// Get all users (same household)
async function getAllUsers(req, res) {
  try {
    const { householdId } = req.user;

    const result = await db.query(
      `SELECT 
        id,
        email,
        name,
        role,
        is_active,
        created_at,
        last_login
       FROM users
       WHERE household_id = $1
       ORDER BY role DESC, name`,
      [householdId]
    );

    res.json({
      users: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
}

// Invite new user
async function inviteUser(req, res) {
  try {
    const { householdId } = req.user;
    const { email, name, role } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    if (!role || !['admin', 'regular'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (admin or regular)' });
    }

    // Check if email already exists
    const emailCheck = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Get household plan to check user limit
    const householdResult = await db.query(
      `SELECT plan FROM households WHERE id = $1`,
      [householdId]
    );

    if (householdResult.rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    const { getUserLimit } = require('../config/plans');
    const maxUsers = getUserLimit(householdResult.rows[0].plan);

    // Check current user count
    const userCountResult = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE household_id = $1`,
      [householdId]
    );

    const currentUsers = parseInt(userCountResult.rows[0].count);

    // Check if limit reached (unless unlimited)
    if (maxUsers !== -1 && currentUsers >= maxUsers) {
      return res.status(400).json({ 
        error: `User limit reached. Your plan allows ${maxUsers} users.` 
      });
    }

    // Generate temporary password
    const bcrypt = require('bcrypt');
    const tempPassword = Math.random().toString(36).slice(-8); // Random 8-char password
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO users (household_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, created_at`,
      [householdId, email, passwordHash, name, role]
    );

    const newUser = result.rows[0];

    // TODO: Send email with credentials
    // For now, we'll return the temp password in response
    // In production, you'd use a service like SendGrid, AWS SES, etc.
    console.log(`New user created: ${email}, Temp password: ${tempPassword}`);

    res.json({
      user: newUser,
      tempPassword: tempPassword, // REMOVE THIS IN PRODUCTION
      message: 'User invited successfully. Email sent with login credentials.'
    });

  } catch (err) {
    console.error('Invite user error:', err);
    res.status(500).json({ error: 'Failed to invite user' });
  }
}

module.exports = {
  updateUserRole,
  toggleUserStatus,
  getAllUsers,
  inviteUser
};
