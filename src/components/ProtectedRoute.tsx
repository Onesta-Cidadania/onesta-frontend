import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isRoleIn, type UserRole } from "@/lib/auth/access-control";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-section">
    <div className="italian-stripe w-full" />
    <div className="section-container flex min-h-[70vh] items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isLoading, status, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (status === "missing_profile") {
    return <Navigate to="/acesso-negado" replace state={{ reason: "missing_profile" }} />;
  }

  if (status === "invalid_profile") {
    return <Navigate to="/acesso-negado" replace state={{ reason: "invalid_profile" }} />;
  }

  if (allowedRoles && !isRoleIn(role, allowedRoles)) {
    return <Navigate to="/acesso-negado" replace state={{ reason: "role_not_allowed" }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
