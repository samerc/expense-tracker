import { useState } from 'react';
import { User, Shield, Check, X, MoreVertical, Edit2, Key } from 'lucide-react';

/**
 * UsersList Component
 * 
 * Displays list of users in the household
 * Shows name, email, role, status, last login
 * Allows editing role and managing user status
 * 
 * @param {Array} users - Array of user objects
 * @param {Function} onEditUser - Callback when edit is clicked
 * @param {Function} onToggleStatus - Callback to activate/deactivate user
 */
export default function UsersList({ users, onEditUser, onToggleStatus }) {
  const [menuOpen, setMenuOpen] = useState(null);

  if (!users || users.length === 0) {
    return (
      <div className="card text-center py-12">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  /**
   * Get role badge color
   */
  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
          <Shield className="w-3 h-3" />
          <span>Admin</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
        <User className="w-3 h-3" />
        <span>User</span>
        </span>
    );
  };

  /**
   * Format last login date
   */
  const formatLastLogin = (date) => {
    if (!date) return 'Never';
    
    const lastLogin = new Date(date);
    const now = new Date();
    const diffMs = now - lastLogin;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastLogin.toLocaleDateString();
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {/* User Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
                </td>

                {/* Role */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_active ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                      <X className="w-3 h-3" />
                      <span>Inactive</span>
                    </span>
                  )}
                </td>

                {/* Last Login */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatLastLogin(user.last_login)}</p>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {menuOpen === user.id && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />

                        {/* Menu */}
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => {
                              onEditUser(user);
                              setMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit Role</span>
                          </button>
                          <button
                            onClick={() => {
                              onToggleStatus(user);
                              setMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            {user.is_active ? (
                              <>
                                <X className="w-4 h-4" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Activate</span>
                              </>
                            )}
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
    </div>
  );
}
