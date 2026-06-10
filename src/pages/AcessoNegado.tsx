import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const reasonMessages: Record<string, string> = {
  missing_profile: "Seu usuário ainda não possui um perfil de acesso configurado.",
  invalid_profile: "Seu perfil de acesso está inválido.",
  role_not_allowed: "Seu perfil não tem acesso a esta tela.",
};

const AcessoNegado = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const reason = typeof location.state?.reason === "string" ? location.state.reason : "role_not_allowed";
  const message = reasonMessages[reason] ?? reasonMessages.role_not_allowed;

  const handleLogout = async () => {
    await signOut();
    navigate("/index", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-section">
      <div className="section-container flex min-h-[75vh] items-center justify-center py-16 md:py-24">
        <AuthCard>
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>

            <h1 className="mb-3 text-3xl font-bold text-foreground">Acesso negado</h1>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">{message}</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button type="button" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

export default AcessoNegado;
