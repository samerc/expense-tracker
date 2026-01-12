import { useQuery } from '@tanstack/react-query';
import { CreditCard, Check, X, Crown, Lock } from 'lucide-react';
import { LoadingSpinner } from '../../components/common';
import { subscriptionAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * PlansPage Component
 *
 * Display available subscription plans for users
 * Features:
 * - View all available plans
 * - See current plan highlighted
 * - Admin users can upgrade
 * - Non-admin users see message to contact admin
 */
export default function PlansPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  /**
   * Fetch available plans
   */
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await subscriptionAPI.getPlans();
      return response.data;
    },
  });

  /**
   * Fetch current subscription
   */
  const { data: currentSubscription, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await subscriptionAPI.getCurrent();
      return response.data;
    },
  });

  if (isLoadingPlans || isLoadingCurrent) {
    return <LoadingSpinner message="Loading plans..." />;
  }

  const plans = plansData?.plans || [];
  const currentPlanId = currentSubscription?.plan_id;

  /**
   * Format feature key for display
   */
  const formatFeatureKey = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  /**
   * Parse feature value
   */
  const parseFeatureValue = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  /**
   * Check if feature is enabled
   */
  const isFeatureEnabled = (value) => {
    const parsed = parseFeatureValue(value);
    return parsed === true || parsed === 'true';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <CreditCard className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the plan that best fits your needs
          </p>
        </div>
      </div>

      {/* Current Plan Info */}
      {currentSubscription && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Current Plan</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {currentSubscription.plan_display_name}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Status: <span className="capitalize">{currentSubscription.status}</span>
                {currentSubscription.status === 'trialing' && currentSubscription.trial_ends_at && (
                  <span className="ml-2">
                    (Trial ends {new Date(currentSubscription.trial_ends_at).toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>
            <Crown className="w-12 h-12 text-blue-400" />
          </div>
        </div>
      )}

      {/* Admin Notice */}
      {!isAdmin && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Admin Required
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Only household admins can change the subscription plan.
                Please contact your household administrator to upgrade.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const features = plan.features || {};

          return (
            <div
              key={plan.id}
              className={`card relative ${
                isCurrentPlan
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : ''
              }`}
            >
              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center pt-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {plan.display_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    ${parseFloat(plan.price_monthly).toFixed(0)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
              </div>

              {/* Features List */}
              <div className="py-6 space-y-3">
                {Object.entries(features).map(([key, value]) => {
                  const enabled = isFeatureEnabled(value);
                  return (
                    <div key={key} className="flex items-center space-x-3">
                      {enabled ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          enabled
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {formatFeatureKey(key)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full btn btn-secondary opacity-50 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : isAdmin ? (
                  <button
                    className="w-full btn btn-primary"
                    onClick={() => {
                      // TODO: Implement upgrade flow
                      alert('Upgrade flow coming soon! Contact support to change plans.');
                    }}
                  >
                    {parseFloat(plan.price_monthly) === 0 ? 'Downgrade' : 'Upgrade'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full btn btn-secondary opacity-50 cursor-not-allowed"
                    title="Contact your household admin to upgrade"
                  >
                    Contact Admin
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Support */}
      <div className="card text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Need a custom plan or have questions?{' '}
          <a
            href="mailto:support@example.com"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
