import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * CategoryModal Component
 * 
 * Modal for creating or editing categories
 * Includes icon picker and color selector
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onSave - Callback to save category (receives formData and categoryId)
 * @param {Object} category - Category object if editing (null if creating new)
 */
export default function CategoryModal({ isOpen, onClose, onSave, category }) {
  // Form state - holds all input values
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: '',
    color: '#3B82F6',
  });

  // Icon search state
  const [iconSearch, setIconSearch] = useState('');

  // Validation errors - keyed by field name
  const [errors, setErrors] = useState({});

  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available Lucide icons for categories
  const availableIcons = [
    'DollarSign', 'CreditCard', 'Wallet', 'Banknote', 'Coins', 'PiggyBank', 'TrendingUp', 'TrendingDown',
    'ShoppingCart', 'ShoppingBag', 'Store', 'Tag', 'Gift', 'Package', 'Shirt', 'Watch',
    'Coffee', 'UtensilsCrossed', 'Pizza', 'Apple', 'Soup', 'Wine', 'Beer', 'IceCream2',
    'Car', 'Bus', 'Plane', 'Train', 'Bike', 'Ship', 'Fuel', 'ParkingCircle',
    'Home', 'Building', 'Lightbulb', 'Sofa', 'Bed', 'Warehouse', 'Factory', 'Building2',
    'Heart', 'Stethoscope', 'Pill', 'Syringe', 'Hospital', 'Ambulance', 'Activity', 'Thermometer',
    'Film', 'Music', 'Gamepad2', 'Tv', 'Radio', 'Camera', 'Video', 'Headphones',
    'BookOpen', 'GraduationCap', 'Briefcase', 'FileText', 'Laptop', 'PenTool', 'Calculator', 'Glasses',
    'Zap', 'Droplet', 'Flame', 'Wifi', 'Phone', 'Mail', 'Globe', 'Settings',
    'Dumbbell', 'HeartPulse', 'Trophy', 'Target', 'Medal', 'Footprints',
    'Star', 'Bell', 'Calendar', 'Clock', 'MapPin', 'Smartphone', 'Printer', 'Scissors',
    'Wrench', 'Hammer', 'Paintbrush', 'Palette', 'TreePine', 'Flower2', 'Sun', 'Moon', 'Shield', 'Repeat',
  ];

  /**
   * Effect: Populate form when editing existing category
   * Runs when modal opens or category changes
   */
  useEffect(() => {
    if (isOpen && category) {
      // Editing existing category - populate form
      setFormData({
        name: category.name || '',
        type: category.type || 'expense',
        icon: category.icon || '',
        color: category.color || '#3B82F6',
      });
      setErrors({});
    } else if (isOpen) {
      // Creating new category - reset form
      setFormData({
        name: '',
        type: 'expense',
        icon: '',
        color: '#3B82F6',
      });
      setErrors({});
    }
  }, [isOpen, category]);

  /**
   * Effect: Close modal on Escape key press
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
   * @returns {boolean} True if valid, false otherwise
   */
  const validate = () => {
    const newErrors = {};

    // Name is required
    if (!formData.name?.trim()) {
      newErrors.name = 'Category name is required';
    }

    // Icon is required
    if (!formData.icon) {
      newErrors.icon = 'Please select an icon';
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

    // Validate before submitting
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Prepare payload for API
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        icon: formData.icon,
        color: formData.color,
      };

      // Call parent's save handler
      await onSave(payload, category?.id);

      // Close modal on success
      onClose();
    } catch (error) {
      // Show error message from API
      setErrors({
        submit: error.response?.data?.error || 'Failed to save category'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {category ? 'Edit Category' : 'Add Category'}
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

          {/* Category Name & Type */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Category Name */}
            <div>
              <label className="label">Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Groceries"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category Type */}
            <div>
              <label className="label">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          {/* Icon Picker */}
          <div className="mb-4">
            <label className="label">Icon *</label>

            {/* Search Icons */}
            <div className="mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search icons..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="input pl-9 text-sm"
                />
              </div>
            </div>

            {/* Icon Grid */}
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-800">
              <div className="grid grid-cols-6 gap-2">
                {availableIcons
                  .filter(iconName =>
                    iconSearch === '' ||
                    iconName.toLowerCase().includes(iconSearch.toLowerCase())
                  )
                  .slice(0, 80)
                  .map((iconName) => {
                    const IconComponent = LucideIcons[iconName];

                    if (!IconComponent) return null;

                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-3 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center h-12 w-12 ${
                          formData.icon === iconName ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : 'bg-white dark:bg-gray-700'
                        }`}
                        title={iconName}
                      >
                        <IconComponent className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Selected Icon Preview */}
            {formData.icon && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Selected:</span>
                {(() => {
                  const IconComponent = LucideIcons[formData.icon];
                  return IconComponent ? <IconComponent className="w-6 h-6" style={{ color: formData.color }} /> : null;
                })()}
                <span className="font-medium">{formData.icon}</span>
              </div>
            )}

            {errors.icon && (
              <p className="text-xs text-red-600 mt-1">{errors.icon}</p>
            )}
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="label">Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{formData.color}</span>

              {/* Preview */}
              {formData.icon && (
                <div
                  className="ml-4 p-3 rounded-lg"
                  style={{ backgroundColor: formData.color + '20' }}
                >
                  {(() => {
                    const IconComponent = LucideIcons[formData.icon];
                    return IconComponent ? <IconComponent className="w-6 h-6" style={{ color: formData.color }} /> : null;
                  })()}
                </div>
              )}
            </div>
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
              {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
