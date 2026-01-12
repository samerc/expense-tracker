import { useState } from 'react';
import { Edit2, Trash2, MoreVertical, BarChart3 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * CategoriesList Component
 *
 * Displays categories grouped by type (Income/Expense)
 * Shows icon, name, color, and action buttons
 *
 * @param {Object} categories - Categories grouped by type { income: [], expense: [] }
 * @param {Function} onEdit - Callback when edit button is clicked
 * @param {Function} onDelete - Callback when delete button is clicked
 * @param {Function} onViewSpending - Callback when view spending is clicked
 */
export default function CategoriesList({ categories, onEdit, onDelete, onViewSpending }) {
  // Track which category's menu is open (by category ID)
  const [menuOpen, setMenuOpen] = useState(null);

  // Check if there are any categories
  const hasCategories = (categories?.income?.length > 0) || (categories?.expense?.length > 0);

  // Show empty state if no categories
  if (!hasCategories) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No categories yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add your first category to get started</p>
      </div>
    );
  }

  /**
   * Render a single category item
   * @param {Object} category - Category object
   * @returns {JSX.Element}
   */
  const renderCategory = (category) => {
    // Get the Lucide icon component by name
    const IconComponent = LucideIcons[category.icon];

    return (
      <div
        key={category.id}
        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all bg-white dark:bg-gray-800"
        style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
      >
        {/* Category Info */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Icon & Color Background */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: category.color + '20', color: category.color }}
          >
            {/* Render Lucide icon if available, otherwise show emoji fallback */}
            {IconComponent ? (
              <IconComponent className="w-6 h-6" />
            ) : (
              <span className="text-2xl">{category.icon}</span>
            )}
          </div>

          {/* Name & Type */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{category.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{category.type}</p>
          </div>
        </div>

        {/* Color Badge & Actions */}
        <div className="flex items-center space-x-3">
          {/* Color Dot (no hex code displayed) */}
          <div
            className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-gray-600"
            style={{ backgroundColor: category.color }}
            title={category.color} // Show hex code on hover
          />

          {/* Actions Menu - Don't show for system categories */}
          {category.type !== 'system' && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(menuOpen === category.id ? null : category.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {menuOpen === category.id && (
                <>
                  {/* Backdrop to close menu when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(null)}
                  />

                  {/* Menu Items */}
                  <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    {(category.type === 'expense' || category.type === 'income') && onViewSpending && (
                      <button
                        onClick={() => {
                          onViewSpending(category);
                          setMenuOpen(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>View {category.type === 'income' ? 'Income' : 'Spending'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onEdit(category);
                        setMenuOpen(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${category.name}"? This cannot be undone.`)) {
                          onDelete(category.id);
                        }
                        setMenuOpen(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Expense Categories */}
      {categories?.expense && categories.expense.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
            <span className="text-red-600 dark:text-red-400">💸</span>
            <span className="ml-2">Expense Categories</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({categories.expense.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.expense.map(renderCategory)}
          </div>
        </div>
      )}

      {/* Income Categories */}
      {categories?.income && categories.income.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
            <span className="text-green-600 dark:text-green-400">💰</span>
            <span className="ml-2">Income Categories</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({categories.income.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.income.map(renderCategory)}
          </div>
        </div>
      )}
    </div>
  );
}