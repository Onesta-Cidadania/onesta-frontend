/**
 * Configuracoes - Tela de edição de configurações globais do sistema
 * @description Apenas usuários admin podem acessar e editar
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, RotateCcw, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// TODO: Descomentar imports para produção
import { useAuthenticatedActivity } from "@/hooks/use-authenticated-activity";
import { useAuth } from "@/hooks/use-auth";
import { configurationService } from "@/services/configuration.service";
import type { Configuration } from "@/lib/supabase/types";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Definição dos campos de configuração
 */
interface ConfigFieldDefinition {
  key: keyof Pick<Configuration,
    | 'threads_calendar'
    | 'threads_form'
    | 'otp_requests'
    | 'seconds_to_otp'
    | 'seconds_to_form'
    | 'minutes_to_logout'
    | 'seconds_to_post_booking'
    | 'form_send_retries'
    | 'minutes_to_ignore_giornaliero'
  >;
  label: string;
  description: string;
  unit: string;
}

const CONFIG_FIELDS: ConfigFieldDefinition[] = [
  {
    key: 'threads_calendar',
    label: 'Threads Calendário',
    description: 'Número de threads em paralelo para bater no calendário',
    unit: 'threads',
  },
  {
    key: 'threads_form',
    label: 'Threads Formulário',
    description: 'Quantas abas são enviadas em paralelo por ciclo. Cada ciclo pega um "slice" das abas abertas e dispara os envios simultaneamente',
    unit: 'abas',
  },
  {
    key: 'otp_requests',
    label: 'Requisições OTP',
    description: 'Quantidade de requisições para gerar OTP',
    unit: 'reqs',
  },
  {
    key: 'seconds_to_otp',
    label: 'Segundos para OTP',
    description: 'Tempo em segundos para gerar o OTP antes da hora alvo',
    unit: 'seg',
  },
  {
    key: 'seconds_to_form',
    label: 'Segundos para Formulário',
    description: 'Tempo em segundos para montar formulário antes da hora alvo',
    unit: 'seg',
  },
  {
    key: 'minutes_to_logout',
    label: 'Minutos para Logout',
    description: 'Minutos para fazer logout antes da hora',
    unit: 'min',
  },
  {
    key: 'seconds_to_post_booking',
    label: 'Segundos pós-booking',
    description: 'Segundos de espera entre o envio do formulário e início de agendamento',
    unit: 'seg',
  },
  {
    key: 'form_send_retries',
    label: 'Tentativas de Envio',
    description: 'Quantas rodadas (ciclos) de envio acontecem. Com threads_form=5, form_send_retries=3: cria 15 abas antecipadamente, mas envia 5 por vez, em 3 ciclos de ~1 min.',
    unit: 'ciclos',
  },
  {
    key: 'minutes_to_ignore_giornaliero',
    label: 'Minutos p/ Ignorar Giornaliero',
    description: 'Máximo de tempo de vida de um giornaliero. Mais que isso ele é ignorado',
    unit: 'min',
  },
];

type FormValues = Record<string, string>;

const Configuracoes = () => {
  const navigate = useNavigate();
  // TODO: Descomentar useAuth e useAuthenticatedActivity para produção
  const { role, user, signOut } = useAuth();
  useAuthenticatedActivity();
  // const role: string | null = "admin"; // Temporário para testes locais
  // const user: { email: string } | null = { email: "local_test" }; // Temporário
  // const signOut = async () => {}; // Temporário

  // State
  const [config, setConfig] = useState<Configuration | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [originalValues, setOriginalValues] = useState<FormValues>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar configurações
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await configurationService.get();

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      setConfig(result.data);
      const values: FormValues = {};
      CONFIG_FIELDS.forEach((field) => {
        values[field.key] = result.data![field.key]?.toString() ?? '';
      });
      setFormValues(values);
      setOriginalValues(values);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Handler para alteração de campo
  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  // Salvar
  const handleSave = async () => {
    if (!config || !user?.email) return;

    setIsSaving(true);
    setError(null);

    const result = await configurationService.update(
      config.id,
      formValues,
      user.email
    );

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      setConfig(result.data);
      const values: FormValues = {};
      CONFIG_FIELDS.forEach((field) => {
        values[field.key] = result.data![field.key]?.toString() ?? '';
      });
      setFormValues(values);
      setOriginalValues(values);
      toast.success("Configurações salvas com sucesso!");
    }

    setIsSaving(false);
  };

  // Restaurar valores originais
  const handleRestore = () => {
    setFormValues(originalValues);
    setError(null);
  };

  // Verificar se houve alteração
  const hasChanges = Object.keys(formValues).some(
    (key) => formValues[key] !== originalValues[key]
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  // Formatar data de última atualização
  const formatLastUpdate = () => {
    if (!config?.updated_at) return null;
    try {
      const date = new Date(config.updated_at);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return config.updated_at;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-section">
      {/* Italian Stripe */}
      <div className="italian-stripe w-full" />

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="section-container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-3" aria-label="Onestà Cidadania Italiana - Página Inicial">
            <span className="font-serif text-xl font-semibold text-foreground md:text-2xl">Onestà</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">Cidadania Italiana</span>
          </a>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/consulta-clientes")}>
              Clientes
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="section-container py-12 md:py-16">
        {/* Title */}
        <div className="mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Configurações do Sistema
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Gerencie as configurações globais de funcionamento do sistema. Apenas administradores possuem acesso.
          </p>
        </div>

        {/* Last update info */}
        {config && (config.updated_by || config.updated_at) && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium">Última alteração:</span>{" "}
            {config.updated_by ? `por ${config.updated_by}` : ""}
            {config.updated_by && config.updated_at ? " • " : ""}
            {formatLastUpdate()}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Form */}
        {!isLoading && config && (
          <div>
            <div className="rounded-xl border border-border bg-card p-6 md:p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                {CONFIG_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={field.key}
                        className="text-sm font-medium text-foreground"
                      >
                        {field.label}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={`Ajuda: ${field.label}`}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs leading-relaxed">{field.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <Input
                        id={field.key}
                        type="number"
                        min="0"
                        value={formValues[field.key] ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="pr-14"
                        placeholder="—"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRestore}
                  disabled={!hasChanges || isSaving}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Configuracoes;