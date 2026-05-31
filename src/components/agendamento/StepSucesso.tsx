import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, Mail, MessageCircle, Clock } from "lucide-react";

interface Props {
  onReset: () => void;
}

const StepSucesso = ({ onReset }: Props) => (
  <div className="flex flex-col items-center text-center py-8 md:py-12 gap-8 animate-scale-in">
    {/* Success icon with glow */}
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse"></div>
      <div className="relative rounded-full bg-primary/10 p-8 md:p-10 border-4 border-primary/20">
        <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-primary" />
      </div>
    </div>

    {/* Success message */}
    <div className="space-y-3 max-w-md">
      <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
        Solicitação enviada com <span className="text-primary italic">sucesso!</span>
      </h2>
      <p className="text-muted-foreground">
        Sua solicitação de agendamento foi recebida. Em breve entraremos em contato para confirmar os detalhes.
      </p>
    </div>

    {/* Next steps */}
    <div className="w-full max-w-sm space-y-4 mt-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">Prazo de resposta</p>
          <p className="text-xs text-muted-foreground">Entraremos em contato em até 24 horas úteis</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
        <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">Email</p>
          <p className="text-xs text-muted-foreground">Verifique sua caixa de entrada e spam</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
        <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">WhatsApp</p>
          <p className="text-xs text-muted-foreground">Também podemos entrar contato pelo WhatsApp</p>
        </div>
      </div>
    </div>

    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-sm">
      <Button onClick={onReset} variant="outline" className="gap-2 flex-1">
        <RotateCcw className="h-4 w-4" />
        Nova solicitação
      </Button>
      <Button
        variant="cta"
        asChild
        className="gap-2 flex-1"
        onClick={() => window.location.href = "/"}
      >
        <a>
          Voltar ao site
          <MessageCircle className="h-4 w-4" />
        </a>
      </Button>
    </div>
  </div>
);

export default StepSucesso;
