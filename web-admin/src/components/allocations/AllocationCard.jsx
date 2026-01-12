import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Edit2, Trash2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

/**
 * AllocationCard Component
 * 
 * Displays a single allocation envelope
 * Shows: allocated (budget), available (funded), spent, and balance
 */
export default function AllocationCard({ allocation, onEdit, onDelete, onViewTransactions }) {
  const [showActions, setShowActions] = useState(false);

  const allocated = parseFloat(allocation.allocated_amount);
  const available = parseFloat(allocation.available_amount);
  const spent = parseFloat(allocation.spent_amount);
  const balance = available - spent;
  const toFund = allocated - available;

  const percentageSpent = available > 0 ? (spent / available) * 100 : 0;

  // Get icon component
  const IconComponent = LucideIcons[allocation.icon] || LucideIcons.Tag;

  // Get status
  const getStatus = () => {
    if (balance < 0) return { color: 'red', text: 'Overspent', icon: AlertCircle };
    if (toFund > 0) return { color: 'yellow', text: 'Needs Funding', icon: AlertTriangle };
    if (balance === 0) return { color: 'gray', text: 'Empty', icon: CheckCircle };
    return { color: 'green', text: 'Funded', icon: CheckCircle };
  };

  const status = getStatus();
  const colorMap = {
    green: { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bgLight: 'bg-green-50 dark:bg-green-900/30' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', bgLight: 'bg-yellow-50 dark:bg-yellow-900/30' },
    red: { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bgLight: 'bg-red-50 dark:bg-red-900/30' },
    gray: { bg: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400', bgLight: 'bg-gray-50 dark:bg-gray-800' },
  };

  const StatusIcon = status.icon;

  return (
    <div 
      className="card hover:shadow-lg transition-shadow relative cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onViewTransactions && onViewTransactions(allocation)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: allocation.color + '20' }}
          >
            <IconComponent 
              className="w-6 h-6" 
              style={{ color: allocation.color }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{allocation.category_name}</h3>
            <div className="flex items-center space-x-1 text-xs mt-1">
              <StatusIcon className={`w-3 h-3 ${colorMap[status.color].text}`} />
              <span className={colorMap[status.color].text}>{status.text}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(allocation);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Edit budget"
            >
              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(allocation);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Delete allocation"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* Amounts */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Budgeted</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">${allocated.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Available</span>
          <span className={`font-semibold ${toFund > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}>
            ${available.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Spent</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">${spent.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Balance</span>
          <span className={`font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ${Math.abs(balance).toFixed(2)}
          </span>
        </div>
      </div>

      {/* To Fund Warning */}
      {toFund > 0 && (
        <div className={`mb-3 p-2 ${colorMap.yellow.bgLight} rounded-lg`}>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Need ${toFund.toFixed(2)} more to reach budget
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>{percentageSpent.toFixed(0)}% spent</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${colorMap[status.color].bg} transition-all duration-300`}
            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
          />
        </div>
      </div>

      {/* Notes */}
      {allocation.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {allocation.notes}
        </p>
      )}

      {/* Click to View Hint */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          Click to view transactions →
        </p>
      </div>

    </div>
  );
}