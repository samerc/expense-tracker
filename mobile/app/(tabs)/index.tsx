import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Sync with server
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Mock data - will be replaced with WatermelonDB queries
  const totalBalance = 12450.0;
  const monthlyIncome = 5200.0;
  const monthlyExpense = 3100.0;

  const recentTransactions = [
    { id: '1', title: 'Groceries', amount: -85.5, category: 'Groceries', icon: 'cart', date: 'Today' },
    { id: '2', title: 'Gas Station', amount: -45.0, category: 'Transportation', icon: 'car', date: 'Today' },
    { id: '3', title: 'Salary', amount: 2600.0, category: 'Income', icon: 'cash', date: 'Yesterday' },
    { id: '4', title: 'Netflix', amount: -15.99, category: 'Subscriptions', icon: 'tv', date: 'Yesterday' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <View style={styles.syncStatus}>
          <Ionicons name="cloud-done" size={20} color="#10B981" />
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>

        <View style={styles.incomeExpenseRow}>
          <View style={styles.incomeExpenseItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-down" size={16} color="#10B981" />
            </View>
            <View>
              <Text style={styles.incomeExpenseLabel}>Income</Text>
              <Text style={styles.incomeAmount}>+${monthlyIncome.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.incomeExpenseItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="arrow-up" size={16} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.incomeExpenseLabel}>Expense</Text>
              <Text style={styles.expenseAmount}>-${monthlyExpense.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>

        <View style={styles.transactionsList}>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Ionicons name={transaction.icon as any} size={20} color="#6B7280" />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionCategory}>{transaction.date}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.amount > 0 ? styles.income : styles.expense,
                ]}
              >
                {transaction.amount > 0 ? '+' : ''}
                ${Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  syncStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
  },
  incomeExpenseItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeExpenseLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  incomeAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  expenseAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  transactionsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  transactionCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  income: {
    color: '#10B981',
  },
  expense: {
    color: '#111827',
  },
});
