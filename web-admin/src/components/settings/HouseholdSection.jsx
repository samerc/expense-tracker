import { Home, Users, Globe } from 'lucide-react';

/**
 * HouseholdSection Component
 * 
 * Displays household information
 * Shows household name, base currency, member count
 * 
 * @param {Object} household - Household object
 */
export default function HouseholdSection({ household }) {
  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <Home className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold">Household Information</h2>
      </div>

      <div className="space-y-4">
        {/* Household Name */}
        <div className="flex items-center space-x-3">
          <Home className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Household Name</p>
            <p className="text-sm font-medium text-gray-900">
              {household?.name || 'Default Household'}
            </p>
          </div>
        </div>

        {/* Base Currency */}
        <div className="flex items-center space-x-3">
          <Globe className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Base Currency</p>
            <p className="text-sm font-medium text-gray-900">
              {household?.baseCurrency || 'USD'}
            </p>
          </div>
        </div>

        {/* Member Count */}
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Members</p>
            <p className="text-sm font-medium text-gray-900">
              {household?.memberCount || 1} member{household?.memberCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Contact your administrator to change household settings
        </p>
      </div>
    </div>
  );
}
