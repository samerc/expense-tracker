import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Award, UserPlus } from 'lucide-react';
import { LoadingSpinner, useToast, ConfirmationModal } from '../../components/common';
import { householdAPI, adminAPI } from '../../services/api';
import UsersList from '../../components/admin/UsersList';
import EditUserModal from '../../components/admin/EditUserModal';
import InviteUserModal from '../../components/admin/InviteUserModal';


/**
 * AdminPanelPage Component
 * 
 * Admin dashboard for managing users and household
 * Features:
 * - View all household members
 * - Edit user roles (admin/regular)
 * - Activate/deactivate users
 * - View subscription and features
 */
export default function AdminPanelPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  /**
   * Fetch household members
   */
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['household-members'],
    queryFn: async () => {
      const response = await householdAPI.getMembers();
      return response.data;
    },
  });

  /**
   * Fetch household info
   */
  const { data: householdData } = useQuery({
    queryKey: ['household-info'],
    queryFn: async () => {
      const response = await householdAPI.getInfo();
      return response.data;
    },
  });

  /**
   * Update user role mutation
   */
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, data }) => adminAPI.updateUserRole(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['household-members']);
    },
  });

  /**
   * Toggle user status mutation
   */
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) => adminAPI.toggleUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(['household-members']);
    },
  });

  /**
   * Invite user mutation
   */
  const inviteUserMutation = useMutation({
    mutationFn: (data) => adminAPI.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['household-members']);
    },
  });

  /**
   * Handle edit user
   */
  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  /**
   * Handle save user role
   */
  const handleSaveRole = async (userId, data) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, data });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handle invite user
   */
  const handleInviteUser = async (data) => {
    try {
      await inviteUserMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handle toggle user status - opens confirmation modal
   */
  const handleToggleStatus = (user) => {
    setUserToToggle(user);
    setStatusConfirmOpen(true);
  };

  /**
   * Confirm toggle user status
   */
  const confirmToggleStatus = async () => {
    if (!userToToggle) return;

    const action = userToToggle.is_active ? 'deactivate' : 'activate';

    try {
      await toggleStatusMutation.mutateAsync({
        userId: userToToggle.id,
        isActive: !userToToggle.is_active
      });
      toast.success(`User ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} user`);
      throw error;
    } finally {
      setUserToToggle(null);
    }
  };

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

  const members = membersData?.members || [];
  const adminCount = members.filter(m => m.role === 'admin').length;
  const activeCount = members.filter(m => m.is_active).length;

  //Check if can add more users
  const maxUsers = householdData?.maxUsers || 1;
  const canAddUsers = maxUsers === -1 || members.length < maxUsers;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-gray-600">
            Manage users, roles, and household settings
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Total Members with Quota */}
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-600">Users</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">
            {members.length}
            {householdData?.maxUsers && householdData.maxUsers !== -1 && (
              <span className="text-xl text-blue-700">/{householdData.maxUsers}</span>
            )}
            {householdData?.maxUsers === -1 && (
              <span className="text-xl text-blue-700"> / ∞</span>
            )}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {householdData?.planName || 'Free'} Plan
          </p>
        </div>

        {/* Active Users */}
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Active Users</p>
          <p className="text-2xl font-bold text-green-600">
            {activeCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {members.length > 0 ? `${((activeCount / members.length) * 100).toFixed(0)}% active` : ''}
          </p>
        </div>

        {/* Admins */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-1">
            <Shield className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-gray-600">Administrators</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {adminCount}
          </p>
        </div>

        {/* Household Plan */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-1">
            <Award className="w-4 h-4 text-purple-600" />
            <p className="text-sm text-gray-600">Plan</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            Pro
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Unlimited features
          </p>
        </div>
      </div>

      {/* Household Info Card */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Household Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Household Name</p>
            <p className="text-sm font-medium text-gray-900">
              {householdData?.name || 'Default Household'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Base Currency</p>
            <p className="text-sm font-medium text-gray-900">
              {householdData?.baseCurrency || 'USD'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-sm font-medium text-gray-900">
              {householdData?.createdAt ? new Date(householdData.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Users</h2>
          
          {/* Invite User Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            disabled={!canAddUsers}
            className={`btn ${canAddUsers ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'} text-sm flex items-center space-x-2`}
            title={!canAddUsers ? `User limit reached (${maxUsers})` : 'Invite new user'}
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite User</span>
          </button>
        </div>
        
        {/* User limit warning */}
        {!canAddUsers && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            You've reached your user limit ({maxUsers} users). Upgrade your plan to add more users.
          </div>
        )}
        
        <UsersList
          users={members}
          onEditUser={handleEditUser}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveRole}
        user={editingUser}
      />

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteUser}
      />

      {/* Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={statusConfirmOpen}
        onClose={() => {
          setStatusConfirmOpen(false);
          setUserToToggle(null);
        }}
        onConfirm={confirmToggleStatus}
        title={userToToggle?.is_active ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${userToToggle?.is_active ? 'deactivate' : 'activate'} ${userToToggle?.name}?`}
        confirmText={userToToggle?.is_active ? 'Deactivate' : 'Activate'}
        variant={userToToggle?.is_active ? 'danger' : 'warning'}
      />
    </div>
  );
}
