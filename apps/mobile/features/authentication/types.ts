export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
}
