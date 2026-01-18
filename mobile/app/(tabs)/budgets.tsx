import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { allocationsAPI } from '../../src/services/api';

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
  const [unallocated, setUnallocated] = useState(0);

  // Fund Modal State
  const [fundModalVisible, setFundModalVisible] = useState(false);
  const [fundAmounts, setFundAmounts] = useState<Record<string, string>>({});
  const [fundSaving, setFundSaving] = useState(false);

  // Move Money Modal State
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [moveFromId, setMoveFromId] = useState('');
  const [moveToId, setMoveToId] = useState('');
  const [moveAmount, setMoveAmount] = useState('');
  const [moveSaving, setMoveSaving] = useState(false);

  // Selected Allocation for actions
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const getMonthStr = () => {
    return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  };

  const fetchAllocations = async () => {
    try {
      const monthStr = getMonthStr();
      const allocRes = await allocationsAPI.getAll(monthStr);
      setAllocations(allocRes.data.allocations || []);
      // unallocatedFunds is returned in the main allocations response
      setUnallocated(allocRes.data.unallocatedFunds || 0);
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

  const openFundModal = () => {
    const initial: Record<string, string> = {};
    allocations.forEach((a) => {
      initial[a.id] = '';
    });
    setFundAmounts(initial);
    setFundModalVisible(true);
  };

  const handleFund = async () => {
    const funding = Object.entries(fundAmounts)
      .filter(([_, amount]) => amount && parseFloat(amount) > 0)
      .map(([allocationId, amount]) => ({
        allocationId,
        amount: parseFloat(amount),
      }));

    if (funding.length === 0) {
      Alert.alert('Error', 'Please enter at least one amount');
      return;
    }

    setFundSaving(true);
    try {
      await allocationsAPI.fund(getMonthStr(), funding);
      Alert.alert('Success', 'Budgets funded successfully');
      setFundModalVisible(false);
      fetchAllocations();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to fund budgets');
    } finally {
      setFundSaving(false);
    }
  };

  const openMoveModal = (fromAllocation?: Allocation) => {
    setMoveFromId(fromAllocation?.id || '');
    setMoveToId('');
    setMoveAmount('');
    setMoveModalVisible(true);
    setActionModalVisible(false);
  };

  const handleMove = async () => {
    if (!moveFromId || !moveToId) {
      Alert.alert('Error', 'Please select both source and destination');
      return;
    }
    if (moveFromId === moveToId) {
      Alert.alert('Error', 'Source and destination must be different');
      return;
    }
    if (!moveAmount || parseFloat(moveAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setMoveSaving(true);
    try {
      await allocationsAPI.move(moveFromId, moveToId, parseFloat(moveAmount));
      Alert.alert('Success', 'Money moved successfully');
      setMoveModalVisible(false);
      fetchAllocations();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to move money');
    } finally {
      setMoveSaving(false);
    }
  };

  const handleAllocationPress = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setActionModalVisible(true);
  };

  const renderAllocation = ({ item }: { item: Allocation }) => {
    const progress = getProgress(item);
    const progressColor = getProgressColor(item);
    const remaining = item.available_amount - item.spent_amount;

    return (
      <TouchableOpacity style={styles.allocationItem} onPress={() => handleAllocationPress(item)}>
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
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => openMoveModal()}>
            <Ionicons name="swap-horizontal" size={22} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={openFundModal}>
            <Ionicons name="add-circle" size={22} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Unallocated Banner */}
      {unallocated !== 0 && (
        <TouchableOpacity style={[styles.unallocatedBanner, unallocated < 0 && styles.unallocatedBannerNegative]} onPress={openFundModal}>
          <View>
            <Text style={styles.unallocatedLabel}>Ready to Assign</Text>
            <Text style={[styles.unallocatedAmount, unallocated < 0 && styles.unallocatedAmountNegative]}>
              ${unallocated.toFixed(2)}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={unallocated >= 0 ? '#10B981' : '#EF4444'} />
        </TouchableOpacity>
      )}

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

      {/* Allocation Action Modal */}
      <Modal visible={actionModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>{selectedAllocation?.category_name}</Text>
              <Text style={styles.actionSheetSubtitle}>
                ${(selectedAllocation?.available_amount || 0).toFixed(2)} available
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => selectedAllocation && openMoveModal(selectedAllocation)}
            >
              <Ionicons name="swap-horizontal" size={22} color="#3B82F6" />
              <Text style={styles.actionItemText}>Move Money From Here</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionItem, styles.actionItemCancel]}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.actionItemCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fund Modal */}
      <Modal visible={fundModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.fundModalContainer}>
          <View style={styles.fundModalHeader}>
            <TouchableOpacity onPress={() => setFundModalVisible(false)}>
              <Text style={styles.fundModalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.fundModalTitle}>Fund Categories</Text>
            <TouchableOpacity onPress={handleFund} disabled={fundSaving}>
              <Text style={[styles.fundModalSave, fundSaving && styles.fundModalSaveDisabled]}>
                {fundSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fundUnallocatedCard}>
            <Text style={styles.fundUnallocatedLabel}>Ready to Assign</Text>
            <Text style={[styles.fundUnallocatedAmount, unallocated < 0 && styles.negative]}>
              ${unallocated.toFixed(2)}
            </Text>
          </View>

          <ScrollView style={styles.fundModalContent}>
            {allocations.map((allocation) => (
              <View key={allocation.id} style={styles.fundItem}>
                <View style={styles.fundItemInfo}>
                  <Text style={styles.fundItemName}>{allocation.category_name}</Text>
                  <Text style={styles.fundItemAvailable}>
                    Available: ${allocation.available_amount.toFixed(2)}
                  </Text>
                </View>
                <TextInput
                  style={styles.fundItemInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={fundAmounts[allocation.id] || ''}
                  onChangeText={(text) =>
                    setFundAmounts((prev) => ({ ...prev, [allocation.id]: text }))
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Move Money Modal */}
      <Modal visible={moveModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.moveModalContainer}>
          <View style={styles.moveModalHeader}>
            <TouchableOpacity onPress={() => setMoveModalVisible(false)}>
              <Text style={styles.moveModalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.moveModalTitle}>Move Money</Text>
            <TouchableOpacity onPress={handleMove} disabled={moveSaving}>
              <Text style={[styles.moveModalSave, moveSaving && styles.moveModalSaveDisabled]}>
                {moveSaving ? 'Moving...' : 'Move'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.moveModalContent}>
            <View style={styles.moveInputGroup}>
              <Text style={styles.moveLabel}>Amount</Text>
              <TextInput
                style={styles.moveInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={moveAmount}
                onChangeText={setMoveAmount}
              />
            </View>

            <View style={styles.moveInputGroup}>
              <Text style={styles.moveLabel}>From</Text>
              <View style={styles.moveOptions}>
                {allocations.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.moveOption, moveFromId === a.id && styles.moveOptionActive]}
                    onPress={() => setMoveFromId(a.id)}
                  >
                    <Text style={[styles.moveOptionText, moveFromId === a.id && styles.moveOptionTextActive]}>
                      {a.category_name}
                    </Text>
                    <Text style={[styles.moveOptionAmount, moveFromId === a.id && styles.moveOptionTextActive]}>
                      ${a.available_amount.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.moveInputGroup}>
              <Text style={styles.moveLabel}>To</Text>
              <View style={styles.moveOptions}>
                {allocations.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.moveOption, moveToId === a.id && styles.moveOptionActive]}
                    onPress={() => setMoveToId(a.id)}
                  >
                    <Text style={[styles.moveOptionText, moveToId === a.id && styles.moveOptionTextActive]}>
                      {a.category_name}
                    </Text>
                    <Text style={[styles.moveOptionAmount, moveToId === a.id && styles.moveOptionTextActive]}>
                      ${a.available_amount.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  unallocatedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  unallocatedBannerNegative: {
    backgroundColor: '#FEE2E2',
  },
  unallocatedLabel: {
    fontSize: 13,
    color: '#065F46',
  },
  unallocatedAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  unallocatedAmountNegative: {
    color: '#EF4444',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  actionSheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  actionSheetSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  actionItemText: {
    fontSize: 16,
    color: '#111827',
  },
  actionItemCancel: {
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  actionItemCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  negative: {
    color: '#EF4444',
  },
  fundModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  fundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fundModalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  fundModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  fundModalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  fundModalSaveDisabled: {
    opacity: 0.5,
  },
  fundUnallocatedCard: {
    backgroundColor: '#3B82F6',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  fundUnallocatedLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  fundUnallocatedAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  fundModalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  fundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  fundItemInfo: {
    flex: 1,
  },
  fundItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  fundItemAvailable: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  fundItemInput: {
    width: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'right',
  },
  moveModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  moveModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  moveModalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  moveModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  moveModalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  moveModalSaveDisabled: {
    opacity: 0.5,
  },
  moveModalContent: {
    flex: 1,
    padding: 16,
  },
  moveInputGroup: {
    marginBottom: 20,
  },
  moveLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  moveInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moveOptions: {
    gap: 8,
  },
  moveOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moveOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  moveOptionText: {
    fontSize: 15,
    color: '#111827',
  },
  moveOptionAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  moveOptionTextActive: {
    color: '#fff',
  },
});
