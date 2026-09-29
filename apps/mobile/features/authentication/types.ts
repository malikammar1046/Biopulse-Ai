export type HealthPathway = 'female_pcos' | 'male_hypogonadism' | 'female' | 'male';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  gender?: string;
  pathway?: HealthPathway | null;
  createdAt: string;
  accessToken?: string;
  isDemoUser?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  pathway: HealthPathway | null;
}
