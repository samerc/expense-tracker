import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * AccountModal Component
 * 
 * Modal for creating or editing accounts
 * Handles form validation and submission
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSave - Callback to save account (receives formData and accountId)
 * @param {Object} account - Account object if editing (null if creating new)
 */
export default function AccountModal({ isOpen, onClose, onSave, account }) {
  // Form state - holds all input values
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    currency: 'USD',
    initial_balance: '0',
    institution: '',
    account_number: '',
    notes: '',
  });

  // Validation errors - keyed by field name
  const [errors, setErrors] = useState({});
  
  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Effect: Populate form when editing existing account
   * Runs when modal opens or account changes
   */
  useEffect(() => {
    if (isOpen && account) {
      // Editing existing account - populate form
      setFormData({
        name: account.name || '',
        type: account.type || 'bank',
        currency: account.currency || 'USD',
        initial_balance: account.current_balance?.toString() || '0',
        institution: account.institution || '',
        account_number: account.account_number || '',
        notes: account.notes || '',
      });
      setErrors({});
    } else if (isOpen) {
      // Creating new account - reset form
      setFormData({
        name: '',
        type: 'bank',
        currency: 'USD',
        initial_balance: '0',
        institution: '',
        account_number: '',
        notes: '',
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

    // Name is required
    if (!formData.name?.trim()) {
      newErrors.name = 'Account name is required';
    }

    // Currency is required
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    // Initial balance must be a valid number
    if (isNaN(parseFloat(formData.initial_balance))) {
      newErrors.initial_balance = 'Valid balance is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Prepare payload for API
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        currency: formData.currency,
        initialBalance: parseFloat(formData.initial_balance), // Backend expects initialBalance (camelCase)
        institution: formData.institution?.trim() || null,
        account_number: formData.account_number?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

            console.log('Saving account:', payload, 'ID:', account?.id); // ADD THIS


      await onSave(payload, account?.id);
      onClose();
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.error || 'Failed to save account' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {account ? 'Edit Account' : 'Add Account'}
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

          {/* Global Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Account Name */}
          <div className="mb-4">
            <label className="label">Account Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Checking"
              className={`input ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Account Type & Currency */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            
            {/* Account Type */}
            <div>
              <label className="label">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                <option value="bank">Bank Account</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit Card</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="label">Currency *</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={`input ${errors.currency ? 'border-red-500' : ''}`}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="LBP">LBP (ل.ل)</option>
              </select>
              {errors.currency && (
                <p className="text-xs text-red-600 mt-1">{errors.currency}</p>
              )}
            </div>
          </div>

          {/* Initial Balance */}
          <div className="mb-4">
            <label className="label">
              {account ? 'Initial Balance' : 'Initial Balance *'}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.initial_balance}
              onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
              placeholder="0.00"
              disabled={!!account} // DISABLE when editing
              className={`input ${account ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''} ${errors.initial_balance ? 'border-red-500' : ''}`}
            />
            {errors.initial_balance && (
              <p className="text-xs text-red-600 mt-1">{errors.initial_balance}</p>
            )}
            {account ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Initial balance cannot be changed. Use transactions to update current balance.
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The starting balance for this account
              </p>
            )}
          </div>

          {/* Institution (Optional) */}
          <div className="mb-4">
            <label className="label">Institution (Optional)</label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="e.g., Chase Bank"
              className="input"
            />
          </div>

          {/* Account Number (Optional) */}
          <div className="mb-4">
            <label className="label">Account Number (Optional)</label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder="Last 4 digits: 1234"
              className="input"
            />
          </div>

          {/* Notes (Optional) */}
          <div className="mb-6">
            <label className="label">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information..."
              rows={3}
              className="input resize-none"
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
              {isSubmitting ? 'Saving...' : account ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
