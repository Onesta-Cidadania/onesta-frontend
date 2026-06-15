import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validation/email";
import { recordAuthenticatedActivity } from "@/lib/auth/session-activity";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);

    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session?.user) {
          navigate("/agendamentos", { replace: true });
          return;
        }

        setIsCheckingSession(false);
      });
  }, [navigate]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");

    if (!isValidEmail(email)) {
      setAuthError("Informe um e-mail válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setAuthError("Login ou senha inválidos.");
        return;
      }

      recordAuthenticatedActivity();
      navigate("/agendamentos", { replace: true });
    } catch {
      setAuthError("Login ou senha inválidos.");
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
            <h1 className="mb-2 text-3xl font-bold text-foreground">Login</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Informe seu login e senha para acessar a plataforma.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Login</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="pl-10"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Senha</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  className="px-10"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {authError && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {authError}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => navigate("/recuperar-senha")}
            >
              Esqueci minha senha
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;
