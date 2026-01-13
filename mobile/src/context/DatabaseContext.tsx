import { createContext, useContext, ReactNode } from 'react';

// Placeholder for WatermelonDB integration
// Will be implemented when we set up the local database

interface DatabaseContextType {
  isReady: boolean;
  // database: Database | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  // TODO: Initialize WatermelonDB here
  const isReady = true;

  return (
    <DatabaseContext.Provider value={{ isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
