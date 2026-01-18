import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useDatabase } from '../../src/context/DatabaseContext';
import { getTotalBalance } from '../../src/database/repositories/accountsRepository';
import { getAllTransactions, getMonthlyTotals, Transaction } from '../../src/database/repositories/transactionsRepository';

export default function HomeScreen() {
  const { userProfile, networkState, isPremium } = useDatabase();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const fetchData = async () => {
    try {
      // Fetch total balance from local database
      const balance = await getTotalBalance();
      setTotalBalance(balance);

      // Fetch recent transactions from local database
      const transactions = await getAllTransactions({ limit: 5 });
      setRecentTransactions(transactions);

      // Get monthly totals
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const totals = await getMonthlyTotals(currentMonth);
      setMonthlyIncome(totals.income);
      setMonthlyExpense(totals.expense);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTransactionAmount = (transaction: Transaction) => {
    return transaction.lines?.reduce((sum, line) => {
      return sum + (line.direction === 'expense' ? -Math.abs(line.amount) : Math.abs(line.amount));
    }, 0) || 0;
  };

  const getIconName = (transaction: Transaction): any => {
    const icon = transaction.lines?.[0]?.category?.icon;
    const iconMap: Record<string, string> = {
      'shopping-cart': 'cart',
      'ShoppingCart': 'cart',
      'home': 'home',
      'Home': 'home',
      'car': 'car',
      'Car': 'car',
      'utensils': 'restaurant',
      'UtensilsCrossed': 'restaurant',
      'bolt': 'flash',
      'Zap': 'flash',
      'gamepad': 'game-controller',
      'Gamepad2': 'game-controller',
      'heart': 'heart',
      'Heart': 'heart',
      'briefcase': 'briefcase',
      'Briefcase': 'briefcase',
      'gift': 'gift',
      'Gift': 'gift',
      'wallet': 'wallet',
      'Wallet': 'wallet',
      'DollarSign': 'cash',
      'CreditCard': 'card',
      'Banknote': 'cash',
    };
    return iconMap[icon || ''] || 'cash';
  };

  // Get sync status icon
  const getSyncIcon = () => {
    if (!isPremium) {
      return { name: 'cloud-offline' as const, color: '#9CA3AF' }; // Gray - offline mode
    }
    if (!networkState?.isConnected) {
      return { name: 'cloud-offline' as const, color: '#F59E0B' }; // Yellow - no connection
    }
    return { name: 'cloud-done' as const, color: '#10B981' }; // Green - synced
  };

  const syncIcon = getSyncIcon();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
          </View>
          <View style={styles.syncStatus}>
            <Ionicons name={syncIcon.name} size={20} color={syncIcon.color} />
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${totalBalance.toLocaleString()}</Text>

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

        {/* Offline mode banner */}
        {!isPremium && (
          <View style={styles.offlineBanner}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text style={styles.offlineBannerText}>
              Offline mode - Upgrade to sync across devices
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No recent transactions</Text>
              </View>
            ) : (
              recentTransactions.map((transaction) => {
                const amount = getTransactionAmount(transaction);
                return (
                  <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <Ionicons name={getIconName(transaction)} size={20} color="#6B7280" />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle}>{transaction.title}</Text>
                      <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                    </View>
                    <Text style={[styles.transactionAmount, amount > 0 && styles.income]}>
                      {amount > 0 ? '+' : ''}${Math.abs(amount).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, backgroundColor: '#fff',
  },
  greeting: { fontSize: 14, color: '#6B7280' },
  userName: { fontSize: 20, fontWeight: '600', color: '#111827' },
  syncStatus: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: '#3B82F6', marginHorizontal: 20, marginTop: 20,
    borderRadius: 20, padding: 24,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  incomeExpenseRow: { flexDirection: 'row', marginTop: 24, gap: 16 },
  incomeExpenseItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, gap: 12,
  },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  incomeExpenseLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  incomeAmount: { color: '#fff', fontSize: 16, fontWeight: '600' },
  expenseAmount: { color: '#fff', fontSize: 16, fontWeight: '600' },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 13,
    color: '#3B82F6',
    flex: 1,
  },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  seeAll: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  transactionsList: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  transactionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  transactionDetails: { flex: 1, marginLeft: 12 },
  transactionTitle: { fontSize: 16, fontWeight: '500', color: '#111827' },
  transactionDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: '600', color: '#111827' },
  income: { color: '#10B981' },
  emptyTransactions: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
});
