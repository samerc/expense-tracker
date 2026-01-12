import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner, useToast } from '../../components/common';
import { superAdminAPI } from '../../services/api';
import PlanModal from '../../components/super-admin/PlanModal';

/**
 * PlansPage Component
 * 
 * Manage subscription plans
 * Features:
 * - View all plans
 * - Create new plans
 * - Edit existing plans
 * - Toggle plan active status
 */
export default function PlansPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  /**
   * Fetch all plans
   */
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['super-admin-plans'],
    queryFn: async () => {
      const response = await superAdminAPI.getAllPlans();
      return response.data;
    },
  });

  /**
   * Create plan mutation
   */
  const createMutation = useMutation({
    mutationFn: (data) => superAdminAPI.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-plans']);
      setIsModalOpen(false);
    },
  });

  /**
   * Update plan mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ planId, data }) => superAdminAPI.updatePlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-plans']);
      setIsModalOpen(false);
      setEditingPlan(null);
    },
  });

  /**
   * Handle create plan
   */
  const handleCreatePlan = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  /**
   * Handle edit plan
   */
  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  /**
   * Handle save plan
   */
  const handleSavePlan = async (data) => {
    try {
      if (editingPlan) {
        await updateMutation.mutateAsync({ planId: editingPlan.id, data });
        toast.success('Plan updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Plan created successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save plan');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading plans..." />;
  }

  const plans = plansData?.plans || [];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <p className="text-gray-600">
              Manage pricing and features for all subscription tiers
            </p>
          </div>
        </div>

        <button
          onClick={handleCreatePlan}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`card relative ${!plan.is_active ? 'opacity-60' : ''}`}
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              {plan.is_active ? (
                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                  <CheckCircle className="w-3 h-3" />
                  <span>Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                  <XCircle className="w-3 h-3" />
                  <span>Inactive</span>
                </span>
              )}
            </div>

            {/* Plan Header */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {plan.display_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${parseFloat(plan.price_monthly).toFixed(2)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              {plan.price_annual > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  ${parseFloat(plan.price_annual).toFixed(2)}/year
                </p>
              )}
            </div>

            {/* Limits */}
            <div className="space-y-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Max Users</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Max Accounts</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {plan.max_accounts === -1 ? 'Unlimited' : plan.max_accounts}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Max Budgets</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {plan.max_budgets === -1 ? 'Unlimited' : plan.max_budgets}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-1 mb-6">
              {plan.features && Object.entries(plan.features).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 text-xs">
                  {value ? (
                    <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-gray-400" />
                  )}
                  <span className={value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <button
              onClick={() => handleEditPlan(plan)}
              className="w-full btn btn-secondary text-sm flex items-center justify-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Plan</span>
            </button>

            {/* Plan ID */}
            <p className="text-xs text-gray-400 mt-4 font-mono text-center">
              {plan.id}
            </p>
          </div>
        ))}
      </div>

      {/* Plan Modal */}
      <PlanModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        plan={editingPlan}
      />
    </div>
  );
}
