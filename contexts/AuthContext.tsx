import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Store the access token for API calls
        localStorage.setItem('supabase.auth.token', session.access_token);
        await fetchUserProfile(session.user);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('Processing sign in for user:', session.user.id);
          // Store the access token for API calls
          localStorage.setItem('supabase.auth.token', session.access_token);
          await fetchUserProfile(session.user);
          console.log('Finished fetching user profile');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        // Clear the token when logged out
        localStorage.removeItem('supabase.auth.token');
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch user profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If user doesn't exist in users table (PGRST116 = no rows returned), create it
        if (error.code === 'PGRST116') {
          console.log('User not found in database, creating user record...');
          await createUserFromAuth(supabaseUser);
          // Retry fetching after creating
          const { data: newProfile, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (retryError) {
            console.error('Error fetching profile after creation:', retryError);
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
          setUser(userData);
          return;
        }
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
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const createUserFromAuth = async (supabaseUser: SupabaseUser) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          full_name: supabaseUser.user_metadata?.full_name || 'User',
          wallet_balance: '0.00',
          kyc_status: 'pending',
          is_active: true,
          is_admin: false
        });

      if (error) {
        console.error('Error creating user:', error);
      }
    } catch (error) {
      console.error('Error creating user from auth:', error);
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