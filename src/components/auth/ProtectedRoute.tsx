import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/shared/LoadingState";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Verificando sessão..." />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Carregando perfil..." />
      </div>
    );
  }

  if (appUser.status === "pending") {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  if (appUser.status === "disabled") {
    return <Navigate to="/acesso-bloqueado" replace />;
  }

  return <>{children}</>;
}
