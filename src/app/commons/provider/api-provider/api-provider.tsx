'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { apiClient, ApiClient } from './api-client';

interface ApiContextType {
  api: ApiClient;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  return (
    <ApiContext.Provider value={{ api: apiClient }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
