import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet } from 'lucide-react';
import { LoadingSpinner, useToast } from '../../components/common';
import { accountsAPI } from '../../services/api';
import AccountsList from '../../components/accounts/AccountsList';
import AccountModal from '../../components/accounts/AccountModal';
import BalanceAdjustmentModal from '../../components/accounts/BalanceAdjustmentModal';
import { formatCurrency } from '../../utils/formatters';

/**
 * AccountsPage Component
 * 
 * Main page for managing financial accounts
 * Features:
 * - View all accounts with balances
 * - Add new accounts
 * - Edit existing accounts
 * - Delete accounts
 * - Show total balance across all accounts
 */
export default function AccountsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state - tracks if modal is open and which account is being edited
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingAccount, setAdjustingAccount] = useState(null);

  /**
   * Fetch all accounts for the household
   * Uses React Query for caching and automatic refetching
   */
  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  /**
   * Create account mutation
   * Invalidates relevant queries on success to trigger refetch
   */
  const createMutation = useMutation({
    mutationFn: (data) => accountsAPI.create(data),
    onSuccess: () => {
      // Refresh accounts list
      queryClient.invalidateQueries(['accounts']);
      // Refresh dashboard (which shows account summaries)
      queryClient.invalidateQueries(['dashboard-summary']);
    },
  });

  /**
   * Update account mutation
   * Updates existing account details
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => accountsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboard-summary']);
    },
  });

  /**
   * Delete account mutation
   * Soft deletes the account (marks as deleted, doesn't remove from DB)
   */
  const deleteMutation = useMutation({
    mutationFn: (id) => accountsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['transactions']); // Transactions may reference accounts
    },
  });

  /**
   * Adjust balance mutation
   * Creates a balance adjustment transaction
   */
  const adjustBalanceMutation = useMutation({
    mutationFn: ({ accountId, ...data }) => {
 //     console.log('Mutation function - accountId:', accountId); // ADD THIS
 //     console.log('Mutation function - data:', data); // ADD THIS
      return accountsAPI.adjustBalance(accountId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['transactions']);
    },
  });

  /**
   * Handle opening modal for adding new account
   */
  const handleAdd = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  /**
   * Handle opening modal for editing existing account
   * @param {Object} account - Account object to edit
   */
  const handleEdit = (account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  /**
   * Handle saving account (create or update)
   * @param {Object} data - Account form data
   * @param {string} accountId - Account ID if editing (null if creating)
   */
  const handleSave = async (data, accountId) => {
    try {
      if (accountId) {
        // Update existing account
        await updateMutation.mutateAsync({ id: accountId, data });
      } else {
        // Create new account
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is handled in modal component
      throw error;
    }
  };

  /**
   * Handle deleting an account
   * @param {string} id - Account ID to delete
   */
  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Account deleted');
    } catch (error) {
      toast.error('Failed to delete account. It may have associated transactions.');
    }
  };

  /**
   * Handle opening balance adjustment modal
   * @param {Object} account - Account to adjust
   */
  const handleAdjustBalance = (account) => {
    setAdjustingAccount(account);
    setIsAdjustmentModalOpen(true);
  };

  /**
   * Handle saving balance adjustment
   * @param {Object} data - Adjustment data (newBalance, description)
   */
  const handleSaveAdjustment = async (data) => {
    try {
 //     console.log('handleSaveAdjustment received:', data); // ADD THIS
 //     console.log('adjustingAccount:', adjustingAccount); // ADD THIS
      
      const payload = {
        accountId: adjustingAccount.id,
        ...data
      };
      
 //     console.log('Calling mutation with:', payload); // ADD THIS
      
      await adjustBalanceMutation.mutateAsync(payload);
    } catch (error) {
      throw error;
    }
  };

  // Show loading state while fetching accounts
  if (isLoading) {
    return <LoadingSpinner message="Loading accounts..." />;
  }

  // Extract accounts array from response
  const accounts = accountsData?.accounts || [];

  // Calculate total balance grouped by currency
  const balancesByCurrency = accounts.reduce((acc, account) => {
    const currency = account.currency || 'USD';
    const balance = parseFloat(account.current_balance || 0);
    acc[currency] = (acc[currency] || 0) + balance;
    return acc;
  }, {});

  // Get sorted list of currencies (base currency first if we had it)
  const currencies = Object.keys(balancesByCurrency).sort();

  // Count accounts by type for stats
  const accountsByType = accounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Accounts</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bank accounts, credit cards, and cash
          </p>
        </div>
        
        {/* Add Account Button */}
        <button 
          onClick={handleAdd}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Total Balance Card - Shows each currency separately */}
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 md:col-span-2">
          <div className="flex items-center space-x-3 mb-3">
            <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Balance</p>
          </div>
          {currencies.length === 0 ? (
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(0)}
            </p>
          ) : currencies.length === 1 ? (
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(balancesByCurrency[currencies[0]], currencies[0])}
            </p>
          ) : (
            <div className="space-y-1">
              {currencies.map((currency) => (
                <p key={currency} className="text-xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(balancesByCurrency[currency], currency)}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Total Accounts Card */}
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Accounts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {accounts.length}
          </p>
        </div>

        {/* Credit Cards Count */}
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Credit Cards</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {accountsByType.credit || 0}
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <AccountsList
        accounts={accounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdjustBalance={handleAdjustBalance}
      />

      {/* Account Modal (Add/Edit) */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSave}
        account={editingAccount}
      />

      {/* Balance Adjustment Modal */}
      <BalanceAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setAdjustingAccount(null);
        }}
        onSave={handleSaveAdjustment}
        account={adjustingAccount}
      />
    </div>
  );
}
