/**
 * Zustand auth store.
 * Holds the Supabase session + VEXA user profile.
 * The Supabase JWT access_token is what we send to the backend as Bearer.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/api";

interface AuthState {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;

  // token is the Supabase access_token — used as Bearer for API calls
  token: string | null;

  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      supabaseUser: null,
      profile: null,
      isLoading: true,
      token: null,

      setSession: (session) =>
        set({
          session,
          supabaseUser: session?.user ?? null,
          token: session?.access_token ?? null,
        }),

      setProfile: (profile) => set({ profile }),
      setLoading: (v) => set({ isLoading: v }),

      clear: () =>
        set({ session: null, supabaseUser: null, profile: null, token: null }),
    }),
    {
      name: "vexa-auth",
      // Only persist non-sensitive parts; session is re-hydrated by Supabase automatically
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
