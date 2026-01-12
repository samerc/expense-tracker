import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * AllocationModal Component
 * 
 * Modal for creating or editing an allocation
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSave - Callback to save allocation
 * @param {Object} allocation - Allocation being edited (null for new)
 * @param {Array} categories - Available categories to allocate
 * @param {string} month - Current month (YYYY-MM-01)
 */
export default function AllocationModal({ isOpen, onClose, onSave, allocation, categories, month }) {
  const [formData, setFormData] = useState({
    categoryId: '',
    allocatedAmount: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Effect: Populate form when allocation changes
   */
  useEffect(() => {
    if (isOpen) {
      if (allocation) {
        // Edit mode
        setFormData({
          categoryId: allocation.category_id,
          allocatedAmount: allocation.allocated_amount,
          notes: allocation.notes || '',
        });
      } else {
        // Create mode
        setFormData({
          categoryId: '',
          allocatedAmount: '',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, allocation]);

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
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.categoryId && !allocation) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.allocatedAmount || isNaN(parseFloat(formData.allocatedAmount))) {
      newErrors.allocatedAmount = 'Valid amount is required';
    } else if (parseFloat(formData.allocatedAmount) < 0) {
      newErrors.allocatedAmount = 'Amount must be positive';
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
      await onSave({
        ...formData,
        categoryId: allocation ? allocation.category_id : formData.categoryId,
        month,
      });
      onClose();
    } catch (err) {
      setErrors({
        submit: err.response?.data?.error || 'Failed to save allocation'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Get selected category for display
  const selectedCategory = allocation 
    ? { id: allocation.category_id, name: allocation.category_name, icon: allocation.icon, color: allocation.color }
    : categories?.find(c => c.id === formData.categoryId);

  const IconComponent = selectedCategory?.icon ? LucideIcons[selectedCategory.icon] : LucideIcons.Tag;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {allocation ? 'Edit Allocation' : 'New Allocation'}
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

          {/* Month Display */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Allocation for <strong>{new Date(month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</strong>
            </p>
          </div>

          {/* Category (only for new allocation) */}
          {!allocation && (
            <div className="mb-4">
              <label className="label">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className={`input ${errors.categoryId ? 'border-red-500' : ''}`}
                autoFocus={!allocation}
              >
                <option value="">Select a category</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-red-600 mt-1">{errors.categoryId}</p>
              )}
            </div>
          )}

          {/* Category Display (for edit) */}
          {allocation && selectedCategory && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedCategory.color + '20' }}
                >
                  <IconComponent
                    className="w-5 h-5"
                    style={{ color: selectedCategory.color }}
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedCategory.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                </div>
              </div>
            </div>
          )}

          {/* Allocated Amount */}
          <div className="mb-4">
            <label className="label flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Allocated Amount</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.allocatedAmount}
              onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
              className={`input ${errors.allocatedAmount ? 'border-red-500' : ''}`}
              placeholder="0.00"
              autoFocus={!!allocation}
            />
            {errors.allocatedAmount && (
              <p className="text-xs text-red-600 mt-1">{errors.allocatedAmount}</p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="label">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              placeholder="Add notes about this allocation..."
              rows={3}
            />
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
              {isSubmitting ? 'Saving...' : 'Save Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
