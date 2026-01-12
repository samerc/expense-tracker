import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const { features: userFeatures, ...userData } = response.data;
      setUser(userData);
      setFeatures(userFeatures || {});
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    setToken(token);
    setUser(user);

    // Fetch and store preferences
    try {
      const prefsResponse = await userAPI.getPreferences();
      localStorage.setItem('preferences', JSON.stringify(prefsResponse.data));
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
      // Set defaults
      localStorage.setItem('preferences', JSON.stringify({
        dateFormat: 'MM/DD/YYYY',
        currencyDisplay: 'symbol',
        weekStartsOn: 'sunday'
      }));
    }
    
    return response.data;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    setToken(token);
    setUser(user);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setFeatures({});
  };

  /**
   * Check if user has a specific feature enabled
   */
  const hasFeature = useCallback((featureKey) => {
    const featureValue = features[featureKey];
    // Feature is enabled if it exists and is truthy (not false, null, or 'false')
    return featureValue &&
           featureValue !== false &&
           featureValue !== 'false' &&
           featureValue !== null &&
           featureValue !== 'null';
  }, [features]);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    features,
    hasFeature,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
