import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  date: string;
  account: string;
}

// Mock data - will be replaced with WatermelonDB
const mockTransactions: Transaction[] = [
  { id: '1', title: 'Grocery Shopping', amount: -125.50, category: 'Groceries', categoryIcon: 'cart', categoryColor: '#10B981', date: '2026-01-13', account: 'Checking' },
  { id: '2', title: 'Monthly Rent', amount: -1500.00, category: 'Housing', categoryIcon: 'home', categoryColor: '#3B82F6', date: '2026-01-12', account: 'Checking' },
  { id: '3', title: 'Salary Deposit', amount: 5200.00, category: 'Salary', categoryIcon: 'cash', categoryColor: '#10B981', date: '2026-01-10', account: 'Checking' },
  { id: '4', title: 'Uber Ride', amount: -28.50, category: 'Transportation', categoryIcon: 'car', categoryColor: '#F59E0B', date: '2026-01-09', account: 'Credit Card' },
  { id: '5', title: 'Restaurant Dinner', amount: -85.00, category: 'Dining Out', categoryIcon: 'restaurant', categoryColor: '#EF4444', date: '2026-01-09', account: 'Credit Card' },
  { id: '6', title: 'Electric Bill', amount: -145.00, category: 'Utilities', categoryIcon: 'flash', categoryColor: '#8B5CF6', date: '2026-01-08', account: 'Checking' },
  { id: '7', title: 'Freelance Payment', amount: 850.00, category: 'Freelance', categoryIcon: 'briefcase', categoryColor: '#10B981', date: '2026-01-07', account: 'Checking' },
];

export default function TransactionsScreen() {
  const [transactions] = useState<Transaction[]>(mockTransactions);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => (
    <Animated.View
      entering={FadeInRight.delay(index * 50)}
      layout={Layout.springify()}
    >
      <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
        <View style={[styles.categoryIcon, { backgroundColor: item.categoryColor + '20' }]}>
          <Ionicons name={item.categoryIcon as any} size={20} color={item.categoryColor} />
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionMeta}>
            {item.category} • {item.account}
          </Text>
        </View>

        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            item.amount > 0 ? styles.income : styles.expense
          ]}>
            {item.amount > 0 ? '+' : ''}{item.amount.toFixed(2)}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <Text style={styles.searchPlaceholder}>Search transactions...</Text>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
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
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#9CA3AF',
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  transactionMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
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
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  separator: {
    height: 8,
  },
});
