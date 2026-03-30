import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/shared/LoadingState";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Verificando permissões..." />
      </div>
    );
  }

  if (!session || !appUser || !appUser.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
