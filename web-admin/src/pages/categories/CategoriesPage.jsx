import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag } from 'lucide-react';
import { LoadingSpinner, useToast } from '../../components/common';
import { categoriesAPI } from '../../services/api';
import CategoriesList from '../../components/categories/CategoriesList';
import CategoryModal from '../../components/categories/CategoryModal';
import CategorySpendingModal from '../../components/categories/CategorySpendingModal';
import { useAuth } from '../../context/AuthContext';

/**
 * CategoriesPage Component
 * 
 * Main page for managing transaction categories
 * Features:
 * - View all categories grouped by type (Income/Expense)
 * - Add new categories (with permission check)
 * - Edit existing categories
 * - Delete categories
 * - Icon and color customization
 */
export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Modal state - tracks if modal is open and which category is being edited
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Spending modal state
  const [spendingCategoryId, setSpendingCategoryId] = useState(null);

  /**
   * Fetch user subscription with features
   * Used to check if user has permission to create categories
   */
  const { data: userSubscriptionData } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const response = await categoriesAPI.getCurrent();
      return response.data;
    },
  });

  /**
   * Fetch all categories for the household
   * Returns categories grouped by type: { income: [], expense: [], system: [] }
   */
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data;
    },
  });

  /**
   * Create category mutation
   * Invalidates relevant queries on success to trigger refetch
   */
  const createMutation = useMutation({
    mutationFn: (data) => categoriesAPI.create(data),
    onSuccess: () => {
      // Refresh categories list
      queryClient.invalidateQueries(['categories']);
    },
  });

  /**
   * Update category mutation
   * Updates existing category details
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoriesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    },
  });

  /**
   * Delete category mutation
   * Soft deletes the category (marks as deleted, doesn't remove from DB)
   */
  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    },
  });

  /**
   * Handle opening modal for adding new category
   * Only allowed for admins or users with create_categories permission
   */
  const handleAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  /**
   * Handle opening modal for editing existing category
   * @param {Object} category - Category object to edit
   */
  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  /**
   * Handle saving category (create or update)
   * @param {Object} data - Category form data
   * @param {string} categoryId - Category ID if editing (null if creating)
   */
  const handleSave = async (data, categoryId) => {
    try {
      if (categoryId) {
        // Update existing category
        await updateMutation.mutateAsync({ id: categoryId, data });
      } else {
        // Create new category
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is handled in modal component
      throw error;
    }
  };

  /**
   * Handle deleting a category
   * @param {string} id - Category ID to delete
   */
  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category. It may be in use by existing transactions.');
    }
  };

  /**
   * Handle viewing spending history for a category
   * @param {Object} category - Category to view spending for
   */
  const handleViewSpending = (category) => {
    setSpendingCategoryId(category.id);
  };

  // Show loading state while fetching categories
  if (isLoading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  // Extract grouped categories from response
  const groupedCategories = categoriesData?.grouped || { income: [], expense: [] };
  const allCategories = categoriesData?.categories || [];

  // Count categories by type
  const expenseCount = groupedCategories.expense?.length || 0;
  const incomeCount = groupedCategories.income?.length || 0;
  const totalCount = expenseCount + incomeCount;

  // Check if user has permission to create categories
  const canCreateCategories = user?.role === 'admin' || userSubscriptionData?.features?.create_categories === true;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your transactions with custom categories
          </p>
        </div>

        {/* Add Category Button - Only show if user has permission */}
        {canCreateCategories && (
          <button
            onClick={handleAdd}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Categories Card */}
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
          <div className="flex items-center space-x-3 mb-2">
            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Categories</p>
          </div>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {totalCount}
          </p>
        </div>

        {/* Expense Categories Card */}
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expense Categories</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {expenseCount}
          </p>
        </div>

        {/* Income Categories Card */}
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Income Categories</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {incomeCount}
          </p>
        </div>
      </div>

      {/* Permission Notice for non-admins without create permission */}
      {!canCreateCategories && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <Tag className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Limited Access</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                You can view categories but cannot create new ones. Contact your admin for access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <CategoriesList
        categories={groupedCategories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewSpending={handleViewSpending}
      />

      {/* Category Modal (Add/Edit) */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSave}
        category={editingCategory}
      />

      {/* Category Spending Modal */}
      <CategorySpendingModal
        isOpen={!!spendingCategoryId}
        onClose={() => setSpendingCategoryId(null)}
        categoryId={spendingCategoryId}
      />
    </div>
  );
}
