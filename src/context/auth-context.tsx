"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, signInWithGoogle, signOutUser, syncUserProfile } from "@/lib/supabase";
import { AlertCircle, X } from "lucide-react";

export const ADMIN_ROOT_EMAIL = "hvhaqt2021@gmail.com";

interface AppUser {
  id: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  rawUser: User;
}

interface AuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  authError: null,
  clearAuthError: () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAppUser(session.user);
        syncUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAppUser(session.user);
        await syncUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setAppUser = (sbUser: User) => {
    const displayName =
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      sbUser.email?.split("@")[0] ||
      "Thực tập sinh";

    const photoURL = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null;

    setUser({
      id: sbUser.id,
      email: sbUser.email || null,
      displayName,
      photoURL,
      rawUser: sbUser,
    });
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Error logging in with Supabase Google Auth:", error);
      setAuthError(error?.message || "Lỗi đăng nhập Google với Supabase.");
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error: any) {
      console.error("Error signing out:", error);
    }
  };

  const isAdmin = Boolean(
    user?.email && user.email.toLowerCase() === ADMIN_ROOT_EMAIL.toLowerCase()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        loginWithGoogle,
        logout,
      }}
    >
      {children}
      {authError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-rose-950 border border-rose-600 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
          <AlertCircle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs space-y-1">
            <div className="font-bold text-sm text-rose-200">Lỗi Đăng Nhập Supabase</div>
            <p className="leading-relaxed text-slate-300">{authError}</p>
          </div>
          <button onClick={() => setAuthError(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
