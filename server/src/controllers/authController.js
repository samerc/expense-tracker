const crypto = require('crypto');
const db = require('../config/database');
const { comparePassword, generateToken, hashPassword } = require('../utils/auth');
const { getUserFeatures } = require('../middleware/featureAccess');
// TEMPORARY: Disabled email until SendGrid is configured
// const { sendPasswordResetEmail } = require('../utils/email');

// Login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await db.query(
      `SELECT u.*, h.name as household_name, h.base_currency 
       FROM users u
       JOIN households h ON u.household_id = h.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user info (without password hash)
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        household: {
          id: user.household_id,
          name: user.household_name,
          baseCurrency: user.base_currency
        }
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Get current user info
async function getCurrentUser(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.role, u.avatar_url,
              h.id as household_id, h.name as household_name, h.base_currency
       FROM users u
       JOIN households h ON u.household_id = h.id
       WHERE u.id = $1 AND u.is_active = true`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get user's plan features
    const features = await getUserFeatures(req.user.userId, user.household_id);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatar_url,
      household: {
        id: user.household_id,
        name: user.household_name,
        baseCurrency: user.base_currency
      },
      features
    });

  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
}

// Public registration - no auth required
async function register(req, res) {
  const client = await db.pool.connect();
  
  try {
    const { 
      householdName, 
      baseCurrency = 'USD',
      adminName, 
      email, 
      password 
    } = req.body;

    // Validation
    if (!householdName || !adminName || !email || !password) {
      return res.status(400).json({ 
        error: 'Household name, admin name, email, and password are required' 
      });
    }

    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    await client.query('BEGIN');

    // Create household
    const householdResult = await client.query(
      `INSERT INTO households (name, base_currency)
       VALUES ($1, $2)
       RETURNING id, name, base_currency`,
      [householdName, baseCurrency]
    );

    const household = householdResult.rows[0];

    // Hash password
    const { hashPassword } = require('../utils/auth');
    const passwordHash = await hashPassword(password);

    // Create admin user
    const userResult = await client.query(
      `INSERT INTO users (household_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, email, name, role`,
      [household.id, email, passwordHash, adminName]
    );

    const user = userResult.rows[0];

    // Get free plan
    const planResult = await client.query(
      `SELECT id FROM subscription_plans WHERE name = 'free' AND is_active = true`
    );

    if (planResult.rows.length === 0) {
      throw new Error('Free plan not found');
    }

    const freePlanId = planResult.rows[0].id;

    // Create free subscription with 14-day trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await client.query(
      `INSERT INTO subscriptions 
       (household_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
       VALUES ($1, $2, 'trialing', $3, NOW(), $3)`,
      [household.id, freePlanId, trialEnd]
    );

    // Copy system categories to household
    await client.query(
      `INSERT INTO categories (household_id, name, type, icon, color)
       SELECT $1, name, type, icon, color
       FROM categories
       WHERE household_id IS NULL AND type != 'system'`,
      [household.id]
    );

    // Create household encryption record
    await client.query(
      `INSERT INTO household_encryption (household_id, encryption_enabled)
       VALUES ($1, true)`,
      [household.id]
    );

    await client.query('COMMIT');

    // Generate token
    const { generateToken } = require('../utils/auth');
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      householdId: household.id
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        household: {
          id: household.id,
          name: household.name,
          baseCurrency: household.base_currency
        }
      },
      subscription: {
        plan: 'free',
        status: 'trialing',
        trialEndsAt: trialEnd
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
}

// Forgot password - TEMPORARY: generates and displays new password directly
// TODO: Re-enable email sending once SendGrid is configured
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const result = await db.query(
      'SELECT id, name, email FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    // Return error if user not found (temporary - normally we'd hide this)
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No account found with this email address.'
      });
    }

    const user = result.rows[0];

    // TEMPORARY: Generate a random temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 character password

    // Hash and save the new password
    const passwordHash = await hashPassword(tempPassword);

    await db.query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires_at = NULL,
           modified_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    // TEMPORARY: Return the password directly (remove this when email works)
    res.json({
      message: 'Your password has been reset.',
      temporaryPassword: tempPassword,
      note: 'Please change this password after logging in.'
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
}

// Reset password - set new password with token
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const result = await db.query(
      `SELECT id, email FROM users
       WHERE password_reset_token = $1
       AND password_reset_expires_at > NOW()
       AND is_active = true`,
      [hashedToken]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await db.query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires_at = NULL,
           modified_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

module.exports = {
  login,
  getCurrentUser,
  register,
  forgotPassword,
  resetPassword
};


