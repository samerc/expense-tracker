import { X, Users, CreditCard, Tag, Target, Receipt, Calendar, DollarSign, Shield } from 'lucide-react';

/**
 * HouseholdDetailsModal Component
 * 
 * Shows detailed information about a household
 * Including users, stats, and subscription info
 */
export default function HouseholdDetailsModal({ isOpen, onClose, household, details }) {
  if (!isOpen || !household) return null;

  const users = details?.users || [];
  const stats = details?.stats || {};
  const householdInfo = details?.household || household;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {household.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Household Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Basic Info */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Household ID</p>
                <p className="text-sm font-mono text-gray-900">{household.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Base Currency</p>
                <p className="text-sm font-semibold text-gray-900">{household.base_currency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(household.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Status</p>
                {household.plan_status === 'active' ? (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Suspended
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Subscription</span>
            </h4>
            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-xs text-blue-600">Current Plan</p>
                <p className="text-sm font-semibold text-blue-900">
                  {householdInfo.plan_display_name || 'No Plan'}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Billing Cycle</p>
                <p className="text-sm font-semibold text-blue-900 capitalize">
                  {household.billing_cycle || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Price</p>
                <p className="text-sm font-semibold text-blue-900">
                  ${parseFloat(householdInfo.price_monthly || 0).toFixed(2)}/mo
                </p>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Usage Statistics</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <p className="text-xs text-gray-600">Accounts</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.account_count || 0}</p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-gray-600">Categories</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.category_count || 0}</p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-gray-600">Budgets</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.budget_count || 0}</p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Receipt className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-gray-600">Transactions</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.transaction_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users ({users.length})</span>
            </h4>
            
            {users.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Last Login</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1">
                            {user.role === 'admin' && <Shield className="w-3 h-3 text-purple-600" />}
                            <span className={`text-xs font-medium ${
                              user.role === 'admin' ? 'text-purple-600' : 'text-gray-600'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {user.last_login 
                            ? new Date(user.last_login).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-4 py-3">
                          {user.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
