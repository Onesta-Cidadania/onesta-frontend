import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { UserRole, UserRoleProfile } from "@/lib/auth/access-control";

export type AuthStatus = "loading" | "unauthenticated" | "authenticated" | "missing_profile" | "invalid_profile";

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  userDisplayName: string | null;
  profile: UserRoleProfile | null;
  role: UserRole | null;
  partnerId: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
