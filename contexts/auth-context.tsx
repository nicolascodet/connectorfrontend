"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isDemoMode: false,
});

// Check if demo mode is enabled
const isDemoModeEnabled = () => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
};

// Create a mock demo user
const createDemoUser = (): User => {
  return {
    id: "demo-user-id",
    email: "demo@example.com",
    app_metadata: {},
    user_metadata: {
      name: "Demo User",
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = isDemoModeEnabled();

  useEffect(() => {
    // If demo mode is enabled, set a mock user and skip auth
    if (isDemoMode) {
      setUser(createDemoUser());
      setSession(null); // No real session in demo mode
      setLoading(false);
      return;
    }

    // Normal authentication flow
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const signOut = async () => {
    if (isDemoMode) {
      // In demo mode, just reload the page
      window.location.href = "/";
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
