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
  useRef,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getMe,
  refreshToken,
  clearAccessToken,
  getAccessToken,
  type User,
  type LoginPayload,
  type RegisterPayload,
  ApiError,
} from '@/lib/api/auth';
import { debugLog, debugWarn } from '@/lib/debug';

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
  refreshUser: () => Promise<void>;
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
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs to prevent multiple executions
  const hasInitialized = useRef(false);
  const isCheckingAuth = useRef(false);
  const mountedRef = useRef(true);

  /**
   * Check authentication status
   * Attempts to refresh token and fetch user data
   */
  const checkAuth = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingAuth.current) {
      debugLog('Auth', 'Already checking auth, skipping...');
      return;
    }

    // Don't check on login page
    if (pathname === '/login' || pathname === '/register') {
      debugLog('Auth', 'On auth page, skipping check');
      setIsLoading(false);
      return;
    }

    isCheckingAuth.current = true;
    debugLog('Auth', 'Starting auth check...');

    try {
      // First check if we have a token at all
      const existingToken = getAccessToken();

      if (!existingToken) {
        // No token, try to refresh from cookie
        debugLog('Auth', 'No access token, trying refresh...');
        const newToken = await refreshToken();

        if (!newToken) {
          debugLog('Auth', 'No valid session');
          if (mountedRef.current) {
            setUser(null);
            setIsLoading(false);
          }
          isCheckingAuth.current = false;
          return;
        }
      }

      // Fetch current user data
      debugLog('Auth', 'Fetching user data...');
      const userData = await getMe();

      if (mountedRef.current) {
        setUser(userData);
        debugLog('Auth', 'User loaded:', userData.email);
      }
    } catch (error) {
      // Not authenticated or token expired
      debugWarn('Auth', 'Check auth failed:', error);
      if (mountedRef.current) {
        setUser(null);
        clearAccessToken();
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      isCheckingAuth.current = false;
    }
  }, [pathname]);

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
        hasInitialized.current = true;

        // Redirect to displays page
        router.push('/home');
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
        hasInitialized.current = true;

        // Redirect to displays page
        router.push('/home');
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
   * Clears state immediately and redirects to login
   */
  const logout = useCallback(async () => {
    debugLog('Auth', 'Logging out...');

    // Reset initialization flag
    hasInitialized.current = false;

    // Clear state FIRST to prevent any re-auth attempts
    setUser(null);
    clearAccessToken();

    // Call logout API in background (don't wait for response)
    apiLogout().catch((err) => {
      // Ignore errors - we're logging out anyway
      debugLog('Auth', 'Logout API error (ignored):', err);
    });

    // Use window.location for clean redirect (avoids Next.js router issues)
    window.location.href = '/login';
  }, []);

  /**
   * Refresh user data without full re-auth
   * Used after changes like 2FA enable/disable
   */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await getMe();
      if (mountedRef.current) {
        setUser(userData);
      }
    } catch (error) {
      debugWarn('Auth', 'Failed to refresh user:', error);
    }
  }, []);

  /**
   * Check auth ONCE on mount
   */
  useEffect(() => {
    mountedRef.current = true;

    // Only initialize once
    if (hasInitialized.current) {
      debugLog('Auth', 'Already initialized, skipping...');
      setIsLoading(false);
      return;
    }
    hasInitialized.current = true;

    checkAuth();

    return () => {
      mountedRef.current = false;
    };
  }, [checkAuth]);

  /**
   * Auto refresh token every 10 minutes
   * Access token expires in 15 minutes, so we refresh at 10 minutes
   */
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(
      async () => {
        // Don't refresh if already checking
        if (isCheckingAuth.current) return;

        try {
          debugLog('Auth', 'Auto-refreshing token...');
          const token = await refreshToken();
          if (!token && mountedRef.current) {
            // Token refresh failed silently, log out user
            debugWarn('Auth', 'Auto-refresh failed, logging out...');
            setUser(null);
            clearAccessToken();
            hasInitialized.current = false;
            window.location.href = '/login';
          }
        } catch (error) {
          // Token refresh failed, log out user
          debugWarn('Auth', 'Auto-refresh error:', error);
          if (mountedRef.current) {
            setUser(null);
            clearAccessToken();
            hasInitialized.current = false;
            window.location.href = '/login';
          }
        }
      },
      10 * 60 * 1000
    ); // 10 minutes

    return () => clearInterval(interval);
  }, [user]);

  const value: AuthContextState = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    refreshUser,
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
