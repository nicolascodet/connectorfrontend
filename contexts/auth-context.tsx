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
    // If demo mode is enabled, auto-login with demo credentials
    if (isDemoMode) {
      const autoDemoLogin = async () => {
        try {
          // Try to sign in with demo credentials
          const { data, error } = await supabase.auth.signInWithPassword({
            email: "demo@highforce.ai",
            password: "demo123456",
          });

          if (error) {
            console.error("❌ Demo auto-login failed:", error);
            // Fallback to mock user if login fails
            setUser(createDemoUser());
            setSession(null);
          } else {
            console.log("✅ Demo auto-login successful");
            setSession(data.session);
            setUser(data.user);
          }
        } catch (err) {
          console.error("❌ Demo auto-login error:", err);
          // Fallback to mock user
          setUser(createDemoUser());
          setSession(null);
        } finally {
          setLoading(false);
        }
      };

      autoDemoLogin();
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
