'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@/hooks/useUser';

type User = {
  user_id: string;
  email: string;
  full_name: string;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useUser();

  const value = {
    user: user || null,
    isLoading,
    isError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
