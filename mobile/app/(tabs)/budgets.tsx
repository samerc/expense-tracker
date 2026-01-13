import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Budget {
  id: string;
  category: string;
  icon: string;
  color: string;
  allocated: number;
  spent: number;
}

// Mock data - will be replaced with WatermelonDB
const budgets: Budget[] = [
  { id: '1', category: 'Groceries', icon: 'cart', color: '#10B981', allocated: 500, spent: 325 },
  { id: '2', category: 'Dining Out', icon: 'restaurant', color: '#F59E0B', allocated: 200, spent: 185 },
  { id: '3', category: 'Transportation', icon: 'car', color: '#3B82F6', allocated: 300, spent: 145 },
  { id: '4', category: 'Entertainment', icon: 'film', color: '#8B5CF6', allocated: 150, spent: 50 },
  { id: '5', category: 'Utilities', icon: 'flash', color: '#EF4444', allocated: 200, spent: 200 },
  { id: '6', category: 'Shopping', icon: 'bag', color: '#EC4899', allocated: 250, spent: 312 },
];

export default function BudgetsScreen() {
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budgets</Text>
        <TouchableOpacity style={styles.monthSelector}>
          <Text style={styles.monthText}>January 2026</Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Allocated</Text>
            <Text style={styles.summaryAmount}>${totalAllocated.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryAmount, styles.spentAmount]}>${totalSpent.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryAmount, totalRemaining < 0 ? styles.negative : styles.positive]}>
              ${Math.abs(totalRemaining).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Budget List */}
      <View style={styles.budgetList}>
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.allocated) * 100;
          const remaining = budget.allocated - budget.spent;
          const isOverBudget = remaining < 0;

          return (
            <TouchableOpacity key={budget.id} style={styles.budgetItem} activeOpacity={0.7}>
              <View style={styles.budgetHeader}>
                <View style={[styles.budgetIcon, { backgroundColor: budget.color + '20' }]}>
                  <Ionicons name={budget.icon as any} size={20} color={budget.color} />
                </View>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetCategory}>{budget.category}</Text>
                  <Text style={styles.budgetMeta}>
                    ${budget.spent} of ${budget.allocated}
                  </Text>
                </View>
                <View style={styles.budgetRight}>
                  <Text style={[styles.remainingAmount, isOverBudget && styles.negative]}>
                    {isOverBudget ? '-' : ''}${Math.abs(remaining)}
                  </Text>
                  <Text style={styles.remainingLabel}>
                    {isOverBudget ? 'over' : 'left'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isOverBudget ? '#EF4444' : percentage > 80 ? '#F59E0B' : budget.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  monthText: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  spentAmount: {
    color: '#6B7280',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  budgetList: {
    padding: 20,
    gap: 12,
  },
  budgetItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  budgetMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  remainingLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
