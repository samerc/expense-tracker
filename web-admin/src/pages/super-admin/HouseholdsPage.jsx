import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, MoreVertical, Edit2, Trash2, Users, Activity, CreditCard, Pencil } from 'lucide-react';
import { LoadingSpinner, useToast, ConfirmationModal } from '../../components/common';
import { superAdminAPI } from '../../services/api';
import HouseholdDetailsModal from '../../components/super-admin/HouseholdDetailsModal';
import HouseholdModal from '../../components/super-admin/HouseholdModal';

/**
 * HouseholdsPage Component
 * 
 * Manage all households
 * Features:
 * - View all households with search
 * - View household details
 * - Create/edit/delete households
 * - Manage plans and status
 */
export default function HouseholdsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState('down');
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [householdToToggle, setHouseholdToToggle] = useState(null);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState(null);

  /**
   * Fetch all households
   */
  const { data: householdsData, isLoading } = useQuery({
    queryKey: ['super-admin-households'],
    queryFn: async () => {
      const response = await superAdminAPI.getAllHouseholds();
      return response.data;
    },
  });

  /**
   * Fetch household details
   */
  const { data: detailsData } = useQuery({
    queryKey: ['super-admin-household-details', selectedHousehold?.id],
    queryFn: async () => {
      if (!selectedHousehold) return null;
      const response = await superAdminAPI.getHouseholdDetails(selectedHousehold.id);
      return response.data;
    },
    enabled: !!selectedHousehold,
  });

  /**
   * Toggle status mutation
   */
  const toggleStatusMutation = useMutation({
    mutationFn: ({ householdId, status }) =>
      superAdminAPI.toggleHouseholdStatus(householdId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-households']);
    },
  });

  /**
   * Create household mutation
   */
  const createHouseholdMutation = useMutation({
    mutationFn: (data) => superAdminAPI.createHousehold(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-households']);
      toast.success('Household created successfully');
      setIsHouseholdModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create household');
    },
  });

  /**
   * Update household mutation
   */
  const updateHouseholdMutation = useMutation({
    mutationFn: ({ id, data }) => superAdminAPI.updateHousehold(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['super-admin-households']);
      toast.success('Household updated successfully');
      setIsHouseholdModalOpen(false);
      setEditingHousehold(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update household');
    },
  });

  /**
   * Handle view details
   */
  const handleViewDetails = (household) => {
    setSelectedHousehold(household);
    setIsDetailsOpen(true);
  };

  /**
   * Handle create household
   */
  const handleCreateHousehold = () => {
    setEditingHousehold(null);
    setIsHouseholdModalOpen(true);
  };

  /**
   * Handle edit household
   */
  const handleEditHousehold = (household) => {
    setEditingHousehold(household);
    setIsHouseholdModalOpen(true);
    setMenuOpen(null);
  };

  /**
   * Handle household modal submit
   */
  const handleHouseholdSubmit = (data) => {
    if (editingHousehold) {
      updateHouseholdMutation.mutate({ id: editingHousehold.id, data });
    } else {
      createHouseholdMutation.mutate(data);
    }
  };

  /**
   * Handle toggle status - opens confirmation modal
   */
  const handleToggleStatus = (household) => {
    setHouseholdToToggle(household);
    setStatusConfirmOpen(true);
    setMenuOpen(null);
  };

  /**
   * Confirm toggle household status
   */
  const confirmToggleStatus = async () => {
    if (!householdToToggle) return;

    const newStatus = householdToToggle.plan_status === 'active' ? 'suspended' : 'active';

    try {
      await toggleStatusMutation.mutateAsync({
        householdId: householdToToggle.id,
        status: newStatus
      });
      toast.success(`Household ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch (error) {
      toast.error('Failed to update status');
      throw error;
    } finally {
      setHouseholdToToggle(null);
    }
  };

  /**
   * Handle delete household
   */
  const handleDelete = (household) => {
    toast.info('Delete functionality coming soon');
    setMenuOpen(null);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading households..." />;
  }

  const households = householdsData?.households || [];
  
  // Filter households by search
  const filteredHouseholds = households.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.base_currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Households</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all households and their subscriptions
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateHousehold}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Household</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search households by name or currency..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Households Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Household
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Accounts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredHouseholds.map((household) => (
                <tr
                  key={household.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleViewDetails(household)}
                >
                  
                  {/* Household Name */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{household.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{household.base_currency}</p>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                      {household.plan_display_name || 'No Plan'}
                    </span>
                  </td>

                  {/* Users */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-900 dark:text-gray-100">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{household.user_count}</span>
                    </div>
                  </td>

                  {/* Accounts */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-900 dark:text-gray-100">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span>{household.account_count}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {household.plan_status === 'active' ? (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                        Suspended
                      </span>
                    )}
                  </td>

                  {/* Last Activity */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {household.last_activity
                        ? new Date(household.last_activity).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          // Detect if we're in bottom half of viewport
                          const rect = e.currentTarget.getBoundingClientRect();
                          const viewportHeight = window.innerHeight;
                          const isBottomHalf = rect.top > viewportHeight / 2;

                          setMenuPosition(isBottomHalf ? 'up' : 'down');
                          setMenuOpen(menuOpen === household.id ? null : household.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>

                      {menuOpen === household.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(null)}
                          />

                          {/* Menu with proper positioning */}
                          <div className={`absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 ${
                            menuPosition === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
                          }`}>
                            <button
                              onClick={() => {
                                handleViewDetails(household);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Activity className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={() => handleEditHousehold(household)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Pencil className="w-4 h-4" />
                              <span>Edit Household</span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(household)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>{household.plan_status === 'active' ? 'Suspend' : 'Activate'}</span>
                            </button>
                            <button
                              onClick={() => handleDelete(household)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
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

        {filteredHouseholds.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No households found</p>
          </div>
        )}
      </div>

      {/* Household Details Modal*/}
      <HouseholdDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedHousehold(null);
        }}
        household={selectedHousehold}
        details={detailsData}
      />

      {/* Create/Edit Household Modal */}
      <HouseholdModal
        isOpen={isHouseholdModalOpen}
        onClose={() => {
          setIsHouseholdModalOpen(false);
          setEditingHousehold(null);
        }}
        onSubmit={handleHouseholdSubmit}
        household={editingHousehold}
        isLoading={createHouseholdMutation.isPending || updateHouseholdMutation.isPending}
      />
    </div>
  );
}
