"use client";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { usersApi } from "@/lib/api";

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const { session, profile, token, isLoading, setSession, setProfile, setLoading, clear } = useAuthStore();

  // Load session on mount and subscribe to auth changes
  useEffect(() => {
    setLoading(true);

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.access_token);
      else setLoading(false);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.access_token);
      else { clear(); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = useCallback(async (tok: string) => {
    try {
      const p = await usersApi.me(tok);
      setProfile(p);
    } catch {
      // Profile might not exist yet for brand new users — that's okay
    } finally {
      setLoading(false);
    }
  }, [setProfile, setLoading]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, [supabase.auth]);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, [supabase.auth]);

  const signup = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    return data;
  }, [supabase.auth]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clear();
    router.replace("/login");
    toast.success("Signed out");
  }, [supabase.auth, clear, router]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const p = await usersApi.me(token);
    setProfile(p);
  }, [token, setProfile]);

  return {
    session,
    profile,
    token,
    isLoading,
    isAuthenticated: !!session,
    login,
    loginWithGoogle,
    signup,
    logout,
    refreshProfile,
  };
}
