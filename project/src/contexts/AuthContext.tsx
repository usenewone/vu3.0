import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isOwner: boolean;
  isGuest: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  accessAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserRole(session.user.id);
        setIsGuest(false);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserRole = async (userId: string) => {
    try {
      // First check if user exists in profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        // For now, we'll assume all authenticated users are owners
        // You can modify this logic based on your needs
        setUserRole('owner');
        return;
      }

      // Check custom users table for role information
      const { data: customUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (customUser) {
        setUserRole(customUser.role);
      } else {
        // Default role for authenticated users
        setUserRole('owner');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      // Default to owner for authenticated users
      setUserRole('owner');
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      // First, check if this is an email or username
      const isEmail = username.includes('@');
      
      if (isEmail) {
        // Use Supabase auth directly for email
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

        if (error) {
          return { error };
        }

        return { error: null };
      } else {
        // For username-based login, validate against custom users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

        if (userError || !userData) {
          return { error: { message: 'Invalid login credentials' } };
        }

        // For username-based authentication, we'll create a session-like state
        // without using Supabase's authentication system
        // This is a workaround for the custom username/password system
        
        // Create a mock user object that matches the expected structure
        const mockUser = {
          id: userData.id,
          email: `${username}@local.portfolio`,
          user_metadata: {
            username: userData.username,
            role: userData.role
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: userData.created_at,
          updated_at: userData.created_at,
          role: userData.role
        } as User;

        // Set the user state directly for username-based auth
        setUser(mockUser);
        setUserRole(userData.role);
        
        // Create a mock session
        const mockSession = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: mockUser
        } as Session;

        setSession(mockSession);

        return { error: null };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'Login failed. Please try again.' } };
    }
  };

  const signOut = async () => {
    // If we have a real Supabase session, sign out properly
    if (session && session.access_token !== 'mock-token') {
      await supabase.auth.signOut();
    } else {
      // For mock sessions, just clear the state
      setUser(null);
      setSession(null);
      setUserRole(null);
    }
    setIsGuest(false);
  };

  const accessAsGuest = () => {
    setIsGuest(true);
    signOut(); // This will clear the session
  };

  const value = {
    user,
    session,
    userRole,
    isOwner: userRole === 'owner',
    isGuest,
    loading,
    signIn,
    signOut,
    accessAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};