/**
 * Subscription Plans Configuration
 * Defines features and limits for each plan
 */

const PLANS = {
  free: {
    name: 'Free',
    maxUsers: 1,
    maxAccounts: 5,
    maxBudgets: 3,
    features: {
      web_access: false,
      cloud_sync: false,
      advanced_reports: false,
      allocations: false,
      multi_currency: false,
      api_access: false,
    }
  },
  pro: {
    name: 'Pro',
    maxUsers: 5,
    maxAccounts: 20,
    maxBudgets: 10,
    features: {
      web_access: true,
      cloud_sync: true,
      advanced_reports: true,
      allocations: true,
      multi_currency: true,
      api_access: false,
    }
  },
  family: {
    name: 'Family',
    maxUsers: -1, // Unlimited
    maxAccounts: -1, // Unlimited
    maxBudgets: -1, // Unlimited
    features: {
      web_access: true,
      cloud_sync: true,
      advanced_reports: true,
      allocations: true,
      multi_currency: true,
      api_access: true,
    }
  }
};

/**
 * Get plan configuration
 */
function getPlan(planName) {
  return PLANS[planName] || PLANS.free;
}

/**
 * Check if feature is enabled for plan
 */
function hasFeature(planName, featureName) {
  const plan = getPlan(planName);
  return plan.features[featureName] || false;
}

/**
 * Get user limit for plan
 */
function getUserLimit(planName) {
  const plan = getPlan(planName);
  return plan.maxUsers;
}

module.exports = {
  PLANS,
  getPlan,
  hasFeature,
  getUserLimit
};
