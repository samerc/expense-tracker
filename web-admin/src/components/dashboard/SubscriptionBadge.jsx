import { Crown, AlertCircle } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

export default function SubscriptionBadge({ subscription, usage }) {
  if (!subscription) return null;

  const isUnlimited = usage?.isUnlimited;
  const percentUsed = usage?.limit ? (usage.currentUsage / usage.limit) * 100 : 0;
  const isNearLimit = percentUsed > 80;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{subscription.plan_display_name}</h3>
        </div>
        {subscription.status === 'trialing' && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
            Trial
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Transaction usage */}
        {!isUnlimited && usage && (
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Transactions this month</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatNumber(usage.currentUsage)} / {formatNumber(usage.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isNearLimit ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            {isNearLimit && (
              <div className="flex items-center space-x-1 mt-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Approaching limit - consider upgrading</span>
              </div>
            )}
          </div>
        )}

        {isUnlimited && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            ✓ Unlimited transactions
          </p>
        )}

        {/* Trial expiry */}
        {subscription.trial_ends_at && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
