import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const SettingsItem = ({
    icon,
    label,
    value,
    onPress,
    showArrow = true,
    danger = false,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} disabled={!onPress}>
      <View style={[styles.settingsIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon as any} size={20} color={danger ? '#EF4444' : '#6B7280'} />
      </View>
      <Text style={[styles.settingsLabel, danger && styles.dangerText]}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      {showArrow && onPress && <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />}
    </TouchableOpacity>
  );

  const SettingsToggle = ({
    icon,
    label,
    value,
    onValueChange,
  }: {
    icon: string;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingsItem}>
      <View style={styles.settingsIcon}>
        <Ionicons name={icon as any} size={20} color="#6B7280" />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Sync Status */}
      <View style={styles.syncCard}>
        <View style={styles.syncStatus}>
          <Ionicons name="cloud-done" size={24} color="#10B981" />
          <View style={styles.syncInfo}>
            <Text style={styles.syncTitle}>All synced</Text>
            <Text style={styles.syncSubtitle}>Last sync: Just now</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.syncButton}>
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <SettingsItem icon="person-outline" label="Profile" onPress={() => {}} />
          <SettingsItem icon="home-outline" label="Household" value="Cheaib Family" onPress={() => {}} />
          <SettingsItem icon="card-outline" label="Subscription" value="Pro" onPress={() => {}} />
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionContent}>
          <SettingsItem icon="cash-outline" label="Currency" value="USD" onPress={() => {}} />
          <SettingsToggle
            icon="moon-outline"
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingsToggle
            icon="notifications-outline"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingsToggle
            icon="finger-print-outline"
            label="Biometric Login"
            value={biometrics}
            onValueChange={setBiometrics}
          />
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.sectionContent}>
          <SettingsItem icon="download-outline" label="Export Data" onPress={() => {}} />
          <SettingsItem icon="cloud-upload-outline" label="Backup Settings" onPress={() => {}} />
          <SettingsItem icon="trash-outline" label="Clear Local Data" onPress={() => {}} danger />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionContent}>
          <SettingsItem icon="information-circle-outline" label="Version" value="1.0.0" showArrow={false} />
          <SettingsItem icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
          <SettingsItem icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="log-out-outline"
            label="Log Out"
            onPress={handleLogout}
            showArrow={false}
            danger
          />
        </View>
      </View>

      <View style={{ height: 40 }} />
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  syncCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncInfo: {
    marginLeft: 12,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  syncSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  syncButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginLeft: 20,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#FEE2E2',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  dangerText: {
    color: '#EF4444',
  },
  settingsValue: {
    fontSize: 15,
    color: '#6B7280',
    marginRight: 8,
  },
});
