const db = require('../config/database');

// Simple in-memory cache (5 minute TTL)
const featureCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all features for a user (plan features + user overrides)
 */
async function getUserFeatures(userId, householdId) {
  const cacheKey = `${userId}_${householdId}`;
  
  // Check cache
  const cached = featureCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.features;
  }

  try {
    // Get household's plan features
    const planResult = await db.query(`
      SELECT
        pf.feature_key,
        pf.feature_value
      FROM subscriptions s
      JOIN plan_features pf ON s.plan_id = pf.plan_id
      WHERE s.household_id = $1
    `, [householdId]);

    const features = {};
    planResult.rows.forEach(row => {
      try {
        features[row.feature_key] = JSON.parse(row.feature_value);
      } catch (e) {
        // If not valid JSON, store as-is
        features[row.feature_key] = row.feature_value;
      }
    });

    // Get user-specific overrides (optional table)
    try {
      const overrideResult = await db.query(`
        SELECT
          feature_key,
          feature_value
        FROM user_feature_overrides
        WHERE user_id = $1
          AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId]);

      // Overrides take precedence
      overrideResult.rows.forEach(row => {
        try {
          features[row.feature_key] = JSON.parse(row.feature_value);
        } catch (e) {
          features[row.feature_key] = row.feature_value;
        }
      });
    } catch (overrideErr) {
      // Table might not exist yet - that's ok
      if (overrideErr.code !== '42P01') {
        console.warn('User feature overrides query failed:', overrideErr.message);
      }
    }

    // Cache it
    featureCache.set(cacheKey, {
      features,
      timestamp: Date.now()
    });

    return features;

  } catch (err) {
    console.error('[getUserFeatures] ERROR:', err.message, '| Code:', err.code);
    // Return empty features on error (fail-safe)
    return {};
  }
}

/**
 * Clear cache for a user (call when plan changes)
 */
function clearUserCache(userId, householdId) {
  const cacheKey = `${userId}_${householdId}`;
  featureCache.delete(cacheKey);
}

/**
 * Middleware: Check if user has a specific feature
 */
function requireFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const { userId, householdId } = req.user;

      const features = await getUserFeatures(userId, householdId);

      if (!features[featureKey]) {
        return res.status(403).json({
          error: 'Feature not available in your plan',
          feature: featureKey,
          upgradeRequired: true
        });
      }

      // Check if feature is explicitly disabled
      const featureValue = features[featureKey];
      
      if (featureValue === false || 
          featureValue === 'false' || 
          featureValue === null || 
          featureValue === 'null') {
        return res.status(403).json({
          error: 'Feature not available in your plan',
          feature: featureKey,
          upgradeRequired: true
        });
      }

      // Attach feature value to request (useful for limits)
      req.featureValue = featureValue;
      req.userFeatures = features;
      
      next();

    } catch (err) {
      console.error('Feature check error:', err);
      res.status(500).json({ error: 'Failed to check feature access' });
    }
  };
}

/**
 * Middleware: Check transaction limit
 */
async function checkTransactionLimit(req, res, next) {
  try {
    const { userId, householdId } = req.user;
    const features = await getUserFeatures(userId, householdId);

    const limit = features.transaction_limit_monthly;

    // null, "null", or undefined = unlimited
    if (limit === null || 
        limit === 'null' || 
        limit === undefined ||
        limit === 'undefined') {
      return next();
    }

    // Check current month usage
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const result = await db.query(
      `SELECT COALESCE(transaction_count, 0) as count
       FROM usage_tracking
       WHERE household_id = $1 AND month = $2`,
      [householdId, currentMonth]
    );

    const currentCount = parseInt(result.rows[0]?.count || 0);
    const limitNum = parseInt(limit);

    if (currentCount >= limitNum) {
      return res.status(403).json({
        error: 'Monthly transaction limit reached',
        limit: limitNum,
        used: currentCount,
        upgradeRequired: true,
        upgradeTo: 'basic' // Suggest upgrade
      });
    }

    // Attach counts to request
    req.transactionUsage = {
      limit: limitNum,
      used: currentCount,
      remaining: limitNum - currentCount
    };

    next();

  } catch (err) {
    // If usage_tracking table doesn't exist, allow transaction (fail-open for dev)
    if (err.code === '42P01') {
      console.warn('Warning: usage_tracking table does not exist. Run migration 004_add_usage_tracking.sql');
      return next();
    }
    console.error('Transaction limit check error:', err);
    res.status(500).json({ error: 'Failed to check transaction limit' });
  }
}

module.exports = {
  getUserFeatures,
  clearUserCache,
  requireFeature,
  checkTransactionLimit
};
