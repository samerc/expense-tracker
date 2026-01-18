import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { accountsAPI } from '../src/services/api';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution?: string;
  isActive: boolean;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking', icon: 'card' },
  { value: 'savings', label: 'Savings', icon: 'wallet' },
  { value: 'credit', label: 'Credit Card', icon: 'card-outline' },
  { value: 'cash', label: 'Cash', icon: 'cash' },
  { value: 'investment', label: 'Investment', icon: 'trending-up' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'LBP'];

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('checking');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.getAll();
      setAccounts(response.data.accounts || response.data || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAccounts();
  }, []);

  const resetForm = () => {
    setName('');
    setType('checking');
    setCurrency('USD');
    setBalance('');
    setInstitution('');
    setEditingAccount(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setCurrency(account.currency);
    setBalance(account.balance.toString());
    setInstitution(account.institution || '');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        type,
        currency,
        initialBalance: parseFloat(balance) || 0,
        institution: institution.trim() || null,
      };

      if (editingAccount) {
        await accountsAPI.update(editingAccount.id, data);
        Alert.alert('Success', 'Account updated successfully');
      } else {
        await accountsAPI.create(data);
        Alert.alert('Success', 'Account created successfully');
      }

      setModalVisible(false);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (account: Account) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await accountsAPI.delete(account.id);
              fetchAccounts();
              Alert.alert('Success', 'Account deleted');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const getAccountIcon = (accountType: string): any => {
    const found = ACCOUNT_TYPES.find((t) => t.value === accountType);
    return found?.icon || 'wallet';
  };

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const renderAccount = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.accountItem}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.accountIcon}>
        <Ionicons name={getAccountIcon(item.type)} size={24} color="#3B82F6" />
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{item.name}</Text>
        <Text style={styles.accountType}>
          {ACCOUNT_TYPES.find((t) => t.value === item.type)?.label || item.type}
          {item.institution ? ` • ${item.institution}` : ''}
        </Text>
      </View>
      <Text style={[styles.accountBalance, item.balance < 0 && styles.negative]}>
        {formatCurrency(item.balance, item.currency)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounts</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Total Balance Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalBalance, 'USD')}</Text>
      </View>

      {/* Accounts List */}
      <FlatList
        data={accounts}
        renderItem={renderAccount}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No accounts yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first account</Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingAccount ? 'Edit Account' : 'New Account'}
            </Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              <Text style={[styles.saveText, submitting && styles.disabledText]}>
                {submitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Main Checking"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.typeItem, type === t.value && styles.typeItemActive]}
                    onPress={() => setType(t.value)}
                  >
                    <Ionicons
                      name={t.icon as any}
                      size={20}
                      color={type === t.value ? '#fff' : '#6B7280'}
                    />
                    <Text style={[styles.typeText, type === t.value && styles.typeTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Currency */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.currencyRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        style={[styles.currencyText, currency === c && styles.currencyTextActive]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Initial Balance */}
            {!editingAccount && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Initial Balance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            {/* Institution */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Institution (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Chase, Bank of America"
                value={institution}
                onChangeText={setInstitution}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  addButton: { padding: 4 },
  totalCard: {
    backgroundColor: '#3B82F6',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  totalAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: { flex: 1, marginLeft: 12 },
  accountName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  accountType: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  accountBalance: { fontSize: 16, fontWeight: '600', color: '#111827' },
  negative: { color: '#EF4444' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelText: { fontSize: 16, color: '#6B7280' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  saveText: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  disabledText: { opacity: 0.5 },
  modalContent: { flex: 1, padding: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  typeItemActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeText: { fontSize: 14, color: '#6B7280' },
  typeTextActive: { color: '#fff' },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencyChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  currencyText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  currencyTextActive: { color: '#fff' },
});
