import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, HealthPathway, AuthState } from './types';
import {
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  logoutUser,
  sendPasswordResetEmail,
  getCurrentUser,
  updateUserPathway,
  LoginResult,
  RegisterPayload,
  RegisterResult,
} from './authService';
import { subscribeToAuthChanges, mobileSupabaseAuth } from '../../lib/supabase';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  selectPathway: (pathway: HealthPathway) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pathway, setPathwayState] = useState<HealthPathway | null>(() => getCurrentUser()?.pathway || null);

  useEffect(() => {
    // Listen for Supabase session changes
    const unsubscribe = subscribeToAuthChanges((session) => {
      if (session?.user) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        if (currentUser?.pathway) {
          setPathwayState(currentUser.pathway);
        }
      } else {
        setUser(null);
        setPathwayState(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await loginWithEmailAndPassword(email, password);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.user.pathway) {
          setPathwayState(res.user.pathway);
        }
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<RegisterResult> => {
    setIsLoading(true);
    try {
      const res = await registerWithEmailAndPassword(payload);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.user.pathway) {
          setPathwayState(res.user.pathway);
        }
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setPathwayState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return sendPasswordResetEmail(email);
  }, []);

  const selectPathway = useCallback((newPathway: HealthPathway) => {
    setPathwayState(newPathway);
    const updated = updateUserPathway(newPathway);
    if (updated) {
      setUser(updated);
    }
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: Boolean(user),
    user,
    isLoading,
    pathway,
    login,
    register,
    logout,
    resetPassword,
    selectPathway,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
