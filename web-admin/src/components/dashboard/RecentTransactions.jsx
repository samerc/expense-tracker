import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function RecentTransactions({ transactions }) {
  // Helper function to calculate total amount from lines
  const calculateTotal = (transaction) => {
    if (!transaction.lines || transaction.lines.length === 0) return 0;

    // For transfers, show the amount being transferred (first line's amount)
    if (transaction.type === 'transfer' && transaction.lines.length > 0) {
      return Math.abs(parseFloat(transaction.lines[0].baseCurrencyAmount || transaction.lines[0].amount || 0));
    }

    // Sum all line amounts (use baseCurrencyAmount for accuracy)
    return transaction.lines.reduce((sum, line) => {
      return sum + Math.abs(parseFloat(line.baseCurrencyAmount || line.amount || 0));
    }, 0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'expense':
        return <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'transfer':
        return <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <ArrowDownRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getAmountColor = (type) => {
    switch (type) {
      case 'income':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
          <Link to="/transactions" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            View all
          </Link>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
        <Link to="/transactions" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                {getIcon(transaction.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {transaction.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(transaction.date)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${getAmountColor(transaction.type)}`}>
                {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
                {formatCurrency(calculateTotal(transaction))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
