import { useState, useEffect } from 'react';
import { X, DollarSign, Users, CheckCircle } from 'lucide-react';

/**
 * PlanModal Component
 * 
 * Modal for creating or editing subscription plans
 */
export default function PlanModal({ isOpen, onClose, onSave, plan }) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    priceMonthly: '',
    priceAnnual: '',
    maxUsers: '',
    maxAccounts: '',
    maxBudgets: '',
    features: {
      web_access: false,
      cloud_sync: false,
      advanced_reports: false,
      allocations: false,
      multi_currency: false,
      api_access: false,
    },
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Effect: Populate form when plan changes
   */
  useEffect(() => {
    if (isOpen) {
      if (plan) {
        // Always populate ALL features, using plan values or defaults
        setFormData({
          name: plan.name || '',
          displayName: plan.display_name || '',
          description: plan.description || '',
          priceMonthly: plan.price_monthly || '',
          priceAnnual: plan.price_annual || '',
          maxUsers: plan.max_users === -1 ? '' : plan.max_users || '',
          maxAccounts: plan.max_accounts === -1 ? '' : plan.max_accounts || '',
          maxBudgets: plan.max_budgets === -1 ? '' : plan.max_budgets || '',
          features: {
            web_access: plan.features?.web_access === true,
            cloud_sync: plan.features?.cloud_sync === true,
            advanced_reports: plan.features?.advanced_reports === true,
            allocations: plan.features?.allocations === true,
            multi_currency: plan.features?.multi_currency === true,
            api_access: plan.features?.api_access === true,
          },
          isActive: plan.is_active !== undefined ? plan.is_active : true,
        });
      } else {
        // New plan - reset to defaults
        setFormData({
          name: '',
          displayName: '',
          description: '',
          priceMonthly: '',
          priceAnnual: '',
          maxUsers: '',
          maxAccounts: '',
          maxBudgets: '',
          features: {
            web_access: false,
            cloud_sync: false,
            advanced_reports: false,
            allocations: false,
            multi_currency: false,
            api_access: false,
          },
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, plan]);

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

    if (!plan && !formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (formData.priceMonthly === '' || isNaN(parseFloat(formData.priceMonthly))) {
      newErrors.priceMonthly = 'Valid monthly price is required';
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
      const data = {
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        displayName: formData.displayName,
        description: formData.description || null,
        priceMonthly: parseFloat(formData.priceMonthly),
        priceAnnual: formData.priceAnnual ? parseFloat(formData.priceAnnual) : 0,
        maxUsers: formData.maxUsers === '' ? -1 : parseInt(formData.maxUsers),
        maxAccounts: formData.maxAccounts === '' ? -1 : parseInt(formData.maxAccounts),
        maxBudgets: formData.maxBudgets === '' ? -1 : parseInt(formData.maxBudgets),
        features: formData.features,
        isActive: formData.isActive,
      };

      await onSave(data);
      onClose();
    } catch (err) {
      setErrors({
        submit: err.response?.data?.error || 'Failed to save plan'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggle feature
   */
  const toggleFeature = (feature) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [feature]: !formData.features[feature]
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {plan ? 'Edit Plan' : 'Create New Plan'}
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
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            
            {/* Plan Name (only for new plans) */}
            {!plan && (
              <div className="col-span-2">
                <label className="label">Plan Name (Internal)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., pro, enterprise"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase, no spaces (will be auto-formatted)
                </p>
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>
            )}

            {/* Display Name */}
            <div className="col-span-2">
              <label className="label">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className={`input ${errors.displayName ? 'border-red-500' : ''}`}
                placeholder="e.g., Pro Plan"
              />
              {errors.displayName && (
                <p className="text-xs text-red-600 mt-1">{errors.displayName}</p>
              )}
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder="Brief description of the plan"
                rows={2}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Pricing</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.priceMonthly}
                  onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                  className={`input ${errors.priceMonthly ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
                {errors.priceMonthly && (
                  <p className="text-xs text-red-600 mt-1">{errors.priceMonthly}</p>
                )}
              </div>
              <div>
                <label className="label">Annual Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.priceAnnual}
                  onChange={(e) => setFormData({ ...formData, priceAnnual: e.target.value })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Usage Limits</span>
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Max Users</label>
                <input
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                  className="input"
                  placeholder="Unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
              </div>
              <div>
                <label className="label">Max Accounts</label>
                <input
                  type="number"
                  value={formData.maxAccounts}
                  onChange={(e) => setFormData({ ...formData, maxAccounts: e.target.value })}
                  className="input"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="label">Max Budgets</label>
                <input
                  type="number"
                  value={formData.maxBudgets}
                  onChange={(e) => setFormData({ ...formData, maxBudgets: e.target.value })}
                  className="input"
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Features</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.features.web_access}
                  onChange={() => toggleFeature('web_access')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Web Access</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.features.cloud_sync}
                  onChange={() => toggleFeature('cloud_sync')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Cloud Sync</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.features.advanced_reports}
                  onChange={() => toggleFeature('advanced_reports')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Advanced Reports</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.features.allocations}
                  onChange={() => toggleFeature('allocations')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Allocations</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.features.multi_currency}
                  onChange={() => toggleFeature('multi_currency')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Multi Currency</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.features.api_access}
                  onChange={() => toggleFeature('api_access')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">API Access</span>
              </label>
            </div>
          </div>

          {/* Active Status */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Plan is Active</span>
            </label>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}