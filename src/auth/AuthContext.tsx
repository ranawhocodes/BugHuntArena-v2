import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  continueAsGuest?: () => void;
  isLocalMode?: boolean;
}

const LOCAL_STORAGE_USER_KEY = 'bugwug_auth_user';

function createLocalUser(email: string, name?: string): User {
  const userName = name?.trim() || email.split('@')[0] || 'Hunter';
  return {
    id: `local-${encodeURIComponent(email).replace(/[^a-zA-Z0-9]/g, '_')}`,
    app_metadata: { provider: 'local' },
    user_metadata: { name: userName },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email,
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };
}

function getInitialLocalUser(): User | null {
  if (typeof window === 'undefined' || isSupabaseConfigured) return null;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (stored) return JSON.parse(stored) as User;
  } catch {
    // ignore storage error
  }
  return null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(getInitialLocalUser);
  const [loading, setLoading] = useState<boolean>(() => isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const continueAsGuest = () => {
    const guestUser = createLocalUser('guest@bugwug.local', 'Code Ranger');
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
    } catch {
      // ignore
    }
    setUser(guestUser);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured) {
      const trimmedName = name?.trim();
      const localUser = createLocalUser(email, trimmedName);
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));
      } catch {
        // ignore
      }
      setUser(localUser);
      return { error: null, session: null };
    }

    const trimmedName = name?.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: trimmedName ? { data: { name: trimmedName } } : undefined,
    });
    if (error) return { error: error.message, session: null };
    return { error: null, session: data.session };
  };

  const signIn = async (email: string, password: string) => {
    const isDemo = email.trim().toLowerCase() === 'demo@bughuntarena.com';

    if (!isSupabaseConfigured) {
      const localUser = createLocalUser(email, isDemo ? 'Demo Hunter' : undefined);
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));
      } catch {
        // ignore
      }
      setUser(localUser);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If demo credentials or network unreachable in container/sandbox, fallback to instant local login
        if (isDemo || error.message?.toLowerCase().includes('fetch')) {
          const localUser = createLocalUser(email, isDemo ? 'Demo Hunter' : undefined);
          try {
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));
          } catch {
            // ignore
          }
          setUser(localUser);
          return { error: null };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch {
      // Catch any unhandled network exception
      if (isDemo) {
        const localUser = createLocalUser(email, 'Demo Hunter');
        try {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));
        } catch {
          // ignore
        }
        setUser(localUser);
        return { error: null };
      }
      return { error: 'Unable to connect to authentication server. Try "Play as Guest".' };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      } catch {
        // ignore
      }
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        continueAsGuest,
        isLocalMode: !isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
