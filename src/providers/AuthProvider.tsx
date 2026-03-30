import React, { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  access_level: string;
  is_admin: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("app_users")
      .select("id, email, full_name, status, access_level, is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching app_user:", error);
      setAppUser(null);
      return;
    }
    setAppUser(data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => fetchAppUser(newSession.user.id), 0);
        } else {
          setAppUser(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchAppUser(s.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Once appUser is fetched (or set to null after login), stop loading
  useEffect(() => {
    if (session && appUser !== undefined) {
      setLoading(false);
    }
  }, [session, appUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAppUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, appUser, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
