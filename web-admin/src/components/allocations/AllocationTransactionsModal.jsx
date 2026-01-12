import { useState, useEffect } from 'react';
import { X, Receipt, Calendar, DollarSign } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * AllocationTransactionsModal Component
 * 
 * Modal showing all transactions linked to an allocation envelope
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Object} allocation - The allocation to show transactions for
 * @param {Array} transactions - List of transactions for this allocation
 */
export default function AllocationTransactionsModal({ isOpen, onClose, allocation, transactions }) {

  /**
   * Effect: Close on Escape key
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !allocation) return null;

  const IconComponent = LucideIcons[allocation.icon] || LucideIcons.Tag;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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
              <h3 className="text-lg font-semibold text-gray-900">
                {allocation.category_name} Transactions
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(allocation.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Envelope Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-600">Available</p>
              <p className="text-lg font-bold text-gray-900">
                ${parseFloat(allocation.available_amount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Spent</p>
              <p className="text-lg font-bold text-red-600">
                ${parseFloat(allocation.spent_amount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Balance</p>
              <p className={`text-lg font-bold ${allocation.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(parseFloat(allocation.balance)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Receipt className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {transaction.description || 'Untitled Transaction'}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                        {transaction.account_name && (
                          <>
                            <span>•</span>
                            <span>{transaction.account_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-red-600">
                      -${parseFloat(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Expenses in this category will appear here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {transactions?.length || 0} transaction{transactions?.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="btn btn-secondary text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
