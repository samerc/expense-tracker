import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { userAPI } from '../../src/services/api';
import { router } from 'expo-router';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Profile editing state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password change state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setProfileSaving(true);
    try {
      await userAPI.updateProfile({ name: profileName.trim() });
      Alert.alert('Success', 'Profile updated successfully');
      setProfileModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      await userAPI.changePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Password changed successfully');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    danger,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Ionicons name={icon as any} size={20} color={danger ? '#EF4444' : '#6B7280'} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Name, email"
            onPress={() => {
              setProfileName(user?.name || '');
              setProfileModalVisible(true);
            }}
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Change Password"
            onPress={() => setPasswordModalVisible(true)}
          />
          <SettingItem
            icon="home-outline"
            title="Household"
            subtitle={user?.householdName || 'Your household'}
          />
        </View>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="wallet-outline"
            title="Accounts"
            subtitle="Manage your bank accounts"
            onPress={() => router.push('/accounts')}
          />
          <SettingItem
            icon="folder-outline"
            title="Categories"
            subtitle="Expense and income categories"
            onPress={() => router.push('/categories')}
          />
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={notificationsEnabled ? '#3B82F6' : '#F3F4F6'}
              />
            }
          />
          <SettingItem
            icon="finger-print"
            title="Biometric Login"
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={biometricEnabled ? '#3B82F6' : '#F3F4F6'}
              />
            }
          />
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Coming soon"
          />
          <SettingItem
            icon="globe-outline"
            title="Currency"
            subtitle="USD"
          />
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="sync-outline"
            title="Sync Status"
            subtitle="All data synced"
            rightElement={
              <View style={styles.syncBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
            }
          />
          <SettingItem
            icon="cloud-download-outline"
            title="Export Data"
            onPress={() => Alert.alert('Coming Soon', 'Data export will be available in a future update.')}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="help-circle-outline"
            title="Help & FAQ"
            onPress={() => Alert.alert('Coming Soon', 'Help documentation will be available soon.')}
          />
          <SettingItem
            icon="chatbubble-outline"
            title="Contact Support"
            onPress={() => Alert.alert('Contact Support', 'Email us at support@fancyshark.com')}
          />
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle={`Version ${Constants.expoConfig?.version || '1.0.0'}`}
          />
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Expense Tracker by FancyShark</Text>
      </View>

      {/* Profile Edit Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Your name"
              />
            </View>
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputDisabled]}
                value={user?.email || ''}
                editable={false}
              />
              <Text style={styles.modalHint}>Email cannot be changed</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonPrimary, profileSaving && styles.modalButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={profileSaving}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {profileSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonPrimary, passwordSaving && styles.modalButtonDisabled]}
                onPress={handleChangePassword}
                disabled={passwordSaving}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {passwordSaving ? 'Changing...' : 'Change'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 20,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIconDanger: {
    backgroundColor: '#FEE2E2',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#111827',
  },
  settingTitleDanger: {
    color: '#EF4444',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  syncBadge: {
    padding: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalInputDisabled: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  modalHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
});
