import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validation/email";

const RecuperarSenha = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePasswordRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!isValidEmail(email)) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/nova-senha`,
      });

      if (error) {
        setErrorMessage("Não foi possível enviar o e-mail de recuperação. Tente novamente.");
        return;
      }

      setMessage("Se o e-mail estiver cadastrado, você receberá as instruções para trocar sua senha.");
    } catch {
      setErrorMessage("Não foi possível enviar o e-mail de recuperação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-section">
      <div className="section-container flex min-h-[75vh] items-center justify-center py-16 md:py-24">
        <AuthCard>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Recuperar senha</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Informe seu e-mail para receber as instruções de troca de senha.
            </p>
          </div>

          <form onSubmit={handlePasswordRecovery} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">E-mail</span>
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

            {message && (
              <p className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {message}
              </p>
            )}

            {errorMessage && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando
                </>
              ) : (
                "Enviar e-mail"
              )}
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default RecuperarSenha;
