import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

// Mock categories - will come from WatermelonDB
const categories: Category[] = [
  { id: '1', name: 'Groceries', icon: 'cart', color: '#10B981', type: 'expense' },
  { id: '2', name: 'Dining', icon: 'restaurant', color: '#F59E0B', type: 'expense' },
  { id: '3', name: 'Transport', icon: 'car', color: '#3B82F6', type: 'expense' },
  { id: '4', name: 'Shopping', icon: 'bag', color: '#8B5CF6', type: 'expense' },
  { id: '5', name: 'Bills', icon: 'flash', color: '#EF4444', type: 'expense' },
  { id: '6', name: 'Health', icon: 'medical', color: '#EC4899', type: 'expense' },
  { id: '7', name: 'Entertainment', icon: 'film', color: '#06B6D4', type: 'expense' },
  { id: '8', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280', type: 'expense' },
];

const incomeCategories: Category[] = [
  { id: '10', name: 'Salary', icon: 'cash', color: '#10B981', type: 'income' },
  { id: '11', name: 'Freelance', icon: 'briefcase', color: '#3B82F6', type: 'income' },
  { id: '12', name: 'Investment', icon: 'trending-up', color: '#8B5CF6', type: 'income' },
  { id: '13', name: 'Other', icon: 'add-circle', color: '#6B7280', type: 'income' },
];

export default function AddTransactionScreen() {
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const dropZoneScale = useSharedValue(1);
  const isOverDropZone = useSharedValue(false);

  const handleCategorySelect = (category: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(category);
  };

  const dropZoneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dropZoneScale.value }],
    borderColor: isOverDropZone.value ? '#3B82F6' : '#E5E7EB',
    backgroundColor: isOverDropZone.value ? '#EFF6FF' : '#F9FAFB',
  }));

  const currentCategories = transactionType === 'expense' ? categories : incomeCategories;

  const handleSave = () => {
    if (!amount || !selectedCategory) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // TODO: Save to WatermelonDB
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeButton, transactionType === 'expense' && styles.typeButtonActive]}
          onPress={() => {
            setTransactionType('expense');
            setSelectedCategory(null);
            Haptics.selectionAsync();
          }}
        >
          <Text style={[styles.typeButtonText, transactionType === 'expense' && styles.typeButtonTextActive]}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, transactionType === 'income' && styles.typeButtonActiveIncome]}
          onPress={() => {
            setTransactionType('income');
            setSelectedCategory(null);
            Haptics.selectionAsync();
          }}
        >
          <Text style={[styles.typeButtonText, transactionType === 'income' && styles.typeButtonTextActive]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor="#D1D5DB"
          keyboardType="decimal-pad"
          autoFocus
        />
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tap to select category</Text>

        <View style={styles.categoriesGrid}>
          {currentCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory?.id === category.id && styles.categoryItemSelected,
                selectedCategory?.id === category.id && { borderColor: category.color },
              ]}
              onPress={() => handleCategorySelect(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon as any} size={24} color={category.color} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Category Display */}
      {selectedCategory && (
        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>Selected</Text>
          <View style={[styles.selectedCategory, { borderColor: selectedCategory.color }]}>
            <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color + '20' }]}>
              <Ionicons name={selectedCategory.icon as any} size={24} color={selectedCategory.color} />
            </View>
            <Text style={styles.selectedCategoryName}>{selectedCategory.name}</Text>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Title Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Title (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Weekly groceries"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Notes Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional details..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          (!amount || !selectedCategory) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!amount || !selectedCategory}
      >
        <Text style={styles.saveButtonText}>Save Transaction</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  typeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#EF4444',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '300',
    color: '#9CA3AF',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#111827',
    minWidth: 150,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    gap: 12,
  },
  selectedCategoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
