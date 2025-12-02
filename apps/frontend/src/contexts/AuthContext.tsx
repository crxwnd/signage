/**
 * Auth Context
 * Global authentication state management
 * Handles user session, login, logout, and token refresh
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getMe,
  refreshToken,
  clearAccessToken,
  type User,
  type LoginPayload,
  type RegisterPayload,
  ApiError,
} from '@/lib/api/auth';

/**
 * Auth context state
 */
interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

/**
 * Create auth context
 */
const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Manages authentication state and provides auth functions
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check authentication status
   * Attempts to refresh token and fetch user data
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Try to refresh token from cookie
      await refreshToken();

      // Fetch current user data
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      // Not authenticated or token expired
      setUser(null);
      clearAccessToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(
    async (payload: LoginPayload) => {
      try {
        setIsLoading(true);

        // Call login API
        const response = await apiLogin(payload);

        // Check if 2FA is required
        if ('requiresTwoFactor' in response) {
          // TODO: Handle 2FA in future implementation
          throw new ApiError('2FA not yet implemented', '2FA_REQUIRED');
        }

        // Set user data
        setUser(response.user);

        // Redirect to displays page
        router.push('/displays');
      } catch (error) {
        setUser(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Register user
   */
  const register = useCallback(
    async (payload: RegisterPayload) => {
      try {
        setIsLoading(true);

        // Call register API
        const response = await apiRegister(payload);

        // Set user data
        setUser(response.user);

        // Redirect to displays page
        router.push('/displays');
      } catch (error) {
        setUser(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Call logout API
      await apiLogout();
    } finally {
      // Always clear user state
      setUser(null);
      clearAccessToken();

      // Redirect to login page
      router.push('/login');
    }
  }, [router]);

  /**
   * Check auth on mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Auto refresh token every 10 minutes
   * Access token expires in 15 minutes, so we refresh at 10 minutes
   */
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(
      async () => {
        try {
          await refreshToken();
        } catch (error) {
          // Token refresh failed, log out user
          setUser(null);
          clearAccessToken();
          router.push('/login');
        }
      },
      10 * 60 * 1000
    ); // 10 minutes

    return () => clearInterval(interval);
  }, [user, router]);

  const value: AuthContextState = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
