import { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { categoriesAPI } from '../../services/api';
import * as LucideIcons from 'lucide-react';

export default function CategorySpendingModal({ isOpen, onClose, categoryId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'
  const [months, setMonths] = useState(12);

  useEffect(() => {
    if (isOpen && categoryId) {
      fetchData();
    }
  }, [isOpen, categoryId, months]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoriesAPI.getSpendingHistory(categoryId, months);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load spending data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getIcon = (iconName) => {
    if (!iconName) return null;
    const IconComponent = LucideIcons[iconName];
    return IconComponent ? <IconComponent className="w-6 h-6" /> : null;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-lg font-bold" style={{ color: data?.category?.color || '#3B82F6' }}>
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {payload[0].payload.transactionCount} transaction{payload[0].payload.transactionCount !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {data?.category && (
              <>
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: data.category.color ? `${data.category.color}20` : '#e5e7eb' }}
                >
                  {getIcon(data.category.icon)}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {data.category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {data.category.type === 'income' ? 'Income History' : 'Spending History'}
                  </p>
                </div>
              </>
            )}
            {loading && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Loading...
              </h3>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Controls */}
              <div className="flex items-center justify-between mb-6">
                {/* Chart type toggle */}
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      chartType === 'bar'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Bar</span>
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      chartType === 'line'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Line</span>
                  </button>
                </div>

                {/* Time range */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <select
                    value={months}
                    onChange={(e) => setMonths(parseInt(e.target.value))}
                    className="input py-1.5 text-sm"
                  >
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                    <option value={24}>Last 24 months</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    {data.category.type === 'income' ? 'Total Earned' : 'Total Spent'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.stats.total)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Monthly Avg</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.stats.average)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Highest Month</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.stats.max)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Active Months</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {data.stats.monthsWithSpending} / {months}
                  </p>
                </div>
              </div>

              {/* Chart */}
              {data.stats.total === 0 ? (
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {data.category.type === 'income' ? 'No income data yet' : 'No spending data yet'}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                      Create some {data.category.type} transactions for this category to see the chart
                    </p>
                  </div>
                </div>
              ) : (
              <div className="w-full overflow-x-auto">
                {chartType === 'bar' ? (
                  <BarChart width={700} height={300} data={data.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="total"
                      fill={data.category.color || '#3B82F6'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <LineChart width={700} height={300} data={data.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke={data.category.color || '#3B82F6'}
                      strokeWidth={2}
                      dot={{ fill: data.category.color || '#3B82F6', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
