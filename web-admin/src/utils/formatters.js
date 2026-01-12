import { format } from 'date-fns';

/**
 * Format currency with thousand separators
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD', decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `$0.00`;
  }

  const number = parseFloat(amount);
  
  // Format with Intl.NumberFormat for proper locale formatting
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);

  return formatted;
}

/**
 * Format number with thousand separators (no currency symbol)
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(number, decimals = 0) {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(parseFloat(number));
}

/**
 * Format date in a readable format
 * @param {string|Date} date - The date to format
 * @param {string} formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date string
 */
export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return format(dateObj, formatStr);
}

/**
 * Format percentage
 * @param {number} value - The percentage value (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${parseFloat(value).toFixed(decimals)}%`;
}