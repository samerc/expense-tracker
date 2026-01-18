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
import { categoriesAPI } from '../src/services/api';

interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isActive: boolean;
}

const CATEGORY_ICONS = [
  { name: 'cart', label: 'Shopping' },
  { name: 'restaurant', label: 'Food' },
  { name: 'car', label: 'Transport' },
  { name: 'home', label: 'Home' },
  { name: 'flash', label: 'Utilities' },
  { name: 'medkit', label: 'Health' },
  { name: 'game-controller', label: 'Entertainment' },
  { name: 'school', label: 'Education' },
  { name: 'briefcase', label: 'Work' },
  { name: 'gift', label: 'Gifts' },
  { name: 'airplane', label: 'Travel' },
  { name: 'fitness', label: 'Fitness' },
  { name: 'paw', label: 'Pets' },
  { name: 'construct', label: 'Repairs' },
  { name: 'shirt', label: 'Clothing' },
  { name: 'cash', label: 'Income' },
  { name: 'card', label: 'Banking' },
  { name: 'trending-up', label: 'Investment' },
  { name: 'ellipsis-horizontal', label: 'Other' },
];

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('cart');
  const [color, setColor] = useState('#3B82F6');

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories || response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName('');
    setType('expense');
    setIcon('cart');
    setColor('#3B82F6');
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setIcon(mapIconToIonicon(category.icon));
    setColor(category.color || '#3B82F6');
    setModalVisible(true);
  };

  const mapIconToIonicon = (iconName: string): string => {
    const map: Record<string, string> = {
      'shopping-cart': 'cart',
      'ShoppingCart': 'cart',
      'utensils': 'restaurant',
      'UtensilsCrossed': 'restaurant',
      'bolt': 'flash',
      'Zap': 'flash',
      'gamepad': 'game-controller',
      'Gamepad2': 'game-controller',
      'DollarSign': 'cash',
      'CreditCard': 'card',
    };
    return map[iconName] || iconName || 'ellipsis-horizontal';
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        type,
        icon,
        color,
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, data);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await categoriesAPI.create(data);
        Alert.alert('Success', 'Category created successfully');
      }

      setModalVisible(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoriesAPI.delete(category.id);
              fetchCategories();
              Alert.alert('Success', 'Category deleted');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const filteredCategories = categories.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  const expenseCount = categories.filter((c) => c.type === 'expense').length;
  const incomeCount = categories.filter((c) => c.type === 'income').length;

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color || '#3B82F6' }]}>
        <Ionicons name={mapIconToIonicon(item.icon) as any} size={20} color="#fff" />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryType}>
          {item.type === 'income' ? 'Income' : 'Expense'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
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
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
            All ({categories.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'expense' && styles.filterTabActive]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterTabText, filterType === 'expense' && styles.filterTabTextActive]}>
            Expense ({expenseCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'income' && styles.filterTabActive]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterTabText, filterType === 'income' && styles.filterTabTextActive]}>
            Income ({incomeCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No categories</Text>
            <Text style={styles.emptySubtext}>Tap + to create a category</Text>
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
              {editingCategory ? 'Edit Category' : 'New Category'}
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
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Groceries"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'expense' && styles.typeButtonExpense]}
                  onPress={() => setType('expense')}
                >
                  <Ionicons
                    name="arrow-up"
                    size={18}
                    color={type === 'expense' ? '#fff' : '#EF4444'}
                  />
                  <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'income' && styles.typeButtonIncome]}
                  onPress={() => setType('income')}
                >
                  <Ionicons
                    name="arrow-down"
                    size={18}
                    color={type === 'income' ? '#fff' : '#10B981'}
                  />
                  <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Icon */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Icon</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((i) => (
                  <TouchableOpacity
                    key={i.name}
                    style={[
                      styles.iconItem,
                      icon === i.name && { backgroundColor: color },
                    ]}
                    onPress={() => setIcon(i.name)}
                  >
                    <Ionicons
                      name={i.name as any}
                      size={22}
                      color={icon === i.name ? '#fff' : '#6B7280'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorItem,
                      { backgroundColor: c },
                      color === c && styles.colorItemActive,
                    ]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
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
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: { backgroundColor: '#3B82F6' },
  filterTabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterTabTextActive: { color: '#fff' },
  listContent: { padding: 16 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  categoryType: { fontSize: 13, color: '#6B7280', marginTop: 2 },
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
  typeToggle: { flexDirection: 'row', gap: 12 },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  typeButtonExpense: { backgroundColor: '#EF4444' },
  typeButtonIncome: { backgroundColor: '#10B981' },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  typeButtonTextActive: { color: '#fff' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorItemActive: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
});
