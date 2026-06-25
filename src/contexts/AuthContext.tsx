import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { isUserRole, type UserRoleProfile } from "@/lib/auth/access-control";
import { clearAuthenticatedActivity } from "@/lib/auth/session-activity";
import { AuthContext, type AuthContextValue, type AuthStatus } from "@/contexts/auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
  partner_id: string | null;
  created_at: string | null;
}

type LoadUserProfileResult = UserRoleProfile | "invalid_profile" | null;

const loadUserProfile = async (userId: string): Promise<LoadUserProfileResult> => {
  const { data, error } = await supabase()
    .from("user_roles")
    .select("id,user_id,role,partner_id,created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar perfil de acesso:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const profile = data as UserRoleRow;

  if (!isUserRole(profile.role)) {
    return "invalid_profile";
  }

  return {
    ...profile,
    role: profile.role,
  };
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserRoleProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const loadedProfileUserIdRef = useRef<string | null>(null);

  const applySession = useCallback(async (currentSession: Session | null, forceProfileReload = false) => {
    setSession(currentSession);

    if (!currentSession?.user) {
      loadedProfileUserIdRef.current = null;
      setProfile(null);
      setStatus("unauthenticated");
      return;
    }

    if (!forceProfileReload && loadedProfileUserIdRef.current === currentSession.user.id) {
      return;
    }

    loadedProfileUserIdRef.current = currentSession.user.id;
    setStatus("loading");

    const loadedProfile = await loadUserProfile(currentSession.user.id);
    setProfile(loadedProfile);

    if (loadedProfile === "invalid_profile") {
      setProfile(null);
      setStatus("invalid_profile");
      return;
    }

    if (!loadedProfile) {
      setStatus("missing_profile");
      return;
    }

    setStatus("authenticated");
  }, []);

  const refreshProfile = useCallback(async () => {
    await applySession(session, true);
  }, [applySession, session]);

  const signOut = useCallback(async () => {
    clearAuthenticatedActivity();
    await supabase().auth.signOut();
    setSession(null);
    setProfile(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        void applySession(data.session);
      });

    const {
      data: { subscription },
    } = supabase().auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => {
      const user = session?.user ?? null;
      const metadataName =
        typeof user?.user_metadata?.name === "string" && user.user_metadata.name.trim()
          ? user.user_metadata.name.trim()
          : typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
            ? user.user_metadata.full_name.trim()
            : null;

      return {
        status,
        session,
        user,
        userDisplayName: metadataName || user?.email || null,
        profile,
        role: profile?.role ?? null,
        partnerId: profile?.partner_id ?? null,
        isLoading: status === "loading",
        refreshProfile,
        signOut,
      };
    },
    [profile, refreshProfile, session, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
