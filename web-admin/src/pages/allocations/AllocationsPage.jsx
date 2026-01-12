import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Plus, TrendingDown, TrendingUp, DollarSign, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { LoadingSpinner, useToast, ConfirmationModal } from '../../components/common';
import { allocationsAPI } from '../../services/api';
import AllocationCard from '../../components/allocations/AllocationCard';
import AllocationModal from '../../components/allocations/AllocationModal';
import FundIncomeModal from '../../components/allocations/FundIncomeModal';
import MoveMoneyModal from '../../components/allocations/MoveMoneyModal';
import AllocationTransactionsModal from '../../components/allocations/AllocationTransactionsModal';

/**
 * AllocationsPage Component
 * 
 * Envelope budgeting system
 * Features:
 * - View allocations by month
 * - Create/edit/delete allocations
 * - Track spending vs allocated amounts
 * - Visual progress indicators
 */
export default function AllocationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current month (YYYY-MM-01)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });

  // Check if selected month is in the past
  const isPastMonth = (() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const selectedMonth = new Date(currentMonth);
    return selectedMonth < currentMonthStart;
  })();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [allocationToDelete, setAllocationToDelete] = useState(null);

  /**
   * Fetch allocations for current month
   */
  const { data: allocationsData, isLoading } = useQuery({
    queryKey: ['allocations', currentMonth],
    queryFn: async () => {
      const response = await allocationsAPI.getAll(currentMonth);
      return response.data;
    },
  });

  /**
   * Fetch unallocated categories
   */
  const { data: unallocatedData } = useQuery({
    queryKey: ['unallocated-categories', currentMonth],
    queryFn: async () => {
      const response = await allocationsAPI.getUnallocated(currentMonth);
      return response.data;
    },
  });

   /**
   * Fetch transactions for selected allocation
   */
  const { data: transactionsData } = useQuery({
    queryKey: ['allocation-transactions', selectedAllocation?.id],
    queryFn: async () => {
      if (!selectedAllocation) return { transactions: [] };
      const response = await allocationsAPI.getTransactions(selectedAllocation.id);
      return response.data;
    },
    enabled: !!selectedAllocation,
  });

  /**
   * Create/update allocation mutation
   */
  const saveMutation = useMutation({
    mutationFn: (data) => allocationsAPI.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allocations', currentMonth]);
      queryClient.invalidateQueries(['unallocated-categories', currentMonth]);
    },
  });

  /**
   * Delete allocation mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (id) => allocationsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allocations', currentMonth]);
      queryClient.invalidateQueries(['unallocated-categories', currentMonth]);
    },
  });

  /**
   * Handle month navigation
   */
  const handlePreviousMonth = () => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${year}-${month}-01`);
  };

  const handleNextMonth = () => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${year}-${month}-01`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${year}-${month}-01`);
  };

  /**
   * Handle add allocation
   */
  const handleAddAllocation = () => {
    setEditingAllocation(null);
    setIsModalOpen(true);
  };

  /**
   * Handle edit allocation
   */
  const handleEditAllocation = (allocation) => {
    setEditingAllocation(allocation);
    setIsModalOpen(true);
  };

  /**
   * Handle delete allocation - opens confirmation modal
   */
  const handleDeleteAllocation = (allocation) => {
    setAllocationToDelete(allocation);
    setDeleteConfirmOpen(true);
  };

  /**
   * Confirm delete allocation
   */
  const confirmDeleteAllocation = async () => {
    if (!allocationToDelete) return;

    try {
      await deleteMutation.mutateAsync(allocationToDelete.id);
      toast.success('Allocation deleted');
    } catch (error) {
      toast.error('Failed to delete allocation');
      throw error;
    } finally {
      setAllocationToDelete(null);
    }
  };

  /**
   * Handle save allocation
   */
  const handleSaveAllocation = async (data) => {
    try {
      await saveMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Fund allocations mutation
   */
  const fundMutation = useMutation({
    mutationFn: (data) => allocationsAPI.fund(currentMonth, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allocations', currentMonth]);
    },
  });

  /**
   * Handle fund allocations
   */
  const handleFundAllocations = async (fundingArray) => {
    try {
      await fundMutation.mutateAsync(fundingArray);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Move funds mutation
   */
  const moveMutation = useMutation({
    mutationFn: ({ fromId, toId, amount }) => allocationsAPI.move(fromId, toId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries(['allocations', currentMonth]);
    },
  });

  /**
   * Handle move funds
   */
  const handleMoveFunds = async (fromId, toId, amount) => {
    try {
      await moveMutation.mutateAsync({ fromId, toId, amount });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handle view transactions
   */
  const handleViewTransactions = (allocation) => {
    setSelectedAllocation(allocation);
    setIsTransactionsModalOpen(true);
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading allocations..." />;
  }

  const allocations = allocationsData?.allocations || [];
  const summary = allocationsData?.summary || { totalAllocated: 0, totalSpent: 0, totalRemaining: 0 };
  const unallocatedCategories = unallocatedData?.categories || [];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <PieChart className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Allocations</h1>
          <p className="text-gray-600">
            Envelope budgeting - allocate funds to categories
          </p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="card">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {new Date(currentMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={handleCurrentMonth}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
            >
              Jump to current month
            </button>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Total Income */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${summary.totalIncome?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Unallocated Funds */}
        <div className={`card ${summary.unallocatedFunds > 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30' : ''}`}>
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className={`w-5 h-5 ${summary.unallocatedFunds > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`} />
            <p className={`text-sm font-medium ${summary.unallocatedFunds > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
              Unallocated
            </p>
          </div>
          <p className={`text-2xl font-bold ${summary.unallocatedFunds > 0 ? 'text-yellow-900 dark:text-yellow-200' : 'text-gray-900 dark:text-gray-100'}`}>
            ${summary.unallocatedFunds?.toFixed(2) || '0.00'}
          </p>
          {summary.unallocatedFunds > 0 && (
            <button
              onClick={() => setIsFundModalOpen(true)}
              className="text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 mt-2 font-medium"
            >
              → Allocate now
            </button>
          )}
        </div>

        {/* Total Allocated (Available) */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Allocated</p>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            ${summary.totalAvailable?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            in envelopes
          </p>
        </div>

        {/* Envelope Balance */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</p>
          </div>
          <p className={`text-2xl font-bold ${summary.totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ${Math.abs(summary.totalBalance)?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {summary.totalBalance >= 0 ? 'available' : 'overspent'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {allocations.length > 1 && (
          <button
            onClick={() => setIsMoveModalOpen(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Move Money</span>
          </button>
        )}
        
        <button
          onClick={handleAddAllocation}
          disabled={unallocatedCategories.length === 0 || isPastMonth}
          title={
            isPastMonth
              ? "Cannot create allocations for past months"
              : unallocatedCategories.length === 0
                ? (allocations.length === 0
                  ? "No categories available - create categories first"
                  : "All categories already have allocations for this month")
                : ""
          }
          className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Add Allocation</span>
        </button>
      </div>

      {/* Allocations Grid */}
      {allocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allocations.map((allocation) => (
            <AllocationCard
              key={allocation.id}
              allocation={allocation}
              onEdit={handleEditAllocation}
              onDelete={handleDeleteAllocation}
              onViewTransactions={handleViewTransactions}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Allocations {isPastMonth ? 'For This Month' : 'Yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isPastMonth
              ? "This month has passed. You can view allocations but cannot create new ones."
              : unallocatedCategories.length === 0
                ? "You need to create expense categories before you can allocate funds to them."
                : "Create your first allocation to start envelope budgeting"}
          </p>
          {!isPastMonth && (
            unallocatedCategories.length === 0 ? (
              <a
                href="/categories"
                className="btn btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Categories</span>
              </a>
            ) : (
              <button
                onClick={handleAddAllocation}
                className="btn btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Allocation</span>
              </button>
            )
          )}
        </div>
      )}

      {/* Unallocated Categories Info */}
      {unallocatedCategories.length > 0 && allocations.length > 0 && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>{unallocatedCategories.length}</strong> categories without allocations this month: {' '}
            {unallocatedCategories.slice(0, 3).map(c => c.name).join(', ')}
            {unallocatedCategories.length > 3 && ` and ${unallocatedCategories.length - 3} more`}
          </p>
        </div>
      )}

      {/* Allocation Modal */}
      <AllocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAllocation(null);
        }}
        onSave={handleSaveAllocation}
        allocation={editingAllocation}
        categories={unallocatedCategories}
        month={currentMonth}
      />

      {/* Fund Income Modal */}
      <FundIncomeModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        onFund={handleFundAllocations}
        allocations={allocations}
        unallocatedFunds={summary.unallocatedFunds || 0}
      />

      {/* Move Money Modal */}
      <MoveMoneyModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        onMove={handleMoveFunds}
        allocations={allocations}
      />

      {/* Allocation Transactions Modal */}
      <AllocationTransactionsModal
        isOpen={isTransactionsModalOpen}
        onClose={() => {
          setIsTransactionsModalOpen(false);
          setSelectedAllocation(null);
        }}
        allocation={selectedAllocation}
        transactions={transactionsData?.transactions || []}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setAllocationToDelete(null);
        }}
        onConfirm={confirmDeleteAllocation}
        title="Delete Allocation"
        message={`Are you sure you want to delete the allocation for "${allocationToDelete?.category_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
