import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { ChevronDown, Search } from 'lucide-react';

/**
 * CategorySelect Component
 *
 * A custom dropdown that renders category icons properly
 * Unlike native <select>, this can display Lucide icons
 * Uses portal to render dropdown outside modal containers
 */
export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Select category',
  error,
  disabled = false,
  groupByType = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected category
  const selectedCategory = categories.find(c => c.id === value);

  // Filter categories by search (exclude system categories)
  const filteredCategories = categories.filter(c =>
    c.type !== 'system' && c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group categories by type if needed
  const expenseCategories = filteredCategories.filter(c => c.type === 'expense');
  const incomeCategories = filteredCategories.filter(c => c.type === 'income');

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 320; // approximate max height

      // Position below if enough space, otherwise above
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownPosition({
        top: showAbove ? rect.top - dropdownHeight : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        showAbove,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  // Get icon component
  const getIcon = (iconName, className = 'w-4 h-4') => {
    if (!iconName) return null;
    const IconComponent = LucideIcons[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  // Render a category option
  const renderOption = (category) => (
    <button
      key={category.id}
      type="button"
      onClick={() => {
        onChange(category.id);
        setIsOpen(false);
        setSearch('');
      }}
      className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        value === category.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
      }`}
    >
      <span
        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: category.color ? `${category.color}20` : '#e5e7eb' }}
      >
        {getIcon(category.icon, 'w-4 h-4')}
      </span>
      <span className="truncate">{category.name}</span>
    </button>
  );

  // Dropdown content
  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Options list */}
      <div className="overflow-y-auto max-h-60">
        {groupByType ? (
          <>
            {/* Expense categories */}
            {expenseCategories.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 uppercase sticky top-0">
                  Expense
                </div>
                {expenseCategories.map(renderOption)}
              </div>
            )}

            {/* Income categories */}
            {incomeCategories.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 uppercase sticky top-0">
                  Income
                </div>
                {incomeCategories.map(renderOption)}
              </div>
            )}
          </>
        ) : (
          filteredCategories.map(renderOption)
        )}

        {filteredCategories.length === 0 && (
          <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No categories found
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Selected value button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`input w-full flex items-center justify-between ${
          error ? 'border-red-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center space-x-3 truncate">
          {selectedCategory ? (
            <>
              <span
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: selectedCategory.color ? `${selectedCategory.color}20` : '#e5e7eb' }}
              >
                {getIcon(selectedCategory.icon, 'w-4 h-4')}
              </span>
              <span className="truncate">{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Render dropdown in portal to escape modal overflow */}
      {createPortal(dropdownContent, document.body)}
    </div>
  );
}
