import { useState } from 'react';
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight, ArrowLeftRight, MoreVertical } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function TransactionsList({ transactions, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(null);

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

  // Helper to get account name from lines
  const getAccountName = (transaction) => {
    if (!transaction.lines || transaction.lines.length === 0) return '-';
    if (transaction.lines.length === 1) {
      return transaction.lines[0].accountName || '-';
    }
    // Multiple accounts
    return `${transaction.lines.length} accounts`;
  };

  // Helper to get category name from lines
  const getCategoryName = (transaction) => {
    if (!transaction.lines || transaction.lines.length === 0) return '-';
    if (transaction.type === 'transfer') return 'Transfer';
    if (transaction.lines.length === 1) {
      return transaction.lines[0].categoryName || '-';
    }
    // Multiple categories
    return `${transaction.lines.length} categories`;
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

  const getTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add your first transaction to get started</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Account</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(transaction.date)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded bg-gray-50 dark:bg-gray-800">
                      {getIcon(transaction.type)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {transaction.title || transaction.description || '-'}
                      </span>
                      {transaction.description && transaction.title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getCategoryName(transaction)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getAccountName(transaction)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {getTypeLabel(transaction.type)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`text-sm font-semibold ${getAmountColor(transaction.type)}`}>
                    {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
                    {formatCurrency(calculateTotal(transaction))}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setMenuOpen(menuOpen === transaction.id ? null : transaction.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>

                    {menuOpen === transaction.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                          <button
                            onClick={() => {
                              onEdit(transaction);
                              setMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this transaction?')) {
                                onDelete(transaction.id);
                              }
                              setMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
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
  );
}