import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * FundIncomeModal Component
 * 
 * Modal for allocating income across envelopes
 * Shows unallocated funds and allows distribution
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onFund - Callback to fund allocations
 * @param {Array} allocations - All allocations for the month
 * @param {number} unallocatedFunds - Total unallocated income
 */
export default function FundIncomeModal({ isOpen, onClose, onFund, allocations, unallocatedFunds }) {
  const [funding, setFunding] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Effect: Initialize funding amounts
   */
  useEffect(() => {
    if (isOpen && allocations) {
      const initial = {};
      allocations.forEach(alloc => {
        const toFund = parseFloat(alloc.allocated_amount) - parseFloat(alloc.available_amount);
        initial[alloc.id] = toFund > 0 ? toFund.toFixed(2) : '';
      });
      setFunding(initial);
      setErrors({});
    }
  }, [isOpen, allocations]);

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

  /**
   * Calculate total to allocate
   */
  const totalToAllocate = Object.values(funding).reduce((sum, val) => {
    const num = parseFloat(val) || 0;
    return sum + num;
  }, 0);

  const remaining = unallocatedFunds - totalToAllocate;

  /**
   * Handle input change
   */
  const handleChange = (allocationId, value) => {
    setFunding({ ...funding, [allocationId]: value });
    setErrors({});
  };

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (totalToAllocate > unallocatedFunds) {
      newErrors.submit = `Cannot allocate $${totalToAllocate.toFixed(2)} - only $${unallocatedFunds.toFixed(2)} available`;
    }

    if (totalToAllocate === 0) {
      newErrors.submit = 'Please allocate at least some funds';
    }

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
      // Build funding array
      const fundingArray = Object.entries(funding)
        .filter(([_, amount]) => parseFloat(amount) > 0)
        .map(([allocationId, amount]) => ({
          allocationId,
          amount: parseFloat(amount)
        }));

      await onFund(fundingArray);
      onClose();
    } catch (err) {
      setErrors({
        submit: err.response?.data?.error || 'Failed to fund allocations'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Fund Envelopes
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Allocate your income across budget envelopes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Available to Allocate</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                ${unallocatedFunds.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 dark:text-gray-400">Allocating</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ${totalToAllocate.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
              <p className={`text-lg font-semibold ${remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${Math.abs(remaining).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          
          {/* Error Message */}
          {errors.submit && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Allocations List */}
          <div className="px-6 py-4 space-y-3">
            {allocations?.map((allocation) => {
              const IconComponent = LucideIcons[allocation.icon] || LucideIcons.Tag;
              const toFund = parseFloat(allocation.allocated_amount) - parseFloat(allocation.available_amount);

              return (
                <div key={allocation.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  {/* Category Icon & Name */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: allocation.color + '20' }}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: allocation.color }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {allocation.category_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Budgeted: ${parseFloat(allocation.allocated_amount).toFixed(2)} | 
                      Available: ${parseFloat(allocation.available_amount).toFixed(2)}
                      {toFund > 0 && (
                        <span className="text-yellow-600 ml-1">
                          (need ${toFund.toFixed(2)})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Amount Input */}
                  <div className="w-32 flex-shrink-0">
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={funding[allocation.id] || ''}
                        onChange={(e) => handleChange(allocation.id, e.target.value)}
                        className="input pl-7 text-right"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
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
              disabled={isSubmitting || remaining < 0}
            >
              {isSubmitting ? 'Allocating...' : `Allocate $${totalToAllocate.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}