import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { initDatabase, closeDatabase } from '../database';
import { isOnline, NetworkState, getNetworkState } from '../utils/network';
import { getUserProfile, UserProfile, isPremiumUser } from '../database/repositories/userRepository';
import * as Network from 'expo-network';

interface DatabaseContextType {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  networkState: NetworkState | null;
  userProfile: UserProfile | null;
  isPremium: boolean;
  refreshProfile: () => Promise<void>;
  canSync: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize SQLite database
        await initDatabase();

        // Load user profile
        const profile = await getUserProfile();
        setUserProfile(profile);

        // Check premium status
        const premium = await isPremiumUser();
        setIsPremium(premium);

        // Get initial network state
        const network = await getNetworkState();
        setNetworkState(network);

        setIsReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      closeDatabase().catch(console.error);
    };
  }, []);

  // Monitor network changes
  useEffect(() => {
    let isMounted = true;

    const checkNetwork = async () => {
      const state = await getNetworkState();
      if (isMounted) {
        setNetworkState(state);
      }
    };

    // Check network periodically (every 30 seconds)
    const interval = setInterval(checkNetwork, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    const profile = await getUserProfile();
    setUserProfile(profile);
    const premium = await isPremiumUser();
    setIsPremium(premium);
  }, []);

  // Determine if sync is possible (premium + online)
  const canSync = isPremium && (networkState?.isConnected ?? false) && (networkState?.isInternetReachable ?? false);

  const value: DatabaseContextType = {
    isReady,
    isLoading,
    error,
    networkState,
    userProfile,
    isPremium,
    refreshProfile,
    canSync,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Hook to use database context
export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

// Hook to check if database is ready
export const useDatabaseReady = (): boolean => {
  const { isReady } = useDatabase();
  return isReady;
};

// Hook to get network state
export const useNetworkState = (): NetworkState | null => {
  const { networkState } = useDatabase();
  return networkState;
};

// Hook to check if can sync
export const useCanSync = (): boolean => {
  const { canSync } = useDatabase();
  return canSync;
};
