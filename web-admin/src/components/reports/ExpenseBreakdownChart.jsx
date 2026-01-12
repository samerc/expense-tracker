import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

/**
 * ExpenseBreakdownChart Component
 * 
 * Displays a pie chart of expenses by category
 * Shows percentage and amount for each category
 * 
 * @param {Array} data - Array of {name, value, color} objects
 * @param {string} currency - Currency code (e.g., 'USD')
 */
export default function ExpenseBreakdownChart({ data, currency = 'USD' }) {
  // Don't render if no data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No expense data available
      </div>
    );
  }

  /**
   * Custom tooltip for pie chart
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.value, currency)}
          </p>
          <p className="text-xs text-gray-500">
            {data.payload.percentage?.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  /**
   * Custom label for pie slices
   */
  const renderLabel = (entry) => {
    return `${entry.percentage?.toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry) => (
            <span className="text-sm">
              {value}: {formatCurrency(entry.payload.value, currency)}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
