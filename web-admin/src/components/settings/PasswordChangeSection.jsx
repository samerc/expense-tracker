import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { userAPI } from '../../services/api';

/**
 * PasswordChangeSection Component
 *
 * Allows users to change their password
 */
export default function PasswordChangeSection() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await userAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccessMessage('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setErrors({
        submit: error.response?.data?.error || 'Failed to change password'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggle password visibility
   */
  const toggleVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <Lock className="w-5 h-5 text-gray-400" />
        <h2 className="text-xl font-semibold">Change Password</h2>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {errors.submit}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="label">Current Password</label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className={`input pr-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => toggleVisibility('current')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className={`input pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => toggleVisibility('new')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label">Confirm New Password</label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={`input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => toggleVisibility('confirm')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
