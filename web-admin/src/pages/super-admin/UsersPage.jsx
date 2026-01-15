import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users as UsersIcon, Search, Building2, Shield, Mail, Calendar, Activity, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import { useToast, ConfirmationModal } from '../../components/common';
import UserModal from '../../components/super-admin/UserModal';

/**
 * UsersPage Component
 * 
 * View all users across all households
 * Features:
 * - List all users with their household
 * - Search and filter users
 * - View user details
 */
export default function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  /**
   * Fetch all households (to get users)
   */
  const { data: householdsData, isLoading } = useQuery({
    queryKey: ['super-admin-households-users'],
    queryFn: async () => {
      const response = await superAdminAPI.getAllHouseholds();
      return response.data;
    },
  });

  /**
   * Fetch all household details to get all users
   */
  const { data: allUsersData } = useQuery({
    queryKey: ['super-admin-all-users'],
    queryFn: async () => {
      const households = householdsData?.households || [];
      const allUsers = [];

      // Fetch details for each household to get users
      for (const household of households) {
        try {
          const response = await superAdminAPI.getHouseholdDetails(household.id);
          const users = response.data.users || [];
          
          // Add household info to each user
          users.forEach(user => {
            allUsers.push({
              ...user,
              household_id: household.id,
              household_name: household.name,
              household_plan: household.plan_display_name,
              household_status: household.plan_status,
            });
          });
        } catch (error) {
          console.error(`Failed to fetch users for household ${household.id}:`, error);
        }
      }

      return allUsers;
    },
    enabled: !!householdsData?.households?.length,
  });

  /**
   * Create user mutation
   */
  const createUserMutation = useMutation({
    mutationFn: (data) => superAdminAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-all-users']);
      queryClient.invalidateQueries(['super-admin-households-users']);
      toast.success('User created successfully');
      setIsUserModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create user');
    },
  });

  /**
   * Update user mutation
   */
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => superAdminAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-all-users']);
      queryClient.invalidateQueries(['super-admin-households-users']);
      toast.success('User updated successfully');
      setIsUserModalOpen(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    },
  });

  /**
   * Delete user mutation
   */
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => superAdminAPI.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-all-users']);
      queryClient.invalidateQueries(['super-admin-households-users']);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
    setMenuOpen(null);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
    setMenuOpen(null);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleUserSubmit = (data) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  const allUsers = allUsersData || [];

  // Filter users
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.household_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Count by role
  const roleCount = {
    all: allUsers.length,
    super_admin: allUsers.filter(u => u.role === 'super_admin').length,
    admin: allUsers.filter(u => u.role === 'admin').length,
    regular: allUsers.filter(u => u.role === 'regular').length,
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UsersIcon className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">All Users</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage users across all households
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateUser}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{roleCount.all}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Super Admins</p>
          <p className="text-3xl font-bold text-purple-600">{roleCount.super_admin}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Admins</p>
          <p className="text-3xl font-bold text-blue-600">{roleCount.admin}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Regular Users</p>
          <p className="text-3xl font-bold text-green-600">{roleCount.regular}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or household..."
            className="input pl-10"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filter by role:</span>
          <div className="flex space-x-2">
            {['all', 'super_admin', 'admin', 'regular'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  roleFilter === role
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'All' : role.replace('_', ' ')}
                <span className="ml-1 opacity-75">({roleCount[role]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Household
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  
                  {/* User Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                  </td>

                  {/* Household */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.household_name}</p>
                        <p className="text-xs text-gray-500">{user.household_plan}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <Shield className="w-3 h-3 text-purple-600" />
                      )}
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                        user.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>

                  {/* Last Login */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded w-fit">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded w-fit">
                          Inactive
                        </span>
                      )}
                      {user.household_status !== 'active' && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded w-fit">
                          Household Suspended
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>

                      {menuOpen === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Pencil className="w-4 h-4" />
                              <span>Edit User</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete User</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUserSubmit}
        user={editingUser}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
}
