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
        // For username-based login, validate against custom users table first
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

        if (userError || !userData) {
          return { error: { message: 'Invalid login credentials' } };
        }

        // Create a derived email for Supabase auth
        const derivedEmail = `${username}@portfolio.local`;
        
        // Try to sign in with Supabase auth using derived email
        let { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: derivedEmail,
          password: password,
        });

        // If sign in fails, try to sign up the user first
        if (signInError) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: derivedEmail,
            password: password,
            options: {
              data: {
                username: userData.username,
                role: userData.role
              }
            }
          });

          if (signUpError) {
            console.error('Failed to create Supabase user:', signUpError);
            return { error: { message: 'Authentication setup failed' } };
          }

          // Now try to sign in again
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: derivedEmail,
            password: password,
          });

          if (retryError) {
            console.error('Failed to sign in after signup:', retryError);
            return { error: { message: 'Authentication failed' } };
          }

          authData = retryData;
        }

        // Remove the premature setUserRole call - let onAuthStateChange handle it
        // setUserRole(userData.role); // This line has been removed

        return { error: null };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'Login failed. Please try again.' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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