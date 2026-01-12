import { useState, useEffect } from 'react';
import { X, Mail, User, Shield } from 'lucide-react';

/**
 * InviteUserModal Component
 * 
 * Modal for inviting/creating new users
 * Admin can specify email, name, and role
 * System sends invite email with temporary password
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onInvite - Callback to send invite
 */
export default function InviteUserModal({ isOpen, onClose, onInvite }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'regular',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Effect: Reset form when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        name: '',
        role: 'regular',
      });
      setErrors({});
    }
  }, [isOpen]);

  /**
   * Effect: Close on Escape key
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await onInvite(formData);
      onClose();
    } catch (err) {
      setErrors({
        submit: err.response?.data?.error || 'Failed to invite user'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Invite New User
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="label flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="user@example.com"
              autoFocus
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="label flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="label">Role</label>
            <div className="space-y-3">
              {/* Regular User */}
              <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="regular"
                  checked={formData.role === 'regular'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Regular User</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Can manage transactions, accounts, and budgets
                  </p>
                </div>
              </label>

              {/* Admin */}
              <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900">Admin</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Full access including user and household management
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Info Message */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              An email will be sent to the user with login instructions and a temporary password.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending Invite...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
