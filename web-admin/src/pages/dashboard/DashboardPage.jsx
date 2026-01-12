import { useDashboard } from '../../hooks/useDashboard';
import { LoadingSpinner } from '../../components/common';
import StatCard from '../../components/dashboard/StatCard';
import RecentTransactions from '../../components/dashboard/RecentTransactions';
import AccountsSummary from '../../components/dashboard/AccountsSummary';
import SubscriptionBadge from '../../components/dashboard/SubscriptionBadge';
import { Wallet, TrendingUp, TrendingDown, Receipt, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function DashboardPage() {
  const { summary, accounts, recentTransactions, subscription, usage, isLoading } = useDashboard();

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const totalBalance = summary?.totalBalance || 0;
  const income = summary?.income || 0;
  const expenses = summary?.expenses || 0;
  const netIncome = summary?.netIncome || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your financial activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          subtitle="Across all accounts"
          icon={Wallet}
          color="blue"
        />

        <StatCard
          title="This Month Income"
          value={formatCurrency(income)}
          subtitle="Total earnings"
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          title="This Month Expenses"
          value={formatCurrency(expenses)}
          subtitle="Total spending"
          icon={TrendingDown}
          color="red"
        />

        <StatCard
          title="Net Income"
          value={formatCurrency(netIncome)}
          subtitle="Income - Expenses"
          icon={ArrowUpDown}
          color={netIncome >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Transactions & Accounts */}
        <div className="lg:col-span-2 space-y-6">
          <RecentTransactions transactions={recentTransactions} />
          <AccountsSummary accounts={accounts} />
        </div>

        {/* Right Column - Subscription & Quick Actions */}
        <div className="space-y-6">
          <SubscriptionBadge subscription={subscription} usage={usage} />

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full btn btn-primary">
                Add Transaction
              </button>
              <button className="w-full btn btn-secondary">
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}