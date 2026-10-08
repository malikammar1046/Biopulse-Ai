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
import { fetchUserProfileFromDb, updateUserPathwayInDb } from '../../services/userService';
import { registerAuthFailureListener, setAuthExpired } from '../../services/api';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pathway, setPathwayState] = useState<HealthPathway | null>(() => getCurrentUser()?.pathway || null);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial persistent session restoration
    async function initSession() {
      try {
        const session = await mobileSupabaseAuth.restoreSession();
        if (isMounted) {
          if (session?.user) {
            const currentUser = getCurrentUser();
            if (currentUser) {
              try {
                const dbProfile = await fetchUserProfileFromDb(currentUser.id, session.access_token);
                if (dbProfile) {
                  if (dbProfile.pathway) {
                    currentUser.pathway = dbProfile.pathway as HealthPathway;
                    setPathwayState(dbProfile.pathway as HealthPathway);
                  }
                  if (dbProfile.isOnboarded !== undefined) {
                    currentUser.isOnboarded = dbProfile.isOnboarded;
                  }
                  if (dbProfile.profilePhotoUrl) {
                    currentUser.avatarUrl = dbProfile.profilePhotoUrl;
                  }
                }
              } catch (e) {
                console.warn('[BioPulse AuthContext] Profile load error:', e);
              }
              setUser({ ...currentUser });
              if (currentUser.pathway) {
                setPathwayState(currentUser.pathway);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[BioPulse AuthContext] Session restore error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // 2. Listen for Supabase session changes
    const unsubscribe = subscribeToAuthChanges((session) => {
      if (!isMounted) return;
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

    // 3. Listen for global API 401 auth failures (session expiration)
    const unsubscribeAuthFailure = registerAuthFailureListener(async () => {
      console.warn('[BioPulse AuthContext] Global 401 Authentication Failure detected. Expiring session safely.');
      try {
        await logoutUser();
      } catch (e) {
        console.warn('[BioPulse AuthContext] Logout on 401 error:', e);
      }
      if (isMounted) {
        setUser(null);
        setPathwayState(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      unsubscribeAuthFailure();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await loginWithEmailAndPassword(email, password);
      if (res.success && res.user) {
        setAuthExpired(false);
        const loadedUser = { ...res.user };
        if (res.user.accessToken) {
          try {
            const dbProfile = await fetchUserProfileFromDb(res.user.id, res.user.accessToken);
            if (dbProfile) {
              if (dbProfile.pathway) loadedUser.pathway = dbProfile.pathway as HealthPathway;
              if (dbProfile.isOnboarded !== undefined) loadedUser.isOnboarded = dbProfile.isOnboarded;
              if (dbProfile.profilePhotoUrl) loadedUser.avatarUrl = dbProfile.profilePhotoUrl;
            }
          } catch {
            // Non-blocking
          }
        }
        setUser(loadedUser);
        if (loadedUser.pathway) {
          setPathwayState(loadedUser.pathway);
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
        setAuthExpired(false);
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
      setAuthExpired(true);
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
      setUser({ ...updated });
    }
    if (user?.id && user?.accessToken) {
      updateUserPathwayInDb(user.id, user.accessToken, newPathway).catch((err) => {
        console.warn('[BioPulse AuthContext] Error updating pathway in DB:', err);
      });
    }
  }, [user?.id, user?.accessToken]);

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
