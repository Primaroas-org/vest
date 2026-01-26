import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  balance: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string; message?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionHandledRef = useRef(false);
  const fetchingProfileRef = useRef<Promise<void> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

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
        } else if (data.session) {
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
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
        // Check localStorage first for cached token
        const cachedToken = localStorage.getItem('supabase.auth.token');
        
        // Get session from Supabase (this is fast if session exists)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          localStorage.removeItem('supabase.auth.token');
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user && session?.access_token) {
          // Cache the token immediately
          localStorage.setItem('supabase.auth.token', session.access_token);
          sessionHandledRef.current = true;
          currentUserIdRef.current = session.user.id;
          await fetchUserProfile(session.user);
        } else {
          // No session
          localStorage.removeItem('supabase.auth.token');
          setUser(null);
          sessionHandledRef.current = true;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('supabase.auth.token');
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

      // Create a timeout that actually rejects after 3 seconds
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new Error('TIMEOUT'));
        }, 3000)
      );

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // Race between query and timeout - if timeout wins, we'll catch and use fallback
      let profile, error;
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        // If we got here, query completed (timeout didn't win)
        profile = result.data;
        error = result.error;
      } catch (timeoutError: any) {
        if (timeoutError?.message === 'TIMEOUT' || timeoutError?.message?.includes('timeout')) {
          console.error('Profile query timed out after 3 seconds - using fallback user');
          error = { code: 'TIMEOUT', message: 'Query timeout' };
          profile = null;
        } else {
          // Some other error occurred
          throw timeoutError;
        }
      }

      console.log('Profile fetch result:', { profile, error, errorCode: error?.code });

      if (error) {
        console.error('Error fetching profile:', error);
        
        // Handle timeout - set fallback user immediately
        if (error.code === 'TIMEOUT') {
          console.log('Query timed out, setting fallback user');
          const fallbackUser: User = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            email: supabaseUser.email || '',
            avatar: supabaseUser.user_metadata?.avatar_url,
            isVerified: false,
            balance: 0
          };
          console.log('Setting fallback user due to timeout:', fallbackUser);
          setUser(fallbackUser);
          return;
        }
        
        // If user doesn't exist in users table (PGRST116 = no rows returned), create it
        if (error.code === 'PGRST116') {
          console.log('User not found in database, creating user record...');
          await createUserFromAuth(supabaseUser);

          // Wait a moment for the database to process
          await new Promise(resolve => setTimeout(resolve, 500));

          // Retry fetching after creating
          console.log('Retrying profile fetch after creation...');
          const { data: newProfile, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          console.log('Retry result:', { newProfile, retryError });

          if (retryError) {
            console.error('Error fetching profile after creation:', retryError);
            // Even if retry fails, set a basic user object so login can proceed
            const fallbackUser: User = {
              id: supabaseUser.id,
              name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
              email: supabaseUser.email || '',
              avatar: supabaseUser.user_metadata?.avatar_url,
              isVerified: false,
              balance: 0
            };
            console.log('Setting fallback user due to retry error:', fallbackUser);
            setUser(fallbackUser);
            return;
          }

          const userData: User = {
            id: supabaseUser.id,
            name: newProfile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
            email: supabaseUser.email || '',
            avatar: supabaseUser.user_metadata?.avatar_url,
            isVerified: newProfile?.kyc_status === 'verified' || false,
            balance: parseFloat(newProfile?.wallet_balance || '0')
          };
          console.log('User profile loaded after creation:', userData);
          setUser(userData);
          return;
        }
        console.error('Non-recoverable error fetching profile, code:', error.code);
        // Even on error, set a basic user object so login can proceed
        const fallbackUser: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url,
          isVerified: false,
          balance: 0
        };
        console.log('Setting fallback user due to non-recoverable error:', fallbackUser);
        setUser(fallbackUser);
        return;
      }

      const userData: User = {
        id: supabaseUser.id,
        name: profile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
        email: supabaseUser.email || '',
        avatar: supabaseUser.user_metadata?.avatar_url,
        isVerified: profile?.kyc_status === 'verified' || false,
        balance: parseFloat(profile?.wallet_balance || '0')
      };

        console.log('User profile loaded:', userData);
        setUser(userData);
        console.log('User state set successfully');
      } catch (error) {
        console.error('Error fetching user profile (exception):', error);
        // Set fallback user even on exception
        const fallbackUser: User = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url,
          isVerified: false,
          balance: 0
        };
        console.log('Setting fallback user due to exception:', fallbackUser);
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      register,
      loading
    }}>
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