/**
 * PMOSense Authentication Service Layer
 *
 * Clean decoupled service boundary for authentication operations.
 * Future integration with Django REST / Supabase Auth will replace
 * these mock implementations without requiring UI changes.
 */

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  dateOfBirth?: string;
  consent: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  dateOfBirth?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

class AuthService {
  /**
   * Simulate user login
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    // Simulate network latency (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!payload.email || !payload.password) {
      return {
        success: false,
        error: 'Please provide both an email address and password.',
      };
    }

    // Mock successful authentication
    return {
      success: true,
      user: {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: payload.email,
        fullName: payload.email.split('@')[0],
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Simulate user registration
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (!payload.consent) {
      return {
        success: false,
        error: 'Clinical acknowledgment consent is required to proceed.',
      };
    }

    if (!payload.email || !payload.password || !payload.fullName) {
      return {
        success: false,
        error: 'Required fields are missing.',
      };
    }

    // Mock successful account creation
    return {
      success: true,
      user: {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: payload.email,
        fullName: payload.fullName,
        dateOfBirth: payload.dateOfBirth,
        createdAt: new Date().toISOString(),
      },
    };
  }
}

export const authService = new AuthService();
