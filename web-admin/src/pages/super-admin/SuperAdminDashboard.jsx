import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Building2, CreditCard, Activity, MoreVertical, Edit2, Ban, CheckCircle } from 'lucide-react';
import { LoadingSpinner, useToast, ConfirmationModal } from '../../components/common';
import { superAdminAPI } from '../../services/api';

/**
 * SuperAdminDashboard Component
 * 
 * Main dashboard for super admins to manage all households
 * Features:
 * - View all households
 * - Assign/change plans
 * - Suspend/activate households
 * - View system statistics
 */
export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [householdToToggle, setHouseholdToToggle] = useState(null);

  /**
   * Fetch all households
   */
  const { data: householdsData, isLoading } = useQuery({
    queryKey: ['super-admin-households'],
    queryFn: async () => {
      const response = await superAdminAPI.getAllHouseholds();
      return response.data;
    },
  });

  /**
   * Fetch all plans
   */
  const { data: plansData } = useQuery({
    queryKey: ['super-admin-plans'],
    queryFn: async () => {
      const response = await superAdminAPI.getAllPlans();
      return response.data;
    },
  });

  /**
   * Update plan mutation
   */
  const updatePlanMutation = useMutation({
    mutationFn: ({ householdId, planId }) => 
      superAdminAPI.updateHouseholdPlan(householdId, { planId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-households']);
    },
  });

  /**
   * Toggle status mutation
   */
  const toggleStatusMutation = useMutation({
    mutationFn: ({ householdId, status }) => 
      superAdminAPI.toggleHouseholdStatus(householdId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-households']);
    },
  });

  /**
   * Handle change plan
   */
  const handleChangePlan = async (household) => {
    const planId = prompt(`Enter new plan ID for ${household.name}:`);
    if (!planId) return;

    try {
      await updatePlanMutation.mutateAsync({
        householdId: household.id,
        planId
      });
      toast.success('Plan updated successfully');
    } catch (error) {
      toast.error('Failed to update plan');
    }
  };

  /**
   * Handle toggle status - opens confirmation modal
   */
  const handleToggleStatus = (household) => {
    setHouseholdToToggle(household);
    setStatusConfirmOpen(true);
  };

  /**
   * Confirm toggle household status
   */
  const confirmToggleStatus = async () => {
    if (!householdToToggle) return;

    const newStatus = householdToToggle.plan_status === 'active' ? 'suspended' : 'active';

    try {
      await toggleStatusMutation.mutateAsync({
        householdId: householdToToggle.id,
        status: newStatus
      });
      toast.success(`Household ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch (error) {
      toast.error('Failed to update status');
      throw error;
    } finally {
      setHouseholdToToggle(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const households = householdsData?.households || [];
  const stats = householdsData?.stats || {};
  const plans = plansData?.plans || [];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Super Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all households, plans, and subscriptions
          </p>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Total Households */}
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
          <div className="flex items-center space-x-3 mb-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Households</p>
          </div>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {stats.total_households || 0}
          </p>
        </div>

        {/* Total Users */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.total_users || 0}
          </p>
        </div>

        {/* Active Users (30d) */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active (30d)</p>
          </div>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {stats.active_users_30d || 0}
          </p>
        </div>

        {/* Paid Households */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <CreditCard className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Plans</p>
          </div>
          <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
            {stats.paid_households || 0}
          </p>
        </div>
      </div>

      {/* Available Plans Reference */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plan.display_name}</h3>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  ${parseFloat(plan.price_monthly).toFixed(2)}/mo
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{plan.description}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Max users: {plan.max_users === -1 ? '∞' : plan.max_users}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">ID: {plan.id.slice(0, 8)}...</p>
            </div>
          ))}
        </div>
      </div>

      {/* Households Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Households</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Household
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {households.map((household) => (
                <tr key={household.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">

                  {/* Household Name */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{household.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{household.base_currency}</p>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                      {household.plan_display_name || 'No Plan'}
                    </span>
                  </td>

                  {/* Users */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{household.user_count}</p>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {household.plan_status === 'active' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                        <CheckCircle className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                        <Ban className="w-3 h-3" />
                        <span>Suspended</span>
                      </span>
                    )}
                  </td>

                  {/* Last Activity */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {household.last_activity
                        ? new Date(household.last_activity).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(household.created_at).toLocaleDateString()}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setMenuOpen(menuOpen === household.id ? null : household.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>

                      {menuOpen === household.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(null)}
                          />

                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                            <button
                              onClick={() => {
                                handleChangePlan(household);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Change Plan</span>
                            </button>
                            <button
                              onClick={() => {
                                handleToggleStatus(household);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              {household.plan_status === 'active' ? (
                                <>
                                  <Ban className="w-4 h-4" />
                                  <span>Suspend</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={statusConfirmOpen}
        onClose={() => {
          setStatusConfirmOpen(false);
          setHouseholdToToggle(null);
        }}
        onConfirm={confirmToggleStatus}
        title={householdToToggle?.plan_status === 'active' ? 'Suspend Household' : 'Activate Household'}
        message={`Are you sure you want to ${householdToToggle?.plan_status === 'active' ? 'suspend' : 'activate'} "${householdToToggle?.name}"?`}
        confirmText={householdToToggle?.plan_status === 'active' ? 'Suspend' : 'Activate'}
        variant={householdToToggle?.plan_status === 'active' ? 'danger' : 'warning'}
      />
    </div>
  );
}
