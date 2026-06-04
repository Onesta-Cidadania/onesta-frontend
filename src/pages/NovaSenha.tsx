import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

const NovaSenha = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const passwordRequirements = [
    { label: "Mínimo de 6 caracteres", isMet: password.length >= 6 },
    { label: "Pelo menos uma letra", isMet: /\p{L}/u.test(password) },
    { label: "Pelo menos um número", isMet: /\p{N}/u.test(password) },
    { label: "Pelo menos um caractere especial", isMet: /[^\p{L}\p{N}\s]/u.test(password) },
  ];
  const isPasswordValid = passwordRequirements.every(({ isMet }) => isMet);

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

    if (!isPasswordValid) {
      setErrorMessage("A nova senha não atende a todos os critérios obrigatórios.");
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua nova senha"
                  autoComplete="new-password"
                  className="px-10"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  aria-label={showPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ul className="mt-3 space-y-1.5" aria-label="Critérios obrigatórios da senha" aria-live="polite">
                {passwordRequirements.map(({ label, isMet }) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2 text-xs transition-colors ${
                      isMet ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {isMet ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{label}</span>
                    <span className="sr-only">{isMet ? "atendido" : "não atendido"}</span>
                  </li>
                ))}
              </ul>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Confirmar senha</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirme sua nova senha"
                  autoComplete="new-password"
                  className="px-10"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                  aria-pressed={showConfirmPassword}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
