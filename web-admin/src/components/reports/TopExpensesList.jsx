import * as LucideIcons from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * TopExpensesList Component
 * 
 * Displays a list of top expense categories
 * Shows category icon, name, amount, and percentage bar
 * 
 * @param {Array} data - Array of category expense data
 * @param {string} currency - Currency code
 * @param {Function} onCategoryClick - Callback when category is clicked
 */
export default function TopExpensesList({ data, currency = 'USD', onCategoryClick }) {
  // Don't render if no data
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No expense data available
      </div>
    );
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

  // Take top 10
  const topExpenses = data.slice(0, 10);

  return (
    <div className="space-y-3">
      {topExpenses.map((expense, index) => {
        const percentage = total > 0 ? (parseFloat(expense.total_amount) / total) * 100 : 0;
        const IconComponent = LucideIcons[expense.icon];

        return (
          <div key={index} className="flex items-center space-x-3" onClick={() => onCategoryClick && onCategoryClick(expense)}>
            {/* Rank */}
            <div className="w-6 text-sm font-semibold text-gray-500">
              #{index + 1}
            </div>

            {/* Category Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: expense.color + '20', 
                color: expense.color 
              }}
            >
              {IconComponent ? (
                <IconComponent className="w-5 h-5" />
              ) : (
                <span className="text-lg">{expense.icon}</span>
              )}
            </div>

            {/* Category Name & Progress Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {expense.category_name}
                </span>
                <span className="text-sm font-semibold text-gray-900 ml-2">
                  {formatCurrency(expense.total_amount, currency)}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: expense.color 
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {percentage.toFixed(1)}% of total
                </span>
                <span className="text-xs text-gray-500">
                  {expense.transaction_count} transaction{expense.transaction_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}