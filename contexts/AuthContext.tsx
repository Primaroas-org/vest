import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  balance: number;
}

// Session timeout constants (5 minutes total, warn at 4 minutes)
export const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const WARNING_TIME_MS = 4 * 60 * 1000; // 4 minutes (warn 1 minute before)

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  showTimeoutWarning: boolean; // Whether to show the warning modal
  resetSessionTimeout: () => void; // Reset the timeout on user activity
  getLastActivityTime: () => number; // Get the last activity timestamp for local countdown
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionHandledRef = useRef(false);
  const fetchingProfileRef = useRef<Promise<void> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  
  // Session timeout state - only boolean warning, no countdown in context (avoids re-renders)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Handle email confirmation callback
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set the session with the tokens from the email confirmation
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('Error setting session from email confirmation:', error);
        } else         if (data.session) {
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          // Reset activity timer on email confirmation
          lastActivityRef.current = Date.now();
          // Fetch user profile
          await fetchUserProfile(data.session.user);
        }
      }
    };

    // Check for email confirmation tokens in URL
    if (window.location.hash.includes('access_token')) {
      handleEmailConfirmation();
    }

    // Get session IMMEDIATELY on mount (don't wait for INITIAL_SESSION event)
    // This ensures fast auth state restoration
    const initializeAuth = async () => {
      try {
        // Get session from Supabase (this handles persistence automatically)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user && session?.access_token) {
          // Cache the token for API calls (Supabase handles its own persistence)
          localStorage.setItem('supabase.auth.token', session.access_token);
          sessionHandledRef.current = true;
          currentUserIdRef.current = session.user.id;
          // Reset activity timer when session is restored
          lastActivityRef.current = Date.now();
          await fetchUserProfile(session.user);
        } else {
          // No session
          setUser(null);
          sessionHandledRef.current = true;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        sessionHandledRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    // Initialize immediately
    initializeAuth();

    // Listen for auth changes (for subsequent auth events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip INITIAL_SESSION since we already handled it above
      if (event === 'INITIAL_SESSION') {
        // Only update if we haven't handled it yet (shouldn't happen, but safety check)
        if (!sessionHandledRef.current && session?.user && session?.access_token) {
          localStorage.setItem('supabase.auth.token', session.access_token);
          await fetchUserProfile(session.user);
          setLoading(false);
        }
        return;
      }

      console.log('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user && session?.access_token) {
          console.log('Processing sign in for user:', session.user.id);
          // Store the access token for API calls
          localStorage.setItem('supabase.auth.token', session.access_token);
          // Reset activity timer on sign in
          lastActivityRef.current = Date.now();
          // fetchUserProfile will handle duplicate prevention internally
          await fetchUserProfile(session.user);
          console.log('Finished fetching user profile');
        } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          // Just update token if it was refreshed but user profile fetch isn't needed
          localStorage.setItem('supabase.auth.token', session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        // Clear the token when logged out
        localStorage.removeItem('supabase.auth.token');
        setUser(null);
        currentUserIdRef.current = null;
        fetchingProfileRef.current = null;
      } else if (event === 'USER_UPDATED') {
        // Handle user updates (e.g., email confirmation)
        if (session?.user && session?.access_token) {
          localStorage.setItem('supabase.auth.token', session.access_token);
          lastActivityRef.current = Date.now();
          await fetchUserProfile(session.user);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      sessionHandledRef.current = false;
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    // If a fetch is already in progress for this user, wait for it to complete
    if (fetchingProfileRef.current && currentUserIdRef.current === supabaseUser.id) {
      console.log('Profile fetch already in progress for user:', supabaseUser.id, '- waiting for completion');
      try {
        await fetchingProfileRef.current;
        // After waiting, check if user was set - if not, the fetch might have failed
        // We'll let the current fetch complete and trust it set the user
        return;
      } catch (error) {
        console.error('Error waiting for profile fetch:', error);
        // If the in-progress fetch failed, we'll retry
        fetchingProfileRef.current = null;
        currentUserIdRef.current = null;
      }
    }

    // Create a promise for this fetch
    const fetchPromise = (async () => {
      currentUserIdRef.current = supabaseUser.id;

      try {
        console.log('Fetching user profile for ID:', supabaseUser.id);

        // Try API endpoint first (much faster, uses Drizzle ORM directly)
        // Get token from session or localStorage
        let token = localStorage.getItem('supabase.auth.token');
        if (!token) {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token || null;
          if (token) {
            localStorage.setItem('supabase.auth.token', token);
          }
        }
        
        // Only try API if we have a token
        if (token) {
          try {
            const apiResponse = await fetch('/api/user/me', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

          if (apiResponse.ok) {
            const result = await apiResponse.json();
            if (result.success && result.data) {
              const apiUser = result.data;
              const userData: User = {
                id: apiUser.id,
                name: apiUser.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
                email: apiUser.email || supabaseUser.email || '',
                avatar: supabaseUser.user_metadata?.avatar_url,
                isVerified: apiUser.kyc_status === 'verified' || false,
                kycStatus: apiUser.kyc_status ? (apiUser.kyc_status as 'pending' | 'verified' | 'rejected') : undefined,
                balance: parseFloat(apiUser.wallet_balance || '0')
              };
              console.log('User profile loaded from API:', userData);
              lastActivityRef.current = Date.now();
              setUser(userData);
              console.log('User state set successfully');
              return;
            }
          } else if (apiResponse.status === 404) {
            // User doesn't exist in database, create it
            console.log('User not found in database (404), creating user record...');
            await createUserFromAuth(supabaseUser);
            // Wait a moment for the database to process
            await new Promise(resolve => setTimeout(resolve, 500));
            // Retry API call
            const retryResponse = await fetch('/api/user/me', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              if (retryResult.success && retryResult.data) {
                const apiUser = retryResult.data;
                const userData: User = {
                  id: apiUser.id,
                  name: apiUser.full_name || supabaseUser.user_metadata?.full_name || 'User',
                  email: apiUser.email || supabaseUser.email || '',
                  avatar: supabaseUser.user_metadata?.avatar_url,
                  isVerified: apiUser.kyc_status === 'verified' || false,
                  kycStatus: apiUser.kyc_status ? (apiUser.kyc_status as 'pending' | 'verified' | 'rejected') : undefined,
                  balance: parseFloat(apiUser.wallet_balance || '0')
                };
                console.log('User profile loaded after creation:', userData);
                lastActivityRef.current = Date.now();
                setUser(userData);
                return;
              }
            }
          }
          console.log('API call failed or returned unexpected result, falling back to Supabase query');
          } catch (apiError) {
            console.log('API call error, falling back to Supabase query:', apiError);
          }
        } else {
          console.log('No token available, using Supabase query');
        }

        // Fallback to Supabase query if API fails (with shorter timeout)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => {
            reject(new Error('TIMEOUT'));
          }, 3000) // Reduced to 3 seconds since API should handle most cases
        );

        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        // Race between query and timeout
        let profile, error;
        try {
          const result = await Promise.race([queryPromise, timeoutPromise]);
          profile = result.data;
          error = result.error;
        } catch (timeoutError: any) {
          if (timeoutError?.message === 'TIMEOUT' || timeoutError?.message?.includes('timeout')) {
            console.error('Profile query timed out after 3 seconds');
            error = { code: 'TIMEOUT', message: 'Query timeout' };
            profile = null;
          } else {
            throw timeoutError;
          }
        }

        console.log('Profile fetch result:', { profile, error, errorCode: error?.code });

        if (error) {
          console.error('Error fetching profile:', error);

          // Handle timeout - preserve existing user balance if available
          if (error.code === 'TIMEOUT') {
            console.log('Query timed out, setting fallback user');
            const existingBalance = user?.balance || 0;
            const fallbackUser: User = {
              id: supabaseUser.id,
              name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
              email: supabaseUser.email || '',
              avatar: supabaseUser.user_metadata?.avatar_url,
              isVerified: false,
              balance: existingBalance
            };
            console.log('Setting fallback user due to timeout (preserving balance):', fallbackUser);
            lastActivityRef.current = Date.now();
            setUser(fallbackUser);
            return;
          }

          // If user doesn't exist in users table (PGRST116 = no rows returned), create it
          if (error.code === 'PGRST116') {
            console.log('User not found in database, creating user record...');
            await createUserFromAuth(supabaseUser);
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Retrying profile fetch after creation...');
            const { data: newProfile, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single();

            if (retryError) {
              console.error('Error fetching profile after creation:', retryError);
              const existingBalance = user?.balance || 0;
              const fallbackUser: User = {
                id: supabaseUser.id,
                name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
                email: supabaseUser.email || '',
                avatar: supabaseUser.user_metadata?.avatar_url,
                isVerified: false,
                balance: existingBalance
              };
              console.log('Setting fallback user due to retry error (preserving balance):', fallbackUser);
              lastActivityRef.current = Date.now();
              setUser(fallbackUser);
              return;
            }

            const userData: User = {
              id: supabaseUser.id,
              name: newProfile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
              email: supabaseUser.email || '',
              avatar: supabaseUser.user_metadata?.avatar_url,
              isVerified: newProfile?.kyc_status === 'verified' || false,
              kycStatus: (newProfile?.kyc_status as 'pending' | 'verified' | 'rejected') || undefined,
              balance: parseFloat(newProfile?.wallet_balance || '0')
            };
            console.log('User profile loaded after creation:', userData);
            lastActivityRef.current = Date.now();
            setUser(userData);
            return;
          }
          
          console.error('Non-recoverable error fetching profile, code:', error.code);
          const existingBalance = user?.balance || 0;
          const fallbackUser: User = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            email: supabaseUser.email || '',
            avatar: supabaseUser.user_metadata?.avatar_url,
            isVerified: false,
            balance: existingBalance
          };
          console.log('Setting fallback user due to non-recoverable error (preserving balance):', fallbackUser);
          lastActivityRef.current = Date.now();
          setUser(fallbackUser);
          return;
        }

        const userData: User = {
          id: supabaseUser.id,
          name: profile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url,
          isVerified: profile?.kyc_status === 'verified' || false,
          kycStatus: (profile?.kyc_status as 'pending' | 'verified' | 'rejected') || undefined,
          balance: parseFloat(profile?.wallet_balance || '0')
        };

        console.log('User profile loaded:', userData);
        lastActivityRef.current = Date.now();
        setUser(userData);
        console.log('User state set successfully');
      } catch (error) {
        console.error('Error fetching user profile (exception):', error);
        // Set fallback user even on exception
        // Preserve existing balance if user was already loaded
        const existingBalance = user?.balance || 0;
        const fallbackUser: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url,
          isVerified: false,
          balance: existingBalance
        };
        console.log('Setting fallback user due to exception (preserving balance):', fallbackUser);
        lastActivityRef.current = Date.now();
        setUser(fallbackUser);
      } finally {
        console.log('Profile fetch completed, clearing refs');
        fetchingProfileRef.current = null;
        currentUserIdRef.current = null;
      }
    })();

    fetchingProfileRef.current = fetchPromise;
    await fetchPromise;
    console.log('fetchUserProfile function completed');
  };

  const createUserFromAuth = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Creating user record:', {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || 'User'
      });

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          full_name: supabaseUser.user_metadata?.full_name || 'User',
          wallet_balance: '0.00',
          kyc_status: 'pending',
          is_active: true,
          is_admin: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error, 'Error code:', error.code);
      } else {
        console.log('User created successfully:', data);
      }
    } catch (error) {
      console.error('Error creating user from auth (exception):', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setLoading(false);
        // Provide more helpful error messages
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Please check your email and click the confirmation link before logging in.' };
        }
        return { error: error.message };
      }

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        setLoading(false);
        return { error: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.' };
      }

      // Session should be automatically established, but ensure we have it
      if (data.session) {
        localStorage.setItem('supabase.auth.token', data.session.access_token);
        // Reset activity timer on login
        lastActivityRef.current = Date.now();
        await fetchUserProfile(data.user);
      }

      setLoading(false);
      return {};
    } catch (error) {
      setLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      // If email confirmation is required, inform the user
      if (data.user && !data.session) {
        setLoading(false);
        return {
          error: null,
          message: 'Please check your email and click the confirmation link to complete your registration.'
        };
      }

      // If session is created immediately (email confirmation disabled)
      if (data.session && data.user) {
        localStorage.setItem('supabase.auth.token', data.session.access_token);
        // Reset activity timer on registration
        lastActivityRef.current = Date.now();
        // Wait a bit for the trigger to create the user record
        setTimeout(async () => {
          await fetchUserProfile(data.user);
        }, 1000);
      }

      return {};
    } catch (error) {
      setLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session?.access_token) {
        console.log('[AuthContext] Refreshing user profile via API...');

        // Use the API endpoint to get the latest user data from backend
        const token = session.access_token;
        const response = await fetch('/api/user/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[AuthContext] API response:', result);
          if (result.success && result.data) {
            const apiUser = result.data;
            console.log('[AuthContext] API user data kyc_status:', apiUser.kyc_status);
            const userData: User = {
              id: apiUser.id,
              name: apiUser.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: apiUser.email || session.user.email || '',
              avatar: session.user.user_metadata?.avatar_url,
              isVerified: apiUser.kyc_status === 'verified' || false,
              kycStatus: apiUser.kyc_status ? (apiUser.kyc_status as 'pending' | 'verified' | 'rejected') : undefined,
              balance: parseFloat(apiUser.wallet_balance || '0')
            };
            console.log('[AuthContext] User profile refreshed from API:', userData);
            console.log('[AuthContext] Setting user state with kycStatus:', userData.kycStatus);
            // Reset activity timer when refreshing user
            lastActivityRef.current = Date.now();
            // Force state update by creating a new object reference
            setUser({ ...userData });
            return;
          }
        } else {
          console.error('[AuthContext] API refresh failed with status:', response.status);
          const errorText = await response.text();
          console.error('[AuthContext] API error response:', errorText);
        }

        // Fallback to Supabase query if API fails
        console.log('[AuthContext] API refresh failed, falling back to Supabase query...');
        await fetchUserProfile(session.user);
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing user:', error);
      // Try fallback to Supabase query
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user);
        }
      } catch (fallbackError) {
        console.error('[AuthContext] Fallback refresh also failed:', fallbackError);
      }
    }
  };

  // Get last activity time for local countdown in UI components
  const getLastActivityTime = useCallback(() => lastActivityRef.current, []);

  // Reset session timeout on user activity
  const resetSessionTimeout = useCallback(() => {
    if (!user) return;
    
    lastActivityRef.current = Date.now();
    setShowTimeoutWarning(false);
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Set warning timeout (4 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, WARNING_TIME_MS);
    
    // Set logout timeout (5 minutes)
    timeoutRef.current = setTimeout(async () => {
      console.log('[AuthContext] Session timeout - logging out');
      setShowTimeoutWarning(false);
      await logout();
    }, SESSION_TIMEOUT_MS);
  }, [user, logout]);

  // Clean up timeouts when user logs out
  useEffect(() => {
    if (!user) {
      setShowTimeoutWarning(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
    }
  }, [user]);

  // Set up activity listeners with throttling to avoid excessive calls
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    // Note: 'mousemove' removed - too frequent, other events are sufficient
    
    let lastThrottledCall = 0;
    const THROTTLE_MS = 30000; // Only reset timeout at most every 30 seconds on activity
    
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottledCall >= THROTTLE_MS) {
        lastThrottledCall = now;
        resetSessionTimeout();
      } else {
        // Still update lastActivity for UI countdown accuracy, but don't reset timeouts
        lastActivityRef.current = Date.now();
      }
    };

    // Add event listeners with passive flag for better scroll performance
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { capture: true, passive: true });
    });

    // Initialize timeout
    resetSessionTimeout();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, resetSessionTimeout]);

  // Safeguard: Check for session restoration if user is null but session exists
  // This handles cases where session wasn't properly restored on initial load
  useEffect(() => {
    if (!loading && !user && !sessionHandledRef.current) {
      // Only check once after loading completes
      const checkSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user && session?.access_token) {
            console.log('[AuthContext] Found existing session, restoring user...');
            localStorage.setItem('supabase.auth.token', session.access_token);
            lastActivityRef.current = Date.now();
            await fetchUserProfile(session.user);
          }
        } catch (error) {
          console.error('[AuthContext] Error checking session:', error);
        }
      };
      // Small delay to avoid race conditions
      const timer = setTimeout(checkSession, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  // Memoize context value to prevent unnecessary consumer re-renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    resetPassword,
    refreshUser,
    loading,
    showTimeoutWarning,
    resetSessionTimeout,
    getLastActivityTime
  }), [user, loading, showTimeoutWarning, logout, resetSessionTimeout, getLastActivityTime]);

  return (
    <AuthContext.Provider value={contextValue}>
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