import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { LoadingSpinner, useToast } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import TransactionsList from '../../components/transactions/TransactionsList';
import TransactionFilters from '../../components/transactions/TransactionFilters';
import TransactionModal from '../../components/transactions/TransactionModal';
import { transactionsAPI, accountsAPI, categoriesAPI, subscriptionAPI, householdAPI } from '../../services/api';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    accountId: '',
    categoryId: '',
    type: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Fetch total count (unfiltered)
  const { data: totalCountData } = useQuery({
    queryKey: ['transactions-total-count'],
    queryFn: async () => {
      const response = await transactionsAPI.getAll({ limit: 1 });
      return response.data;
    },
  });

  // Fetch user subscription with features
/*  const { data: userSubscriptionData, isLoading: subscriptionLoading, error: subscriptionError } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
//      console.log('SUBSCRIPTION QUERY RUNNING');
      const response = await subscriptionAPI.getCurrent();
//      console.log('SUBSCRIPTION RESPONSE:', response.data);
      return response.data;
    },
    enabled: true,
  });*/

  // Fetch transactions (with filters)
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.type) params.type = filters.type;
      
      const response = await transactionsAPI.getAll(params);
      return response.data;
    },
  });

  // Fetch accounts for filters
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  // Fetch categories for filters
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll();
      return response.data;
    },
  });

  // Fetch household info for base currency
  const { data: householdData } = useQuery({
    queryKey: ['household-info'],
    queryFn: async () => {
      const response = await householdAPI.getInfo();
      return response.data;
    },
  });

  const baseCurrency = householdData?.base_currency || 'USD';

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => transactionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transactions-total-count']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['recent-transactions']);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transactions-total-count']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['recent-transactions']);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => transactionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transactions-total-count']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['accounts']);
    },
  });

  // Filter transactions by search
  const filteredTransactions = transactionsData?.transactions?.filter(transaction => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.category_name?.toLowerCase().includes(searchLower) ||
      transaction.account_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleAdd = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleSave = async (data, transactionId) => {
    try {
      if (transactionId) {
        await updateMutation.mutateAsync({ id: transactionId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Transaction deleted');
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading transactions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your income, expenses, and transfers
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalCountData?.pagination?.total || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Filtered Results</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {transactionsData?.pagination?.total || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Matching Search</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {filteredTransactions.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFilterChange={setFilters}
        accounts={accountsData?.accounts}
        categories={categoriesData}
      />

      {/* Transactions List */}
      <TransactionsList
        transactions={filteredTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSave}
        transaction={editingTransaction}
        accounts={accountsData?.accounts}
        categories={categoriesData}
        baseCurrency={baseCurrency}
        user={user}
        onCategoryCreated={() => queryClient.invalidateQueries(['categories'])}
      />
    </div>
  );
}