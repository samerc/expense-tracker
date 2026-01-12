import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * BudgetModal Component
 * 
 * Modal for creating or editing budgets
 * Allows selecting category, amount, and month
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSave - Callback to save budget (receives formData and budgetId)
 * @param {Object} budget - Budget object if editing (null if creating new)
 * @param {Array} categories - Available expense categories
 */
export default function BudgetModal({ isOpen, onClose, onSave, budget, categories }) {
  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    planned_amount: '',
    month: new Date().toISOString().slice(0, 7), // Format: YYYY-MM
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Effect: Populate form when editing existing budget
   */
  useEffect(() => {
    if (isOpen && budget) {
      // Editing existing budget
      setFormData({
        category_id: budget.category_id || '',
        planned_amount: budget.planned_amount?.toString() || '',
        month: budget.month || new Date().toISOString().slice(0, 7),
      });
      setErrors({});
    } else if (isOpen) {
      // Creating new budget - reset form
      setFormData({
        category_id: '',
        planned_amount: '',
        month: new Date().toISOString().slice(0, 7),
      });
      setErrors({});
    }
  }, [isOpen, budget]);

  /**
   * Effect: Close modal on Escape key
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
   * Validate form inputs
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.planned_amount || parseFloat(formData.planned_amount) <= 0) {
      newErrors.planned_amount = 'Valid budget amount is required';
    }

    if (!formData.month) {
      newErrors.month = 'Month is required';
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
      const payload = {
        category_id: formData.category_id,
        planned_amount: parseFloat(formData.planned_amount),
        month: formData.month,
      };

      await onSave(payload, budget?.id);
      onClose();
    } catch (error) {
      setErrors({
        submit: error.response?.data?.error || 'Failed to save budget'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {budget ? 'Edit Budget' : 'Create Budget'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Category Selection */}
          <div className="mb-4">
            <label className="label">Category *</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className={`input ${errors.category_id ? 'border-red-500' : ''}`}
              disabled={!!budget} // Can't change category when editing
            >
              <option value="">Select category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-red-600 mt-1">{errors.category_id}</p>
            )}
            {budget && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Category cannot be changed when editing
              </p>
            )}
          </div>

          {/* Budget Amount */}
          <div className="mb-4">
            <label className="label">Budget Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.planned_amount}
              onChange={(e) => setFormData({ ...formData, planned_amount: e.target.value })}
              placeholder="0.00"
              className={`input ${errors.planned_amount ? 'border-red-500' : ''}`}
              autoFocus
            />
            {errors.planned_amount && (
              <p className="text-xs text-red-600 mt-1">{errors.planned_amount}</p>
            )}
          </div>

          {/* Month */}
          <div className="mb-6">
            <label className="label">Month *</label>
            <input
              type="month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className={`input ${errors.month ? 'border-red-500' : ''}`}
            />
            {errors.month && (
              <p className="text-xs text-red-600 mt-1">{errors.month}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Budget will apply to the selected month
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              {isSubmitting ? 'Saving...' : budget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}