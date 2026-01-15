import { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { superAdminAPI } from '../../services/api';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'LBP'];

export default function HouseholdModal({ isOpen, onClose, onSubmit, household, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    baseCurrency: 'USD',
    planId: '',
  });
  const [errors, setErrors] = useState({});

  // Fetch plans for dropdown
  const { data: plansData } = useQuery({
    queryKey: ['super-admin-plans'],
    queryFn: () => superAdminAPI.getAllPlans(),
    enabled: isOpen,
  });

  const plans = plansData?.data?.plans || [];

  useEffect(() => {
    if (household) {
      setFormData({
        name: household.name || '',
        baseCurrency: household.base_currency || 'USD',
        planId: household.plan_id || '',
      });
    } else {
      setFormData({
        name: '',
        baseCurrency: 'USD',
        planId: '',
      });
    }
    setErrors({});
  }, [household, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Household name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {household ? 'Edit Household' : 'Create Household'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Household Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter household name"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Base Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base Currency
            </label>
            <select
              value={formData.baseCurrency}
              onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
              className="input"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subscription Plan
            </label>
            <select
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              className="input"
            >
              <option value="">No Plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.display_name} (${plan.price_monthly}/mo)
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : household ? 'Save Changes' : 'Create Household'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
