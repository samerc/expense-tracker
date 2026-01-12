import { useState } from 'react';
import { Edit2, Trash2, MoreVertical, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * BudgetCard Component
 * 
 * Displays a single budget with progress bar
 * Shows category icon, name, limit, spent, and remaining
 * Color-coded based on spending percentage
 * 
 * @param {Object} budget - Budget object with category, limit, spent info
 * @param {Function} onEdit - Callback when edit button is clicked
 * @param {Function} onDelete - Callback when delete button is clicked
 */
export default function BudgetCard({ budget, onEdit, onDelete }) {
  // Track if menu is open
  const [menuOpen, setMenuOpen] = useState(false);

  // Calculate budget metrics
  const limit = parseFloat(budget.planned_amount) || 0;
  const spent = parseFloat(budget.actual_spent) || 0;
  const remaining = limit - spent;
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  // Get the Lucide icon component for the category
  const IconComponent = budget.category_icon ? LucideIcons[budget.category_icon] : null;

  /**
   * Determine status color based on spending percentage
   * Green: < 75%, Yellow: 75-90%, Orange: 90-100%, Red: > 100%
   */
  const getStatusColor = () => {
    if (percentage >= 100) return 'red';
    if (percentage >= 90) return 'orange';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  /**
   * Get status icon based on spending
   */
  const getStatusIcon = () => {
    const color = getStatusColor();
    if (color === 'red') return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (color === 'orange' || color === 'yellow') return <TrendingUp className="w-5 h-5 text-orange-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  /**
   * Get progress bar color classes
   */
  const getProgressBarColor = () => {
    const color = getStatusColor();
    if (color === 'red') return 'bg-red-500';
    if (color === 'orange') return 'bg-orange-500';
    if (color === 'yellow') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  /**
   * Get background color for card based on status
   */
  const getCardBgColor = () => {
    const color = getStatusColor();
    if (color === 'red') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (color === 'orange') return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    if (color === 'yellow') return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-white dark:bg-gray-900';
  };

  return (
    <div className={`card ${getCardBgColor()} transition-colors`}>
      {/* Header: Category Info & Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Category Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: budget.category_color + '20', 
              color: budget.category_color 
            }}
          >
            {IconComponent ? (
              <IconComponent className="w-5 h-5" />
            ) : (
              <span className="text-lg">{budget.category_icon}</span>
            )}
          </div>

          {/* Category Name & Period */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{budget.category_name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {budget.month || 'Monthly Budget'} {/* Changed from period */}
            </p>
          </div>
        </div>

        {/* Status Icon & Actions Menu */}
        <div className="flex items-center space-x-2">
          {getStatusIcon()}

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />

                {/* Menu Items */}
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => {
                      onEdit(budget);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete budget for "${budget.category_name}"?`)) {
                        onDelete(budget.id);
                      }
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Budget Amounts */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Spent</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(spent)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Limit</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatCurrency(limit)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer: Remaining & Percentage */}
      <div className="flex items-center justify-between text-sm">
        <div>
          {remaining >= 0 ? (
            <span className="text-green-700 dark:text-green-400 font-medium">
              {formatCurrency(remaining)} remaining
            </span>
          ) : (
            <span className="text-red-700 dark:text-red-400 font-medium">
              {formatCurrency(Math.abs(remaining))} over budget
            </span>
          )}
        </div>
        <div className="text-gray-600 dark:text-gray-400 font-medium">
          {percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
