import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, TrendingUp, TrendingDown, DollarSign, X, Lock } from 'lucide-react';
import { LoadingSpinner } from '../../components/common';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ExpenseBreakdownChart from '../../components/reports/ExpenseBreakdownChart';
import SpendingTrendChart from '../../components/reports/SpendingTrendChart';
import TopExpensesList from '../../components/reports/TopExpensesList';
import DateRangePicker from '../../components/reports/DateRangePicker';
import { formatCurrency } from '../../utils/formatters';

/**
 * ReportsPage Component
 * 
 * Main page for viewing financial reports and analytics
 * Features:
 * - Expense breakdown by category (pie chart)
 * - Income vs Expenses trend (line chart)
 * - Top expense categories (ranked list)
 * - Date range filtering
 * - Summary statistics
 * - Export to CSV (future)
 */
export default function ReportsPage() {
  const { hasFeature } = useAuth();

  // Check feature access
  const hasAdvancedReports = hasFeature('advanced_reports');
  const hasExportCsv = hasFeature('export_csv');

  // Date range state - default to current month (start from 1st day)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return {
      startDate,
      endDate,
    };
  });

  //Force invalidate queries when dates change
  const queryClient = useQueryClient();

  //Modal for category transactions
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);

  /**
   * Effect: Close transactions modal on Escape key
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showTransactionsModal) {
        setShowTransactionsModal(false);
        setSelectedCategory(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showTransactionsModal]);

  useEffect(() => {
//    console.log('Date range changed, invalidating queries');
    queryClient.invalidateQueries(['reports-expense-breakdown']);
    queryClient.invalidateQueries(['reports-income-breakdown']);
    queryClient.invalidateQueries(['reports-spending-trends']);
  }, [dateRange.startDate, dateRange.endDate, queryClient]);

  // Create unique key for forcing remount when dates change
  const queryKey = `${dateRange.startDate}_${dateRange.endDate}`;

  /**
   * Fetch expense breakdown by category
   */
  const { data: expenseBreakdownData, isLoading: isLoadingBreakdown } = useQuery({
    queryKey: ['reports-expense-breakdown', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await reportsAPI.getExpenseByCategory(
        dateRange.startDate,
        dateRange.endDate
      );
      return response.data;
    },
    enabled: hasAdvancedReports,
  });

  /**
   * Fetch income breakdown by category
   */
  const { data: incomeBreakdownData, isLoading: isLoadingIncome } = useQuery({
    queryKey: ['reports-income-breakdown', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await reportsAPI.getIncomeByCategory(
        dateRange.startDate,
        dateRange.endDate
      );
      return response.data;
    },
    enabled: hasAdvancedReports,
  });

  /**
   * Fetch spending trends over time
   */
  const { data: spendingTrendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['reports-spending-trends', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await reportsAPI.getSpendingTrends(
        dateRange.startDate,
        dateRange.endDate
      );
      return response.data;
    },
    enabled: hasAdvancedReports,
  });

  /**
   * Fetch transactions for selected category
   */
  const { data: categoryTransactionsData } = useQuery({
    queryKey: ['category-transactions', selectedCategory?.category_id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!selectedCategory) return { transactions: [] };
      
      const response = await reportsAPI.getCategoryTransactions(
        selectedCategory.category_id,
        dateRange.startDate,
        dateRange.endDate
      );
      return response.data;
    },
    enabled: !!selectedCategory,
  });

  /**
   * Handle clicking on a category in top expenses
   */
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowTransactionsModal(true);
  };

  /**
   * Handle preset date range selection
   */
  const handlePresetSelect = (preset) => {
    setDateRange({
      startDate: preset.start,
      endDate: preset.end,
    });
  };

  /**
   * Calculate summary statistics
   */
  const getSummaryStats = () => {
    const totalExpenses = expenseBreakdownData?.total || 0;
    const totalIncome = incomeBreakdownData?.total || 0;
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    return {
      totalExpenses,
      totalIncome,
      netIncome,
      savingsRate,
    };
  };

  const stats = getSummaryStats();

  /**
   * Prepare data for expense breakdown pie chart
   */
  const expensePieData = expenseBreakdownData?.categories?.map((cat) => {
    const total = expenseBreakdownData.total || 0;
    return {
      name: cat.category_name,
      value: parseFloat(cat.total_amount),
      color: cat.color || '#3B82F6',
      percentage: total > 0 ? (parseFloat(cat.total_amount) / total) * 100 : 0,
    };
  }) || [];

  /**
   * Prepare data for spending trend line chart
   */
  const trendChartData = spendingTrendsData?.trends?.map((item) => ({
    month: item.month,
    income: parseFloat(item.income || 0),
    expenses: parseFloat(item.expenses || 0),
  })) || [];

  // Show loading on initial load (only if user has access)
  if (hasAdvancedReports && (isLoadingBreakdown || isLoadingIncome || isLoadingTrends)) {
    return <LoadingSpinner message="Loading reports..." />;
  }

  // Show upgrade message if user doesn't have advanced reports feature
  if (!hasAdvancedReports) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze your spending patterns and financial trends
          </p>
        </div>

        {/* Upgrade Required Card */}
        <div className="card text-center py-12">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Advanced Reports
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Upgrade your plan to access detailed expense breakdowns, spending trends,
            income analysis, and more powerful reporting features.
          </p>
          <a
            href="/plans"
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <span>View Plans</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" key={queryKey}>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-gray-600">
            Analyze your spending patterns and financial trends
          </p>
        </div>

        {/* Export Button */}
        {hasExportCsv ? (
          <button
            className="btn btn-secondary flex items-center space-x-2"
            disabled
            title="Export functionality coming soon"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        ) : (
          <button
            className="btn btn-secondary flex items-center space-x-2 opacity-50 cursor-not-allowed"
            disabled
            title="Upgrade to Pro plan to export data"
          >
            <Lock className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onStartDateChange={(date) => setDateRange({ ...dateRange, startDate: date })}
        onEndDateChange={(date) => setDateRange({ ...dateRange, endDate: date })}
        onPresetSelect={handlePresetSelect}
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Income */}
        <div className="card bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-600">Total Income</p>
          </div>
          <p className="text-3xl font-bold text-green-900">
            {formatCurrency(stats.totalIncome)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {dateRange.startDate} to {dateRange.endDate}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="card bg-gradient-to-r from-red-50 to-red-100">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-600">Total Expenses</p>
          </div>
          <p className="text-3xl font-bold text-red-900">
            {formatCurrency(stats.totalExpenses)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {dateRange.startDate} to {dateRange.endDate}
          </p>
        </div>

        {/* Net Income */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-600">Net Income</p>
          </div>
          <p className={`text-3xl font-bold ${stats.netIncome >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(stats.netIncome)}
          </p>
        </div>

        {/* Savings Rate */}
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Savings Rate</p>
          <p className={`text-3xl font-bold ${stats.savingsRate >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {stats.savingsRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.savingsRate >= 20 ? 'Excellent!' : stats.savingsRate >= 10 ? 'Good' : 'Consider saving more'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Expense Breakdown Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Expense Breakdown</h2>
          <ExpenseBreakdownChart data={expensePieData} />
        </div>

        {/* Spending Trends Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Income vs Expenses Trend</h2>
          <SpendingTrendChart data={trendChartData} />
        </div>
      </div>

     {/* Top Expenses List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Top Expense Categories</h2>
        <TopExpensesList 
          data={expenseBreakdownData?.categories || []} 
          onCategoryClick={handleCategoryClick}
        />
      </div>

      {/* Category Transactions Modal */}
      {showTransactionsModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedCategory.category_name} Transactions
              </h3>
              <button
                onClick={() => {
                  setShowTransactionsModal(false);
                  setSelectedCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Showing transactions from {dateRange.startDate} to {dateRange.endDate}
              </p>

              {categoryTransactionsData?.transactions?.length > 0 ? (
                <div className="space-y-2">
                  {categoryTransactionsData.transactions.map((transaction, index) => (
                    <div
                      key={`${transaction.transaction_id}-${index}`}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()} • {transaction.account_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No transactions found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}