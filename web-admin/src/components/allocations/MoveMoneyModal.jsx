import { useState, useEffect } from 'react';
import { X, ArrowRight, DollarSign } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * MoveMoneyModal Component
 * 
 * Modal for moving money between allocation envelopes
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onMove - Callback to move funds
 * @param {Array} allocations - All allocations for the month
 */
export default function MoveMoneyModal({ isOpen, onClose, onMove, allocations }) {
  const [formData, setFormData] = useState({
    fromAllocationId: '',
    toAllocationId: '',
    amount: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Effect: Reset form when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fromAllocationId: '',
        toAllocationId: '',
        amount: '',
      });
      setErrors({});
    }
  }, [isOpen]);

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
   * Get selected allocations
   */
  const fromAllocation = allocations?.find(a => a.id === formData.fromAllocationId);
  const toAllocation = allocations?.find(a => a.id === formData.toAllocationId);

  const fromBalance = fromAllocation 
    ? parseFloat(fromAllocation.available_amount) - parseFloat(fromAllocation.spent_amount)
    : 0;

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.fromAllocationId) {
      newErrors.from = 'Please select source envelope';
    }

    if (!formData.toAllocationId) {
      newErrors.to = 'Please select destination envelope';
    }

    if (formData.fromAllocationId === formData.toAllocationId) {
      newErrors.to = 'Cannot move to the same envelope';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Valid amount is required';
    } else if (amount > fromBalance) {
      newErrors.amount = `Insufficient funds (available: $${fromBalance.toFixed(2)})`;
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
      await onMove(
        formData.fromAllocationId,
        formData.toAllocationId,
        parseFloat(formData.amount)
      );
      onClose();
    } catch (err) {
      setErrors({
        submit: err.response?.data?.error || 'Failed to move funds'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Get allocations with available balance > 0
  const availableAllocations = allocations?.filter(a => {
    const balance = parseFloat(a.available_amount) - parseFloat(a.spent_amount);
    return balance > 0;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Move Money Between Envelopes
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

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* From Envelope */}
          <div className="mb-4">
            <label className="label">From Envelope</label>
            <select
              value={formData.fromAllocationId}
              onChange={(e) => {
                setFormData({ ...formData, fromAllocationId: e.target.value });
                setErrors({});
              }}
              className={`input ${errors.from ? 'border-red-500' : ''}`}
            >
              <option value="">Select source envelope</option>
              {availableAllocations.map((alloc) => {
                const balance = parseFloat(alloc.available_amount) - parseFloat(alloc.spent_amount);
                return (
                  <option key={alloc.id} value={alloc.id}>
                    {alloc.category_name} (${balance.toFixed(2)} available)
                  </option>
                );
              })}
            </select>
            {errors.from && (
              <p className="text-xs text-red-600 mt-1">{errors.from}</p>
            )}
          </div>

          {/* Arrow Visual */}
          <div className="flex justify-center mb-4">
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </div>

          {/* To Envelope */}
          <div className="mb-4">
            <label className="label">To Envelope</label>
            <select
              value={formData.toAllocationId}
              onChange={(e) => {
                setFormData({ ...formData, toAllocationId: e.target.value });
                setErrors({});
              }}
              className={`input ${errors.to ? 'border-red-500' : ''}`}
            >
              <option value="">Select destination envelope</option>
              {allocations?.map((alloc) => {
                const IconComponent = LucideIcons[alloc.icon] || LucideIcons.Tag;
                return (
                  <option key={alloc.id} value={alloc.id}>
                    {alloc.category_name}
                  </option>
                );
              })}
            </select>
            {errors.to && (
              <p className="text-xs text-red-600 mt-1">{errors.to}</p>
            )}
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="label flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Amount to Move</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                setErrors({});
              }}
              className={`input ${errors.amount ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-xs text-red-600 mt-1">{errors.amount}</p>
            )}
            {fromBalance > 0 && formData.fromAllocationId && (
              <p className="text-xs text-gray-500 mt-1">
                Available in source: ${fromBalance.toFixed(2)}
              </p>
            )}
          </div>

          {/* Preview */}
          {fromAllocation && toAllocation && formData.amount && !errors.amount && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-2">Preview:</p>
              <div className="text-xs text-blue-800 space-y-1">
                <p>
                  {fromAllocation.category_name}: ${fromBalance.toFixed(2)} → $
                  {(fromBalance - parseFloat(formData.amount)).toFixed(2)}
                </p>
                <p>
                  {toAllocation.category_name}: $
                  {(parseFloat(toAllocation.available_amount) - parseFloat(toAllocation.spent_amount)).toFixed(2)} → $
                  {(parseFloat(toAllocation.available_amount) - parseFloat(toAllocation.spent_amount) + parseFloat(formData.amount)).toFixed(2)}
                </p>
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Moving...' : 'Move Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
