import { useState } from 'react';
import { Edit2, Trash2, MoreVertical, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * AccountsList Component
 * 
 * Displays a grid of account cards with balance information
 * Provides edit and delete actions for each account
 * 
 * @param {Array} accounts - List of account objects from API
 * @param {Function} onEdit - Callback when edit button is clicked
 * @param {Function} onDelete - Callback when delete button is clicked
 */
export default function AccountsList({ accounts, onEdit, onDelete, onAdjustBalance }) {
  // Track which account's menu is open (by account ID)
  const [menuOpen, setMenuOpen] = useState(null);

  // Show empty state if no accounts
  if (!accounts || accounts.length === 0) {
    return (
      <div className="card text-center py-12">
        <Wallet className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No accounts yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add your first account to get started</p>
      </div>
    );
  }

  /**
   * Get icon based on account type
   * @param {string} type - Account type (checking, savings, credit_card, cash, investment)
   * @returns {JSX.Element} Lucide icon component
   */
  const getAccountIcon = (type) => {
    switch (type) {
      case 'savings':
        return <TrendingUp className="w-6 h-6" />;
      case 'credit_card':
        return <TrendingDown className="w-6 h-6" />;
      default:
        return <Wallet className="w-6 h-6" />;
    }
  };

  /**
   * Get color classes based on account type
   * @param {string} type - Account type
   * @returns {string} Tailwind CSS classes
   */
  const getAccountColor = (type) => {
    switch (type) {
      case 'bank':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'cash':
        return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'credit':
        return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'wallet':
        return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  /**
   * Format account type for display
   * @param {string} type - Account type in snake_case
   * @returns {string} Formatted type (e.g., "Credit Card")
   */
  const formatAccountType = (type) => {
    switch (type) {
      case 'bank':
        return 'Bank Account';
      case 'cash':
        return 'Cash';
      case 'credit':
        return 'Credit Card';
      case 'wallet':
        return 'Wallet';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <div key={account.id} className="card hover:shadow-lg transition-shadow">
          {/* Account Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {/* Account Icon */}
              <div className={`p-3 rounded-lg ${getAccountColor(account.type)}`}>
                {getAccountIcon(account.type)}
              </div>

              {/* Account Name & Type */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{account.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatAccountType(account.type)}</p>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(menuOpen === account.id ? null : account.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {menuOpen === account.id && (
                <>
                  {/* Backdrop to close menu when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(null)}
                  />

                  {/* Menu Items */}
                  <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <button
                      onClick={() => {
                        onEdit(account);
                        setMenuOpen(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>

                    {/* ADD THIS OPTION */}
                    <button
                      onClick={() => {
                        onAdjustBalance(account);
                        setMenuOpen(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Adjust Balance</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete "${account.name}"? This cannot be undone.`)) {
                          onDelete(account.id);
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
          </div>

          {/* Account Balance */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(account.current_balance, account.currency)}
            </p>

            {/* Additional Info */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Currency: {account.currency}</span>
              {account.institution && (
                <span className="truncate ml-2">{account.institution}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
