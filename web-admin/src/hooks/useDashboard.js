import { useQuery } from '@tanstack/react-query';
import { reportsAPI, accountsAPI, transactionsAPI, subscriptionAPI } from '../services/api';

export function useDashboard() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Fetch dashboard summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', currentMonth, currentYear],
    queryFn: async () => {
      const response = await reportsAPI.getDashboard({
        month: currentMonth,
        year: currentYear
      });
      return response.data;
    },
  });

  // Fetch all accounts with balances
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsAPI.getAll();
      return response.data;
    },
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const response = await transactionsAPI.getAll({
        limit: 5,
        offset: 0
      });
      return response.data;
    },
  });

 /* // Fetch subscription info
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await subscriptionAPI.getCurrent();
      return response.data;
    },
  });*/

  // Fetch usage limits
  /*const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const response = await subscriptionAPI.getUsage();
      return response.data;
    },
  });*/

  return {
    summary,
    accounts: accounts?.accounts || [],
    recentTransactions: recentTransactions?.transactions || [],
  //  subscription,
  //  usage,
    isLoading: summaryLoading || accountsLoading || transactionsLoading //|| subscriptionLoading || usageLoading,
  };
}
