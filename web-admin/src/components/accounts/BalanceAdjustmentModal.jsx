import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * BalanceAdjustmentModal Component
 * 
 * Modal for adjusting account balance directly
 * Creates a special "Balance Adjustment" transaction
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSave - Callback to save adjustment
 * @param {Object} account - Account to adjust
 */
export default function BalanceAdjustmentModal({ isOpen, onClose, onSave, account }) {
  // Form state
  const [formData, setFormData] = useState({
    newBalance: '',
    reason: '',
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Effect: Reset form when modal opens
   */
  useEffect(() => {
    if (isOpen && account) {
      setFormData({
        newBalance: account.current_balance?.toString() || '0',
        reason: '',
      });
      setErrors({});
    }
  }, [isOpen, account]);

  /**
   * Validate form inputs
   * @returns {boolean} True if valid, false otherwise
   */
  const validate = () => {
    const newErrors = {};

    // New balance must be a valid number
    if (isNaN(parseFloat(formData.newBalance))) {
      newErrors.newBalance = 'Valid balance is required';
    }

    // Reason is required for audit trail
//    if (!formData.reason?.trim()) {
//      newErrors.reason = 'Description is required for balance adjustments';
//   }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const newBalance = parseFloat(formData.newBalance);

      // Prepare payload for API - backend expects newBalance and description
      const payload = {
        newBalance: newBalance,
        description: formData.reason.trim(),
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Adjustment error:', error);
            console.error('Error response:', error.response?.data); // ADD THIS

      setErrors({ 
        submit: error.response?.data?.error || 'Failed to adjust balance' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if not open
  if (!isOpen || !account) return null;

  // Calculate adjustment amount
  const newBalance = parseFloat(formData.newBalance) || 0;
  const currentBalance = parseFloat(account.current_balance) || 0;
  const adjustment = newBalance - currentBalance;
  const isIncrease = adjustment > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Adjust Balance
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          
          {/* Global Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Account Info */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Account</p>
            <p className="font-semibold text-gray-900">{account.name}</p>
            <p className="text-sm text-gray-600 mt-2 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentBalance, account.currency)}
            </p>
          </div>

          {/* New Balance */}
          <div className="mb-4">
            <label className="label">New Balance *</label>
            <input
              type="number"
              step="0.01"
              value={formData.newBalance}
              onChange={(e) => setFormData({ ...formData, newBalance: e.target.value })}
              placeholder="0.00"
              className={`input ${errors.newBalance ? 'border-red-500' : ''}`}
              autoFocus
            />
            {errors.newBalance && (
              <p className="text-xs text-red-600 mt-1">{errors.newBalance}</p>
            )}
          </div>

          {/* Adjustment Preview */}
          {adjustment !== 0 && !isNaN(adjustment) && (
            <div className={`mb-4 p-3 rounded-lg ${isIncrease ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center space-x-2">
                {isIncrease ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className={`text-sm font-medium ${isIncrease ? 'text-green-800' : 'text-red-800'}`}>
                    {isIncrease ? 'Increase' : 'Decrease'} by {formatCurrency(Math.abs(adjustment), account.currency)}
                  </p>
                  <p className={`text-xs ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                    A balance adjustment transaction will be created
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="mb-6">
            <label className="label">Description</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Correcting initial balance, reconciliation adjustment..."
              rows={3}
              className={`input resize-none ${errors.reason ? 'border-red-500' : ''}`}
            />
            {errors.reason && (
              <p className="text-xs text-red-600 mt-1">{errors.reason}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              This will be recorded in the transaction history
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || adjustment === 0}
            >
              {isSubmitting ? 'Adjusting...' : 'Adjust Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
