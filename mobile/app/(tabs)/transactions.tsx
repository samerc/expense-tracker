import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  Transaction,
} from '../../src/database/repositories/transactionsRepository';
import { getAllCategories, Category } from '../../src/database/repositories/categoriesRepository';
import { getAllAccounts, Account } from '../../src/database/repositories/accountsRepository';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'expense' | 'income'>('expense');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchTransactions = async () => {
    try {
      // Fetch more transactions to include older ones
      const data = await getAllTransactions({ limit: 200 });
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [catData, accData] = await Promise.all([
        getAllCategories(),
        getAllAccounts(),
      ]);
      setCategories(catData);
      setAccounts(accData);
    } catch (error) {
      console.error('Failed to fetch form data:', error);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      fetchFormData();
    }, [])
  );

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setActionModalVisible(true);
  };

  const openEditModal = () => {
    if (!selectedTransaction) return;
    const line = selectedTransaction.lines[0];
    setEditTitle(selectedTransaction.title);
    setEditDate(selectedTransaction.date.split('T')[0]);
    setEditAmount(Math.abs(line?.amount || 0).toString());
    setEditType(line?.direction === 'income' ? 'income' : 'expense');
    setEditCategoryId(line?.category_id || '');
    setEditAccountId(line?.account_id || '');
    setEditNotes(line?.notes || '');
    setActionModalVisible(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTransaction) return;
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!editAmount || parseFloat(editAmount) <= 0) {
      Alert.alert('Error', 'Valid amount is required');
      return;
    }

    setEditSaving(true);
    try {
      const selectedAccount = accounts.find((a) => a.id === editAccountId);
      await updateTransaction(selectedTransaction.id, {
        title: editTitle.trim(),
        date: editDate,
        lines: [{
          account_id: editAccountId,
          amount: parseFloat(editAmount),
          currency: selectedAccount?.currency || 'USD',
          direction: editType,
          category_id: editCategoryId || undefined,
          exchange_rate: 1,
          notes: editNotes.trim() || undefined,
        }],
      });
      Alert.alert('Success', 'Transaction updated');
      setEditModalVisible(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update transaction');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = () => {
    if (!selectedTransaction) return;
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${selectedTransaction.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(selectedTransaction.id);
              setActionModalVisible(false);
              setSelectedTransaction(null);
              fetchTransactions();
              Alert.alert('Success', 'Transaction deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
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
    return transaction.lines.reduce((sum, line) => {
      return sum + (line.direction === 'expense' ? -Math.abs(line.amount) : Math.abs(line.amount));
    }, 0);
  };

  const getIconName = (transaction: Transaction) => {
    const icon = transaction.lines[0]?.category?.icon;
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
    return iconMap[icon || ''] || 'cash';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const amount = getTransactionAmount(item);
    const isIncome = amount > 0;

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(item)}
      >
        <View style={styles.transactionIcon}>
          <Ionicons name={getIconName(item) as any} size={20} color="#6B7280" />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionCategory}>
            {item.lines[0]?.category?.name || 'Uncategorized'}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={[styles.transactionAmount, isIncome && styles.income]}>
          {isIncome ? '+' : ''}${Math.abs(amount).toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  const filteredCategories = categories.filter((c) => c.type === editType);

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
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Add your first transaction to get started</Text>
          </View>
        }
      />

      {/* Action Modal */}
      <Modal visible={actionModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>{selectedTransaction?.title}</Text>
              <Text style={styles.actionSheetSubtitle}>
                {selectedTransaction && formatDate(selectedTransaction.date)}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionItem} onPress={openEditModal}>
              <Ionicons name="pencil" size={22} color="#3B82F6" />
              <Text style={styles.actionItemText}>Edit Transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name="trash" size={22} color="#EF4444" />
              <Text style={[styles.actionItemText, styles.actionItemDanger]}>Delete Transaction</Text>
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

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.editModalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Transaction</Text>
            <TouchableOpacity onPress={handleSaveEdit} disabled={editSaving}>
              <Text style={[styles.editModalSave, editSaving && styles.editModalSaveDisabled]}>
                {editSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalContent}>
            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeButton, editType === 'expense' && styles.typeButtonExpense]}
                onPress={() => setEditType('expense')}
              >
                <Text style={[styles.typeButtonText, editType === 'expense' && styles.typeButtonTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, editType === 'income' && styles.typeButtonIncome]}
                onPress={() => setEditType('income')}
              >
                <Text style={[styles.typeButtonText, editType === 'income' && styles.typeButtonTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Transaction title"
              />
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* Account */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.chip, editAccountId === acc.id && styles.chipActive]}
                      onPress={() => setEditAccountId(acc.id)}
                    >
                      <Text style={[styles.chipText, editAccountId === acc.id && styles.chipTextActive]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, editCategoryId === cat.id && styles.categoryChipActive]}
                    onPress={() => setEditCategoryId(cat.id)}
                  >
                    <Text style={[styles.categoryChipText, editCategoryId === cat.id && styles.categoryChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Optional notes"
                multiline
                numberOfLines={3}
              />
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  income: {
    color: '#10B981',
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
  actionItemDanger: {
    color: '#EF4444',
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
  editModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editModalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editModalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  editModalSaveDisabled: {
    opacity: 0.5,
  },
  editModalContent: {
    flex: 1,
    padding: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonExpense: {
    backgroundColor: '#EF4444',
  },
  typeButtonIncome: {
    backgroundColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
});
