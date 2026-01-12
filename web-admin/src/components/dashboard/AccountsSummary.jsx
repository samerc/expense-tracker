import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function AccountsSummary({ accounts }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Accounts</h2>
          <Link to="/accounts" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Manage
          </Link>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No accounts yet</p>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Accounts</h2>
        <Link to="/accounts" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          Manage
        </Link>
      </div>

      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Balance</p>
        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
          {formatCurrency(totalBalance)}
        </p>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Wallet className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {account.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {account.type}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(account.current_balance, account.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
