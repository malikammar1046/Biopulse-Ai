import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../types/onboarding';
import { DEFAULT_USER_PROFILE, createEmptyUserProfile } from '../data/mockDashboardData';
import { clearAllLocalAssessments } from '../services/intelligenceService';
import { lifestyleService } from '../services/lifestyleService';
import { nutritionService } from '../services/nutritionService';
import { changeLocale } from '../i18n/locale';
import type { SupportedLocale } from '../i18n/types';

interface AuthContextType {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  userProfile: UserProfile;
  loading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (payload: LoginPayload) => Promise<{ success: boolean; profile?: UserProfile; error?: string }>;
  loginWithGoogle: (redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; emailConfirmationRequired?: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveOnboardingProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  resetToDefaultProfile: () => void;
  deleteAccountAndData: () => Promise<{ success: boolean; error?: string }>;
  updateUserLanguage: (locale: 'en' | 'ur') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_PROFILE_KEY = 'ovasense_user_profile_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile state with local storage fallback
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return createEmptyUserProfile();
  });

  const userProfileRef = useRef<UserProfile>(userProfile);
  userProfileRef.current = userProfile;

  // Track active registration to prevent onAuthStateChange from preempting local state with incomplete remote fetches
  const isRegisteringRef = useRef(false);

  // Track active background profile persistence to avoid write races with immediate subsequent updates
  const activePersistencePromiseRef = useRef<Promise<{ success: boolean; error?: string }> | null>(null);

  const loadProfile = useCallback(async (activeUser: SupabaseUser): Promise<UserProfile> => {
    const userMeta = activeUser.user_metadata || {};
    const metaFullName =
      userMeta.full_name ||
      userMeta.name ||
      userMeta.user_name ||
      (activeUser.email ? activeUser.email.split('@')[0] : '');
    const metaAvatarUrl = userMeta.avatar_url || userMeta.picture || '';
    const metaGender = (userMeta.gender as any) || undefined;
    const metaPathway = (userMeta.pathway as any) || undefined;

    const { profile } = await profileService.fetchUserProfile(activeUser.id, {
      id: activeUser.id,
      email: activeUser.email || '',
      fullName: metaFullName,
      dateOfBirth: userMeta.date_of_birth,
      gender: metaGender,
      pathway: metaPathway,
    });

    // In-memory profile fallback
    const currentInMemory = userProfileRef.current;
    const inMemoryPathway = currentInMemory.id === activeUser.id ? currentInMemory.pathway : undefined;
    const inMemoryGender = currentInMemory.id === activeUser.id ? currentInMemory.gender : undefined;

    const metaLanguage = (userMeta.preferred_language as SupportedLocale) || undefined;
    if (metaLanguage === 'en' || metaLanguage === 'ur') {
      await changeLocale(metaLanguage, true);
    }

    if (profile) {
      // Prioritize explicit metadata and profile pathway, then in-memory pathway, then gender-derived
      const resolvedPathway =
        metaPathway ||
        profile.pathway ||
        inMemoryPathway ||
        (metaGender === 'female' ? 'female' : metaGender === 'male' ? 'male' : undefined) ||
        (profile.gender === 'female' ? 'female' : profile.gender === 'male' ? 'male' : undefined) ||
        (inMemoryGender === 'female' ? 'female' : inMemoryGender === 'male' ? 'male' : undefined) ||
        (profile.isOnboarded ? 'female' : undefined);

      const resolvedGender =
        metaGender ||
        profile.gender ||
        inMemoryGender ||
        (resolvedPathway === 'female' ? 'female' : resolvedPathway === 'male' ? 'male' : undefined);

      const updatedProfile: UserProfile = {
        ...profile,
        pathway: resolvedPathway,
        gender: resolvedGender,
        preferredLanguage: (metaLanguage === 'en' || metaLanguage === 'ur') ? metaLanguage : profile.preferredLanguage,
        waistCm: profile.waistCm ?? (userMeta.waist_cm !== undefined ? userMeta.waist_cm : undefined),
        mensHealth: profile.mensHealth || userMeta.mens_health || undefined,
        generalHealth: profile.generalHealth || userMeta.general_health || undefined,
        avatarUrl: profile.avatarUrl || (metaAvatarUrl ? metaAvatarUrl : undefined),
        fullName: profile.fullName || metaFullName,
      };
      setUserProfile(updatedProfile);
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
      } catch {
        // ignore
      }
      return updatedProfile;
    } else {
      // Create empty initial profile for new user
      const initialPathway =
        metaPathway ||
        inMemoryPathway ||
        (metaGender === 'female' ? 'female' : metaGender === 'male' ? 'male' : undefined) ||
        (inMemoryGender === 'female' ? 'female' : inMemoryGender === 'male' ? 'male' : undefined) ||
        undefined;
      const initialGender =
        metaGender ||
        inMemoryGender ||
        (initialPathway === 'female' ? 'female' : initialPathway === 'male' ? 'male' : undefined);

      const initial = createEmptyUserProfile({
        id: activeUser.id,
        email: activeUser.email || '',
        fullName: metaFullName,
        avatarUrl: metaAvatarUrl || undefined,
        dateOfBirth: userMeta.date_of_birth || '',
        gender: initialGender,
        pathway: initialPathway,
        isOnboarded: false,
      });
      setUserProfile(initial);
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(initial));
      } catch {
        // ignore
      }

      if (isSupabaseConfigured()) {
        await profileService.upsertUserProfile(initial, activeUser.id);
      }
      return initial;
    }
  }, []);

  // Initialize and listen to Supabase Auth State
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured()) {
      // Local demo mode: check localStorage
      setLoading(false);
      return;
    }

    // 1. Initial Session Check with safety timeout to prevent hanging splash screen
    const sessionPromise = supabase.auth.getSession().catch((err) => {
      console.warn('Error fetching initial session:', err);
      return { data: { session: null }, error: err };
    });

    const timeoutPromise = new Promise<{ data: { session: null }; timeout: boolean }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null }, timeout: true }), 750)
    );

    Promise.race([sessionPromise, timeoutPromise])
      .then(async (result) => {
        if (!isMounted) return;
        const currentSession = (result as any)?.data?.session ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Immediately unblock loading as soon as session status is determined
        setLoading(false);

        if (currentSession?.user) {
          // Sync profile in background without blocking initial UI render
          loadProfile(currentSession.user).catch((err) => {
            console.warn('Background profile sync warning:', err);
          });
        }
      })
      .catch((err) => {
        console.error('Error during auth initialization:', err);
        if (isMounted) setLoading(false);
      });

    // 2. Auth State Subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (isRegisteringRef.current) {
        // Registration is orchestrating the user and profile state.
        // Prevent onAuthStateChange from racing or overwriting the local registration profile.
        setLoading(false);
        return;
      }

      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        // Logged out
        setUserProfile(createEmptyUserProfile());
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (
    payload: LoginPayload
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
    const res = await authService.login(payload);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    if (res.session?.user) {
      setUser(res.session.user);
      setSession(res.session);
      const loaded = await loadProfile(res.session.user);
      return { success: true, profile: loaded };
    } else if (res.user && !isSupabaseConfigured()) {
      // Mock login handling
      const demoProfile: UserProfile = {
        ...userProfile,
        id: res.user.id,
        email: res.user.email,
        fullName: res.user.fullName || userProfile.fullName,
      };
      setUserProfile(demoProfile);
      return { success: true, profile: demoProfile };
    }

    return { success: true, profile: userProfile };
  };

  const loginWithGoogle = async (
    redirectTo?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.loginWithGoogle(redirectTo);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    if (!isSupabaseConfigured()) {
      // Mock login handling for demo mode
      const demoProfile: UserProfile = {
        ...userProfile,
        id: 'demo-google-user-001',
        email: 'google.user@example.com',
        fullName: 'Google User',
        isOnboarded: true,
      };
      setUserProfile(demoProfile);
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(demoProfile));
      } catch {
        // ignore
      }
    }

    return { success: true };
  };

  const register = async (
    payload: RegisterPayload
  ): Promise<{ success: boolean; emailConfirmationRequired?: boolean; error?: string }> => {
    isRegisteringRef.current = true;
    try {
      const res = await authService.register(payload);
      if (!res.success) {
        isRegisteringRef.current = false;
        return { success: false, error: res.error };
      }

      if (res.session?.user) {
        setUser(res.session.user);
        setSession(res.session);
        const newProfile = createEmptyUserProfile({
          id: res.session.user.id,
          email: payload.email,
          fullName: payload.fullName,
          dateOfBirth: '',
          gender: payload.gender,
          pathway: payload.pathway,
          isOnboarded: false,
        });
        setUserProfile(newProfile);
        try {
          localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
        } catch {
          // ignore
        }

        // Start non-blocking safe persistence in background with robust tracking
        const persistencePromise = profileService
          .upsertUserProfile(newProfile, res.session.user.id)
          .catch((persistErr) => {
            console.error('Non-blocking registration profile persistence error:', persistErr);
            return { success: false, error: persistErr?.message };
          })
          .finally(() => {
            isRegisteringRef.current = false;
          });

        activePersistencePromiseRef.current = persistencePromise;

        return { success: true, emailConfirmationRequired: false };
      } else if (res.user) {
        if (!isSupabaseConfigured()) {
          const newProfile = createEmptyUserProfile({
            id: res.user.id,
            email: payload.email,
            fullName: payload.fullName,
            dateOfBirth: '',
            gender: payload.gender,
            pathway: payload.pathway,
            isOnboarded: false,
          });
          setUserProfile(newProfile);
          try {
            localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
          } catch {
            // ignore
          }
          isRegisteringRef.current = false;
          return { success: true, emailConfirmationRequired: false };
        }
        isRegisteringRef.current = false;
        return { success: true, emailConfirmationRequired: true };
      }

      isRegisteringRef.current = false;
      return { success: true };
    } catch (err: any) {
      isRegisteringRef.current = false;
      return { success: false, error: err?.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setSession(null);
    setUserProfile(createEmptyUserProfile());
    clearAllLocalAssessments();
    lifestyleService.clearCache();
    nutritionService.clearCache();
    try {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
      localStorage.removeItem('ovasense_user_reminders_v1');
    } catch {}
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const saveOnboardingProfile = async (
    data: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    // Await any pending background registration persistence to avoid write races
    if (activePersistencePromiseRef.current) {
      try {
        await activePersistencePromiseRef.current;
      } catch (e) {
        console.warn('Pending registration persistence warning:', e);
      }
    }

    const updated: UserProfile = {
      ...userProfile,
      ...data,
      medical: { ...userProfile.medical, ...(data.medical || {}) },
      womensHealth: { ...userProfile.womensHealth, ...(data.womensHealth || {}) },
      lifestyle: { ...userProfile.lifestyle, ...(data.lifestyle || {}) },
      goals: { ...userProfile.goals, ...(data.goals || {}) },
      emergencyContacts: data.emergencyContacts || userProfile.emergencyContacts,
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    };

    const targetUserId = user?.id || userProfile.id;
    if (!targetUserId) {
      return { success: false, error: 'User ID is required to save profile.' };
    }
    const res = await profileService.upsertUserProfile(updated, targetUserId);

    if (!res.success) {
      return { success: false, error: res.error || 'Failed to save profile to database.' };
    }

    setUserProfile(updated);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return { success: true };
  };

  const updateUserProfile = async (
    data: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    // Await any pending background registration persistence to avoid write races
    if (activePersistencePromiseRef.current) {
      try {
        await activePersistencePromiseRef.current;
      } catch (e) {
        console.warn('Pending registration persistence warning:', e);
      }
    }

    // 1. Optimistically update local state immediately so UI and route guards react instantly
    const optimistic: UserProfile = {
      ...userProfile,
      ...data,
      avatarUrl: 'avatarUrl' in data ? (data.avatarUrl || undefined) : userProfile.avatarUrl,
      gender: data.gender || userProfile.gender || 'female',
      pathway: data.pathway || userProfile.pathway || 'female',
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(optimistic);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(optimistic));
    } catch {
      // ignore
    }

    const targetUserId = user?.id || userProfile.id;
    if (!targetUserId) {
      return { success: false, error: 'User ID is required to update profile.' };
    }
    const res = await profileService.updateProfileFields(targetUserId, optimistic, data);

    if (!res.success) {
      return { success: false, error: res.error || 'Failed to update profile.' };
    }

    if (res.profile) {
      const confirmed: UserProfile = {
        ...res.profile,
        avatarUrl: 'avatarUrl' in data ? (data.avatarUrl || undefined) : res.profile.avatarUrl,
        gender: data.gender || res.profile.gender || optimistic.gender,
        pathway: data.pathway || res.profile.pathway || optimistic.pathway,
      };
      setUserProfile(confirmed);
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(confirmed));
      } catch {
        // ignore
      }
    }

    return { success: true };
  };

  const resetToDefaultProfile = () => {
    setUserProfile(DEFAULT_USER_PROFILE);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(DEFAULT_USER_PROFILE));
    } catch {
      // ignore
    }
  };

  const deleteAccountAndData = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const activeUserId = user?.id || userProfile.id;

      if (isSupabaseConfigured() && activeUserId) {
        try {
          await profileService.deleteUserProfile(activeUserId);
        } catch (e) {
          console.warn('Could not delete remote Supabase profile:', e);
        }
      }

      try {
        const allKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) allKeys.push(key);
        }
        allKeys.forEach((key) => {
          if (
            key.startsWith('symptoms_') ||
            key.startsWith('reports_') ||
            key.startsWith('meds_') ||
            key.startsWith('med_logs_') ||
            key.startsWith('fitness_') ||
            key.startsWith('cycles_') ||
            key.startsWith('diet_') ||
            key.startsWith('care_circle_') ||
            key.startsWith('appointments_') ||
            key.startsWith('ovasense_') ||
            key.startsWith('vitasense_') ||
            key.startsWith('androsense_') ||
            key.startsWith('adaptive_') ||
            key.startsWith('sb-') ||
            key.includes('profile') ||
            key.includes('reminders')
          ) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Could not clean localStorage:', e);
      }

      try {
        sessionStorage.clear();
      } catch {}

      try {
        await authService.logout();
      } catch {}

      setUser(null);
      setSession(null);
      setUserProfile(DEFAULT_USER_PROFILE);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete account and data.' };
    }
  };

  const updateUserLanguage = async (locale: 'en' | 'ur') => {
    await changeLocale(locale, true);
    setUserProfile((prev) => {
      const next = { ...prev, preferredLanguage: locale };
      try {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    if (user && isSupabaseConfigured()) {
      try {
        await supabase.auth.updateUser({
          data: { preferred_language: locale },
        });
      } catch (err) {
        console.warn('Failed to persist preferred_language to user_metadata:', err);
      }
    }
  };

  const isAuthenticated = isSupabaseConfigured() ? Boolean(user) : Boolean(userProfile.id);
  const isOnboarded = userProfile.isOnboarded;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        isAuthenticated,
        isOnboarded,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
        saveOnboardingProfile,
        updateUserProfile,
        resetToDefaultProfile,
        deleteAccountAndData,
        updateUserLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
