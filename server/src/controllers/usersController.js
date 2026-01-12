const db = require('../config/database');
const bcrypt = require('bcrypt');

// Get user profile
async function getProfile(req, res) {
  try {
    const { userId } = req.user;

    const result = await db.query(
      `SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.created_at,
        h.id as household_id,
        h.name as household_name
       FROM users u
       JOIN households h ON u.household_id = h.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      household: {
        id: user.household_id,
        name: user.household_name
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

// Update user profile
async function updateProfile(req, res) {
  try {
    const { userId } = req.user;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const emailCheck = await db.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const result = await db.query(
      `UPDATE users 
       SET name = $1, email = $2, modified_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role`,
      [name, email, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

// Get user preferences
async function getPreferences(req, res) {
  try {
    const { userId } = req.user;

    const result = await db.query(
      `SELECT preferences FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0].preferences || {});
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
}

// Update user preferences
async function updatePreferences(req, res) {
  try {
    const { userId } = req.user;
    const preferences = req.body;

    const result = await db.query(
      `UPDATE users 
       SET preferences = $1, modified_at = NOW()
       WHERE id = $2
       RETURNING preferences`,
      [JSON.stringify(preferences), userId]
    );

    res.json(result.rows[0].preferences);
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}

// Change password
async function changePassword(req, res) {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get current password hash
    const userResult = await db.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      `UPDATE users 
       SET password_hash = $1, modified_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
  changePassword
};
