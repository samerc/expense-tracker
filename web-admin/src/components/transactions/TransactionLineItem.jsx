import { RefreshCw, Trash2, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react';
import CategorySelect from '../common/CategorySelect';

/**
 * TransactionLineItem Component
 *
 * Renders a single line item within a multi-line transaction form
 * Handles account selection, amount, category, direction, and exchange rates
 */
// Supported currencies by Frankfurter API
const SUPPORTED_CURRENCIES = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
  'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK',
  'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
];

export default function TransactionLineItem({
  line,
  index,
  accounts,
  categories,
  baseCurrency,
  onUpdate,
  onRemove,
  canRemove,
  onExchangeRateRefresh,
  isLoadingRate,
  errors = {},
}) {
  // Get error for a specific field
  const getError = (field) => errors[`lines.${index}.${field}`];

  // Check if exchange rate is needed (different currency than base)
  const needsExchangeRate = line.currency && line.currency !== baseCurrency;

  // Check if auto-fetch is supported for this currency pair
  const canAutoFetch = needsExchangeRate &&
    SUPPORTED_CURRENCIES.includes(line.currency) &&
    SUPPORTED_CURRENCIES.includes(baseCurrency);

  // Rate mode: 'normal' = line.currency to base, 'inverted' = base to line.currency
  const rateMode = line.rateMode || 'normal';

  // Calculate base currency amount based on rate mode
  const baseAmount = (() => {
    const amount = parseFloat(line.amount) || 0;
    const rate = parseFloat(line.exchangeRate) || 1;
    if (rateMode === 'inverted') {
      // Rate is "1 base = X foreign", so divide
      return amount / rate;
    }
    // Rate is "1 foreign = X base", so multiply
    return amount * rate;
  })();

  // Format currency for display
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
      {/* Line Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Line {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Remove line"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row 1: Account & Amount */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="label">Account *</label>
          <select
            value={line.accountId}
            onChange={(e) => onUpdate(index, 'accountId', e.target.value)}
            className={`input ${getError('accountId') ? 'border-red-500' : ''}`}
          >
            <option value="">Select account</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </select>
          {getError('accountId') && (
            <p className="text-xs text-red-600 mt-1">{getError('accountId')}</p>
          )}
        </div>

        <div>
          <label className="label">Amount *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={line.amount}
            onChange={(e) => onUpdate(index, 'amount', e.target.value)}
            placeholder="0.00"
            className={`input ${getError('amount') ? 'border-red-500' : ''}`}
          />
          {getError('amount') && (
            <p className="text-xs text-red-600 mt-1">{getError('amount')}</p>
          )}
        </div>
      </div>

      {/* Row 2: Category & Direction */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="label">Category *</label>
          <CategorySelect
            categories={categories}
            value={line.categoryId}
            onChange={(value) => onUpdate(index, 'categoryId', value)}
            placeholder="Select category"
            error={getError('categoryId')}
            groupByType={true}
          />
          {getError('categoryId') && (
            <p className="text-xs text-red-600 mt-1">{getError('categoryId')}</p>
          )}
        </div>

        <div>
          <label className="label">Type *</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => onUpdate(index, 'direction', 'expense')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border transition-colors ${
                line.direction === 'expense'
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span className="text-sm">Expense</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdate(index, 'direction', 'income')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border transition-colors ${
                line.direction === 'income'
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span className="text-sm">Income</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Exchange Rate (only if different currency) */}
      {needsExchangeRate && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-700 dark:text-blue-400">
                {rateMode === 'normal' ? (
                  <>1 <strong>{line.currency}</strong> = ? <strong>{baseCurrency}</strong></>
                ) : (
                  <>1 <strong>{baseCurrency}</strong> = ? <strong>{line.currency}</strong></>
                )}
              </span>
              <button
                type="button"
                onClick={() => onUpdate(index, 'rateMode', rateMode === 'normal' ? 'inverted' : 'normal')}
                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                title="Switch rate direction"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
            {!canAutoFetch && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Manual entry required
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="label">
                Exchange Rate *
                <span className="text-xs font-normal text-gray-500 ml-1">
                  ({rateMode === 'normal'
                    ? `${line.currency} → ${baseCurrency}`
                    : `${baseCurrency} → ${line.currency}`})
                </span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={line.exchangeRate}
                  onChange={(e) => onUpdate(index, 'exchangeRate', e.target.value)}
                  placeholder={rateMode === 'inverted' ? 'e.g., 89500' : '1.0'}
                  className={`input flex-1 ${getError('exchangeRate') ? 'border-red-500' : ''}`}
                />
                {canAutoFetch && (
                  <button
                    type="button"
                    onClick={() => onExchangeRateRefresh(index)}
                    disabled={isLoadingRate}
                    className="btn btn-secondary px-3"
                    title="Fetch current rate"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingRate ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
              {getError('exchangeRate') && (
                <p className="text-xs text-red-600 mt-1">{getError('exchangeRate')}</p>
              )}
            </div>
            <div className="text-right">
              <label className="label">Base Amount</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(baseAmount, baseCurrency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Row 4: Notes (optional) */}
      <div>
        <label className="label">Notes</label>
        <input
          type="text"
          value={line.notes || ''}
          onChange={(e) => onUpdate(index, 'notes', e.target.value)}
          placeholder="Optional notes for this line..."
          className="input"
        />
      </div>
    </div>
  );
}
