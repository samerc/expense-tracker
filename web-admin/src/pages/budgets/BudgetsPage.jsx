import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PiggyBank, TrendingUp, AlertTriangle } from 'lucide-react';
import { LoadingSpinner, useToast } from '../../components/common';
import { budgetsAPI, categoriesAPI } from '../../services/api';
import BudgetCard from '../../components/budgets/BudgetCard';
import BudgetModal from '../../components/budgets/BudgetModal';
import { formatCurrency } from '../../utils/formatters';

/**
 * BudgetsPage Component
 * 
 * Main page for managing budgets
 * Features:
 * - View all budgets with progress bars
 * - Add new budgets for expense categories
 * - Edit existing budgets
 * - Delete budgets
 * - Visual indicators for budget status (on track, warning, over)
 * - Summary statistics
 */
export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  /**
   * Fetch all budgets with current spending
   * Returns budgets with calculated spent amounts for current period
   */
  const { data: budgetsData, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await budgetsAPI.getAll();
      return response.data;
    },
  });

  /**
   * Fetch expense categories for budget creation
   * Only expense categories can have budgets
   */
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data;
    },
  });

  /**
   * Create budget mutation
   */
  const createMutation = useMutation({
    mutationFn: (data) => budgetsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
    },
  });

  /**
   * Update budget mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => budgetsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
    },
  });

  /**
   * Delete budget mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (id) => budgetsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
    },
  });

  /**
   * Handle opening modal for adding new budget
   */
  const handleAdd = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  /**
   * Handle opening modal for editing existing budget
   */
  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  /**
   * Handle saving budget (create or update)
   */
  const handleSave = async (data, budgetId) => {
    try {
      if (budgetId) {
        await updateMutation.mutateAsync({ id: budgetId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handle deleting a budget
   */
  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Budget deleted');
    } catch (error) {
      toast.error('Failed to delete budget');
    }
  };

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading budgets..." />;
  }

  // Extract budgets and categories
  const budgets = budgetsData?.budgets || [];
  const expenseCategories = categoriesData?.grouped?.expense || [];

  // Calculate summary statistics
  const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0);
  const onTrackCount = budgets.filter(b => {
    const percentage = parseFloat(b.amount) > 0 ? (parseFloat(b.spent) / parseFloat(b.amount)) * 100 : 0;
    return percentage < 75;
  }).length;
  const overBudgetCount = budgets.filter(b => parseFloat(b.spent) > parseFloat(b.amount)).length;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Budgets</h1>
          <p className="text-gray-600">
            Set spending limits and track your progress
          </p>
        </div>

        {/* Add Budget Button */}
        <button
          onClick={handleAdd}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Total Budgeted */}
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center space-x-3 mb-2">
            <PiggyBank className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-600">Total Budgeted</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">
            {formatCurrency(totalBudgeted)}
          </p>
        </div>

        {/* Total Spent */}
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalSpent)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalBudgeted > 0 ? `${((totalSpent / totalBudgeted) * 100).toFixed(0)}% of budget` : ''}
          </p>
        </div>

        {/* On Track */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-sm text-gray-600">On Track</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {onTrackCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {budgets.length > 0 ? `${((onTrackCount / budgets.length) * 100).toFixed(0)}% of budgets` : ''}
          </p>
        </div>

        {/* Over Budget */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-gray-600">Over Budget</p>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {overBudgetCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {budgets.length > 0 ? `${((overBudgetCount / budgets.length) * 100).toFixed(0)}% of budgets` : ''}
          </p>
        </div>
      </div>

      {/* Budgets Grid */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <PiggyBank className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No budgets yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Create your first budget to start tracking spending
          </p>
          <button
            onClick={handleAdd}
            className="btn btn-primary mt-4"
          >
            Create Budget
          </button>
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSave}
        budget={editingBudget}
        categories={expenseCategories}
      />
    </div>
  );
}
