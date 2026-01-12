import { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { categoriesAPI, exchangeRateAPI } from '../../services/api';
import * as LucideIcons from 'lucide-react';
import TransactionLineItem from './TransactionLineItem';

// Helper to create empty line
const createEmptyLine = () => ({
  id: crypto.randomUUID(),
  accountId: '',
  amount: '',
  currency: '',
  direction: 'expense',
  categoryId: '',
  exchangeRate: '1',
  rateMode: 'inverted', // Default to inverted (1 USD = X foreign) for easier entry
  notes: '',
});

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  accounts,
  categories,
  onCategoryCreated,
  user,
  userFeatures,
  baseCurrency = 'USD',
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    lines: [createEmptyLine()],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState({});

  // Inline category creation state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense',
    icon: '',
    color: '#3B82F6',
  });
  const [iconSearch, setIconSearch] = useState('');

  // Popular icons for categories
  const availableIcons = [
    'DollarSign', 'CreditCard', 'Wallet', 'Banknote', 'Coins', 'PiggyBank', 'TrendingUp', 'TrendingDown',
    'ShoppingCart', 'ShoppingBag', 'Store', 'Tag', 'Gift', 'Package', 'Shirt', 'Watch',
    'Coffee', 'UtensilsCrossed', 'Pizza', 'Apple', 'Soup', 'Wine', 'Beer', 'IceCream',
    'Car', 'Bus', 'Plane', 'Train', 'Bike', 'Ship', 'Fuel', 'ParkingCircle',
    'Home', 'Building', 'Lightbulb', 'Sofa', 'Bed', 'Warehouse', 'Factory', 'Building2',
    'Heart', 'Stethoscope', 'Pill', 'Syringe', 'Hospital', 'Ambulance', 'Thermometer',
    'Film', 'Music', 'Gamepad2', 'Tv', 'Radio', 'Camera', 'Video', 'Headphones',
    'BookOpen', 'GraduationCap', 'Briefcase', 'FileText', 'Laptop', 'PenTool', 'Calculator', 'Glasses',
    'Zap', 'Droplet', 'Flame', 'Wifi', 'Phone', 'Mail', 'Globe', 'Settings',
    'Dumbbell', 'HeartPulse', 'Trophy', 'Target', 'Medal', 'Activity', 'Footprints',
    'Star', 'Bell', 'Calendar', 'Clock', 'MapPin', 'Smartphone', 'Printer', 'Scissors',
    'Wrench', 'Hammer', 'Paintbrush', 'Palette', 'TreePine', 'Flower2', 'Sun', 'Moon',
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !transaction) {
      // New transaction
      setFormData({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        lines: [createEmptyLine()],
      });
      setErrors({});
    } else if (isOpen && transaction?.lines?.length > 0) {
      // Edit existing transaction
      setFormData({
        date: transaction.date.split('T')[0],
        title: transaction.title || '',
        description: transaction.description || '',
        lines: transaction.lines.map((line) => ({
          id: line.id || crypto.randomUUID(),
          accountId: line.accountId || '',
          amount: Math.abs(line.amount || 0).toString(),
          currency: line.currency || baseCurrency,
          direction: line.direction || 'expense',
          categoryId: line.categoryId || '',
          exchangeRate: (line.exchangeRateToBase || 1).toString(),
          rateMode: 'normal', // Stored rates are in "foreign to base" format
          notes: line.notes || '',
        })),
      });
      setErrors({});
    }
  }, [isOpen, transaction, baseCurrency]);

  // Line management functions
  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, createEmptyLine()],
    }));
  };

  const removeLine = (index) => {
    if (formData.lines.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const updateLine = (index, field, value) => {
    setFormData((prev) => {
      const newLines = [...prev.lines];
      newLines[index] = { ...newLines[index], [field]: value };

      // Auto-set currency when account changes
      if (field === 'accountId' && value) {
        const account = accounts?.find((a) => a.id === value);
        if (account) {
          newLines[index].currency = account.currency;
          // Fetch exchange rate if different from base
          if (account.currency !== baseCurrency) {
            fetchExchangeRate(index, account.currency);
          } else {
            newLines[index].exchangeRate = '1';
          }
        }
      }

      // Auto-set direction when category changes
      if (field === 'categoryId' && value) {
        const allCategories = categories?.categories || categories || [];
        const category = allCategories.find((c) => c.id === value);
        if (category?.type) {
          newLines[index].direction = category.type; // 'income' or 'expense'
        }
      }

      return { ...prev, lines: newLines };
    });
  };

  // Supported currencies by Frankfurter API
  const supportedCurrencies = [
    'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
    'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK',
    'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
  ];

  // Fetch exchange rate from API
  const fetchExchangeRate = async (lineIndex, fromCurrency = null) => {
    // If no currency passed, get it from the line (for refresh button)
    const currency = fromCurrency || formData.lines[lineIndex]?.currency;
    if (!currency || currency === baseCurrency) return;

    // Check if currencies are supported by the API
    if (!supportedCurrencies.includes(currency) || !supportedCurrencies.includes(baseCurrency)) {
      // Currency not supported - user will need to enter manually
      return;
    }

    setIsLoadingRates((prev) => ({ ...prev, [lineIndex]: true }));

    try {
      const response = await exchangeRateAPI.getRate(currency, baseCurrency);
      const rate = response.data.rates[baseCurrency];

      setFormData((prev) => {
        const newLines = [...prev.lines];
        newLines[lineIndex] = {
          ...newLines[lineIndex],
          exchangeRate: rate.toString(),
        };
        return { ...prev, lines: newLines };
      });
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Keep the current rate on error - user can enter manually
    } finally {
      setIsLoadingRates((prev) => ({ ...prev, [lineIndex]: false }));
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let income = 0;
    let expense = 0;

    formData.lines.forEach((line) => {
      const amount = parseFloat(line.amount) || 0;
      const rate = parseFloat(line.exchangeRate) || 1;
      // Calculate base amount based on rate mode
      const baseAmount = line.rateMode === 'inverted' && rate !== 0
        ? amount / rate
        : amount * rate;

      if (line.direction === 'income') {
        income += baseAmount;
      } else {
        expense += baseAmount;
      }
    });

    return { income, expense, net: income - expense };
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.title?.trim()) newErrors.title = 'Title is required';

    formData.lines.forEach((line, index) => {
      if (!line.accountId) {
        newErrors[`lines.${index}.accountId`] = 'Account is required';
      }
      if (!line.amount || parseFloat(line.amount) <= 0) {
        newErrors[`lines.${index}.amount`] = 'Valid amount is required';
      }
      if (!line.categoryId) {
        newErrors[`lines.${index}.categoryId`] = 'Category is required';
      }
      if (line.currency && line.currency !== baseCurrency) {
        if (!line.exchangeRate || parseFloat(line.exchangeRate) <= 0) {
          newErrors[`lines.${index}.exchangeRate`] = 'Valid exchange rate is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        date: formData.date,
        title: formData.title,
        description: formData.description || null,
        lines: formData.lines.map((line) => {
          const enteredRate = parseFloat(line.exchangeRate) || 1;
          // Convert rate to "1 foreign = X base" format for API
          // If inverted mode (1 base = X foreign), we need to invert: 1/rate
          const rateToBase = line.rateMode === 'inverted' && enteredRate !== 0
            ? 1 / enteredRate
            : enteredRate;

          return {
            accountId: line.accountId,
            amount: parseFloat(line.amount) * (line.direction === 'expense' ? -1 : 1),
            currency: line.currency || baseCurrency,
            direction: line.direction,
            categoryId: line.categoryId || null,
            exchangeRate: rateToBase,
            notes: line.notes || null,
          };
        }),
      };

      await onSave(payload, transaction?.id);
      onClose();
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Failed to save transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle inline category creation
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;

    setIsCreatingCategory(true);
    try {
      const response = await categoriesAPI.create({
        name: newCategory.name,
        type: newCategory.type,
        icon: newCategory.icon || null,
        color: newCategory.color,
      });

      setNewCategory({ name: '', type: 'expense', icon: '', color: '#3B82F6' });
      setShowNewCategory(false);

      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (error) {
      alert('Failed to create category: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!isOpen) return null;

  const allCategories = categories?.categories || [];
  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Date and Title */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`input ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Restaurant dinner"
                className={`input ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>
          </div>

          {/* Transaction Lines */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Transaction Lines</label>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Plus className="w-4 h-4" />
                <span>Add Split</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.lines.map((line, index) => (
                <TransactionLineItem
                  key={line.id}
                  line={line}
                  index={index}
                  accounts={accounts}
                  categories={allCategories}
                  baseCurrency={baseCurrency}
                  onUpdate={updateLine}
                  onRemove={removeLine}
                  canRemove={formData.lines.length > 1}
                  onExchangeRateRefresh={fetchExchangeRate}
                  isLoadingRate={isLoadingRates[index]}
                  errors={errors}
                />
              ))}
            </div>

            {/* Create Category Link */}
            {(user?.role === 'admin' || userFeatures?.create_categories === true) && (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Create New Category
              </button>
            )}

            {/* Inline Category Creation */}
            {showNewCategory && (
              <div className="mt-3 p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create New Category</span>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Name *</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Tips"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Type *</label>
                    <select
                      value={newCategory.type}
                      onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                      className="input"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search icons..."
                          value={iconSearch}
                          onChange={(e) => setIconSearch(e.target.value)}
                          className="input pl-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-800">
                      <div className="grid grid-cols-6 gap-1">
                        {availableIcons
                          .filter((iconName) =>
                            iconSearch === '' || iconName.toLowerCase().includes(iconSearch.toLowerCase())
                          )
                          .slice(0, 48)
                          .map((iconName) => {
                            const IconComponent = LucideIcons[iconName];
                            if (!IconComponent) return null;
                            return (
                              <button
                                key={iconName}
                                type="button"
                                onClick={() => setNewCategory({ ...newCategory, icon: iconName })}
                                className={`p-1 hover:bg-white dark:hover:bg-gray-700 rounded flex items-center justify-center h-6 w-6 ${
                                  newCategory.icon === iconName
                                    ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                                    : 'bg-white dark:bg-gray-700'
                                }`}
                                title={iconName}
                              >
                                <IconComponent className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label">Color</label>
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="input h-10"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name || isCreatingCategory}
                  className="btn btn-primary w-full text-sm"
                >
                  {isCreatingCategory ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
              className="input"
            />
          </div>

          {/* Summary */}
          {formData.lines.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    +{formatCurrency(totals.income, baseCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Expense</p>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                    -{formatCurrency(totals.expense, baseCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Net</p>
                  <p className={`text-lg font-semibold ${totals.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net, baseCurrency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
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
              {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
