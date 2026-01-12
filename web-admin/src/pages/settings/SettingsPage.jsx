import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, householdAPI } from '../../services/api';
//import { usePreferences } from '../../context/PreferencesContext';

import UserProfileSection from '../../components/settings/UserProfileSection';
import PreferencesSection from '../../components/settings/PreferencesSection';
import HouseholdSection from '../../components/settings/HouseholdSection';

/**
 * SettingsPage Component
 * 
 * Main settings page for user profile, preferences, and household info
 * Features:
 * - User profile (name, email, role)
 * - Preferences (date format, currency display)
 * - Household information (read-only for non-admins)
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Fetch user profile details
   */
  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await userAPI.getProfile();
      return response.data;
    },
  });

  /**
   * Fetch user preferences
   */
   // const { preferences: preferencesData } = usePreferences();
// NEW - get from localStorage
  const preferencesData = JSON.parse(localStorage.getItem('preferences') || '{"dateFormat":"MM/DD/YYYY","currencyDisplay":"symbol","weekStartsOn":"sunday"}');

  /**
   * Fetch household information
   */
  const { data: householdData } = useQuery({
    queryKey: ['household-info'],
    queryFn: async () => {
      const response = await householdAPI.getInfo();
      return response.data;
    },
  });

  /**
   * Update profile mutation
   */
  const updateProfileMutation = useMutation({
    mutationFn: (data) => userAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile']);
    },
  });

  /**
   * Update preferences mutation
   */
  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => userAPI.updatePreferences(data),
    onSuccess: () => {
 //     queryClient.invalidateQueries(['user-preferences']);
    },
  });

  /**
   * Handle profile update
   */
  const handleUpdateProfile = async (data) => {
    try {
      await updateProfileMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handle preferences update
   */
  const handleUpdatePreferences = async (data) => {
    try {
      await updatePreferencesMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="w-8 h-8 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">
            Manage your profile, preferences, and household settings
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* User Profile Section */}
          <UserProfileSection
            user={profileData || user}
            onUpdateProfile={handleUpdateProfile}
          />

          {/* Household Section */}
          <HouseholdSection household={householdData} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Preferences Section */}
          <PreferencesSection
            preferences={preferencesData}
            onUpdatePreferences={handleUpdatePreferences}
          />
        </div>
      </div>

    </div>
  );
}
