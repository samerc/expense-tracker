import { getDatabase } from '../index';
import { generateUUID } from '../../utils/uuid';

export interface UserProfile {
  id: string;
  server_id?: string;
  email?: string;
  name: string;
  household_id?: string;
  household_name?: string;
  base_currency: string;
  is_synced: boolean;
  plan_type: 'free' | 'premium';
  created_at: string;
  modified_at: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  household_name?: string;
  base_currency?: string;
}

// Get current user profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const db = getDatabase();

  const profile = await db.getFirstAsync<UserProfile>(
    `SELECT * FROM user_profile LIMIT 1`
  );

  if (!profile) return null;

  return {
    ...profile,
    is_synced: Boolean(profile.is_synced),
  };
};

// Update user profile
export const updateUserProfile = async (input: UpdateProfileInput): Promise<UserProfile> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.email !== undefined) {
    updates.push('email = ?');
    values.push(input.email);
  }
  if (input.household_name !== undefined) {
    updates.push('household_name = ?');
    values.push(input.household_name);
  }
  if (input.base_currency !== undefined) {
    updates.push('base_currency = ?');
    values.push(input.base_currency);
  }

  updates.push('modified_at = ?');
  values.push(now);

  await db.runAsync(
    `UPDATE user_profile SET ${updates.join(', ')}`,
    values
  );

  const profile = await getUserProfile();
  if (!profile) throw new Error('Profile not found');

  return profile;
};

// Link profile to server account (when upgrading to paid)
export const linkToServerAccount = async (
  serverId: string,
  email: string,
  householdId: string,
  householdName: string
): Promise<UserProfile> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE user_profile SET
      server_id = ?,
      email = ?,
      household_id = ?,
      household_name = ?,
      is_synced = 1,
      plan_type = 'premium',
      modified_at = ?`,
    [serverId, email, householdId, householdName, now]
  );

  const profile = await getUserProfile();
  if (!profile) throw new Error('Profile not found');

  return profile;
};

// Unlink from server (when downgrading)
export const unlinkFromServer = async (): Promise<UserProfile> => {
  const db = getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE user_profile SET
      is_synced = 0,
      plan_type = 'free',
      modified_at = ?`,
    [now]
  );

  const profile = await getUserProfile();
  if (!profile) throw new Error('Profile not found');

  return profile;
};

// Check if user is premium (sync enabled)
export const isPremiumUser = async (): Promise<boolean> => {
  const profile = await getUserProfile();
  return profile?.plan_type === 'premium' && profile?.is_synced;
};

// Get app settings
export const getAppSetting = async (key: string): Promise<string | null> => {
  const db = getDatabase();

  const result = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [key]
  );

  return result?.value || null;
};

// Set app setting
export const setAppSetting = async (key: string, value: string): Promise<void> => {
  const db = getDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
    [key, value]
  );
};

// Get last sync timestamp
export const getLastSyncTime = async (): Promise<Date | null> => {
  const timestamp = await getAppSetting('last_sync_time');
  return timestamp ? new Date(timestamp) : null;
};

// Set last sync timestamp
export const setLastSyncTime = async (): Promise<void> => {
  await setAppSetting('last_sync_time', new Date().toISOString());
};
