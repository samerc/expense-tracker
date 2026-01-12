import { useState } from 'react';
import { Settings as SettingsIcon, Calendar, DollarSign } from 'lucide-react';

/**
 * PreferencesSection Component
 * 
 * User preferences for date format, currency display, etc.
 * 
 * @param {Object} preferences - Current user preferences
 * @param {Function} onUpdatePreferences - Callback to update preferences
 */
export default function PreferencesSection({ preferences, onUpdatePreferences }) {
  const [formData, setFormData] = useState({
    dateFormat: preferences?.dateFormat || 'MM/DD/YYYY',
    currencyDisplay: preferences?.currencyDisplay || 'symbol',
    weekStartsOn: preferences?.weekStartsOn || 'sunday',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await onUpdatePreferences(formData);
      setSuccessMessage('Preferences saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold">Preferences</h2>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Date Format */}
        <div>
          <label className="label flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Date Format</span>
          </label>
          <select
            value={formData.dateFormat}
            onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
            className="input"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
          </select>
        </div>

        {/* Currency Display */}
        <div>
          <label className="label flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Currency Display</span>
          </label>
          <select
            value={formData.currencyDisplay}
            onChange={(e) => setFormData({ ...formData, currencyDisplay: e.target.value })}
            className="input"
          >
            <option value="symbol">Symbol ($100.00)</option>
            <option value="code">Code (USD 100.00)</option>
            <option value="name">Name (100.00 US Dollars)</option>
          </select>
        </div>

        {/* Week Starts On */}
        <div>
          <label className="label">Week Starts On</label>
          <select
            value={formData.weekStartsOn}
            onChange={(e) => setFormData({ ...formData, weekStartsOn: e.target.value })}
            className="input"
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
            <option value="saturday">Saturday</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
