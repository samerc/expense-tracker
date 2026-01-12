import { Calendar } from 'lucide-react';

/**
 * DateRangePicker Component
 * 
 * Simple date range picker for filtering reports
 * Provides preset ranges (This Month, Last Month, etc.) and custom range
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {Function} onStartDateChange - Callback when start date changes
 * @param {Function} onEndDateChange - Callback when end date changes
 * @param {Function} onPresetSelect - Callback when preset is selected
 */
export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  onPresetSelect 
}) {
  
  /**
   * Format date to YYYY-MM-DD
   */
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Get last day of month
   */
  const getLastDayOfMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  /**
   * Handle preset button clicks
   */
  const handleThisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const start = formatDate(new Date(year, month, 1));
    const lastDay = getLastDayOfMonth(year, month);
    const end = formatDate(new Date(year, month, lastDay));
    
    onPresetSelect({ start, end });
  };

  const handleLastMonth = () => {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    
    const start = formatDate(new Date(year, month, 1));
    const lastDay = getLastDayOfMonth(year, month);
    const end = formatDate(new Date(year, month, lastDay));
    
    onPresetSelect({ start, end });
  };

  const handleLast3Months = () => {
    const now = new Date();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();
    
    // Go back 3 months for start
    let startYear = endYear;
    let startMonth = endMonth - 2;
    if (startMonth < 0) {
      startMonth += 12;
      startYear -= 1;
    }
    
    const start = formatDate(new Date(startYear, startMonth, 1));
    const lastDay = getLastDayOfMonth(endYear, endMonth);
    const end = formatDate(new Date(endYear, endMonth, lastDay));
    
    onPresetSelect({ start, end });
  };

  const handleLast6Months = () => {
    const now = new Date();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();
    
    // Go back 6 months for start
    let startYear = endYear;
    let startMonth = endMonth - 5;
    if (startMonth < 0) {
      startMonth += 12;
      startYear -= 1;
    }
    
    const start = formatDate(new Date(startYear, startMonth, 1));
    const lastDay = getLastDayOfMonth(endYear, endMonth);
    const end = formatDate(new Date(endYear, endMonth, lastDay));
    
    onPresetSelect({ start, end });
  };

  const handleThisYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    
    const start = formatDate(new Date(year, 0, 1));
    const end = formatDate(new Date(year, 11, 31));
    
    onPresetSelect({ start, end });
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Date Range</h3>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleThisMonth}
          className="btn btn-secondary text-xs"
        >
          This Month
        </button>
        <button
          onClick={handleLastMonth}
          className="btn btn-secondary text-xs"
        >
          Last Month
        </button>
        <button
          onClick={handleLast3Months}
          className="btn btn-secondary text-xs"
        >
          Last 3 Months
        </button>
        <button
          onClick={handleLast6Months}
          className="btn btn-secondary text-xs"
        >
          Last 6 Months
        </button>
        <button
          onClick={handleThisYear}
          className="btn btn-secondary text-xs"
        >
          This Year
        </button>
      </div>

      {/* Custom Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label text-xs">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="input text-sm"
          />
        </div>
        <div>
          <label className="label text-xs">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="input text-sm"
          />
        </div>
      </div>

      {/* Display current selection */}
      <div className="mt-3 text-xs text-gray-600 text-center">
        Showing: {startDate} to {endDate}
      </div>
    </div>
  );
}