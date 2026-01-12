import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function TransactionFilters({ filters, onFilterChange, accounts, categories }) {
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      startDate: '',
      endDate: '',
      accountId: '',
      categoryId: '',
      type: '',
    });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.accountId || filters.categoryId || filters.type;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${hasActiveFilters ? 'btn-primary' : 'btn-secondary'} flex items-center space-x-2`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 bg-white text-blue-600 rounded text-xs font-semibold">
              •
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Start Date */}
            <div>
              <label className="label">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="input"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="label">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="input"
              />
            </div>

            {/* Account */}
            <div>
              <label className="label">Account</label>
              <select
                value={filters.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                className="input"
              >
                <option value="">All Accounts</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                
                {/* Expense Categories Group */}
                <optgroup label="💸 Expenses">
                  {categories?.grouped?.expense?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
                
                {/* Income Categories Group */}
                <optgroup label="💰 Income">
                  {categories?.grouped?.income?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="label">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
