import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

const NovaSenha = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);

    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session?.user) {
          setErrorMessage("Link de recuperação inválido ou expirado. Solicite um novo e-mail.");
        }

        setIsCheckingSession(false);
      });
  }, []);

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas informadas não conferem.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase().auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage("Não foi possível alterar a senha. Solicite um novo e-mail de recuperação.");
        return;
      }

      await supabase().auth.signOut();
      navigate("/login", { replace: true });
    } catch {
      setErrorMessage("Não foi possível alterar a senha. Solicite um novo e-mail de recuperação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-section">
        <div className="italian-stripe w-full" />
        <div className="section-container flex min-h-[70vh] items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-section">
      <div className="section-container flex min-h-[75vh] items-center justify-center py-16 md:py-24">
        <AuthCard>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Nova senha</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cadastre uma nova senha para acessar sua conta.
            </p>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Nova senha</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua nova senha"
                  autoComplete="new-password"
                  className="pl-10"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Confirmar senha</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirme sua nova senha"
                  autoComplete="new-password"
                  className="pl-10"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </label>

            {errorMessage && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando
                </>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default NovaSenha;
