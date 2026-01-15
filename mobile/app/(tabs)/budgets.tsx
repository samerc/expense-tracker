import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

interface Allocation {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  allocated_amount: number;
  available_amount: number;
  spent_amount: number;
  balance: number;
}

export default function BudgetsScreen() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(new Date());

  const fetchAllocations = async () => {
    try {
      const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const response = await api.get('/allocations', { params: { month: monthStr } });
      setAllocations(response.data.allocations || []);
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [month]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllocations();
  }, [month]);

  const changeMonth = (direction: number) => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setMonth(newMonth);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getProgress = (allocation: Allocation) => {
    if (allocation.available_amount === 0) return 0;
    return Math.min((allocation.spent_amount / allocation.available_amount) * 100, 100);
  };

  const getProgressColor = (allocation: Allocation) => {
    const progress = getProgress(allocation);
    if (progress >= 100) return '#EF4444';
    if (progress >= 80) return '#F59E0B';
    return '#10B981';
  };

  const getCategoryIcon = (icon: string): any => {
    const iconMap: Record<string, string> = {
      'shopping-cart': 'cart',
      'home': 'home',
      'car': 'car',
      'utensils': 'restaurant',
      'bolt': 'flash',
      'gamepad': 'game-controller',
      'heart': 'heart',
      'briefcase': 'briefcase',
      'gift': 'gift',
      'wallet': 'wallet',
    };
    return iconMap[icon] || 'ellipse';
  };

  const totalAvailable = allocations.reduce((sum, a) => sum + a.available_amount, 0);
  const totalSpent = allocations.reduce((sum, a) => sum + a.spent_amount, 0);
  const totalRemaining = totalAvailable - totalSpent;

  const renderAllocation = ({ item }: { item: Allocation }) => {
    const progress = getProgress(item);
    const progressColor = getProgressColor(item);
    const remaining = item.available_amount - item.spent_amount;

    return (
      <TouchableOpacity style={styles.allocationItem}>
        <View style={styles.allocationHeader}>
          <View style={styles.allocationInfo}>
            <View style={styles.categoryIcon}>
              <Ionicons name={getCategoryIcon(item.category_icon)} size={20} color="#6B7280" />
            </View>
            <Text style={styles.categoryName}>{item.category_name}</Text>
          </View>
          <Text style={[styles.remainingAmount, remaining < 0 && styles.overBudget]}>
            ${remaining.toFixed(2)}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: progressColor },
              ]}
            />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.spentText}>${item.spent_amount.toFixed(2)} spent</Text>
            <Text style={styles.budgetedText}>of ${item.available_amount.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budgets</Text>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
          <Ionicons name="chevron-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{formatMonth(month)}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
          <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Budgeted</Text>
          <Text style={styles.summaryAmount}>${totalAvailable.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={[styles.summaryAmount, styles.spentAmount]}>${totalSpent.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryAmount, totalRemaining < 0 && styles.overBudget]}>
            ${totalRemaining.toFixed(2)}
          </Text>
        </View>
      </View>

      <FlatList
        data={allocations}
        renderItem={renderAllocation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No budgets set</Text>
            <Text style={styles.emptySubtext}>Set up budgets on the web app</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthNavButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  spentAmount: {
    color: '#EF4444',
  },
  listContent: {
    padding: 20,
  },
  allocationItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  allocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  overBudget: {
    color: '#EF4444',
  },
  progressContainer: {},
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  spentText: {
    fontSize: 13,
    color: '#6B7280',
  },
  budgetedText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
