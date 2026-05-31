import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cleanObservations, getCharCount } from "@/lib/formUtils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  datasRestricao: string[];
  onChangeDatasRestricao: (dates: string[]) => void;
  maxLength?: number;
}

const StepObservacoes = ({
  value,
  onChange,
  datasRestricao,
  onChangeDatasRestricao,
  maxLength = 100,
}: Props) => {
  // Calendar handlers
  const handleSelect = (dates: Date[] | undefined) => {
    if (dates) {
      const isoDates = dates.map((d) => d.toISOString());
      onChangeDatasRestricao(isoDates);
    } else {
      onChangeDatasRestricao([]);
    }
  };

  const removeDate = (dateToRemove: string) => {
    onChangeDatasRestricao(datasRestricao.filter((d) => d !== dateToRemove));
  };

  const calendarDates = datasRestricao.map((d) => new Date(d));
  const sortedDates = [...datasRestricao].sort();

  // Textarea handlers
  const charCount = getCharCount(value, maxLength);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(cleanObservations(e.target.value, maxLength));
  };

  const currentLength = value.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
          Observações e Restrições
        </h2>
        <p className="text-base text-muted-foreground">
          Informações adicionais e datas de restrição (opcional)
        </p>
      </div>

      {/* Card 2: Observações Adicionais */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 pb-3 border-b border-border">
          <h3 className="font-semibold text-base">Observações Adicionais</h3>
          <p className="text-xs text-muted-foreground">
            Outras informações que deseja compartilhar
          </p>
        </div>

        {/* Textarea */}
        <div className="space-y-3">
          <Label htmlFor="observacoes" className="text-sm font-medium">
            Observações
          </Label>
          <Textarea
            id="observacoes"
            value={value}
            onChange={handleChange}
            placeholder="Ex: Prefiro horarios pela manha ou: Necessidade de acessibilidade"
            rows={4}
            className="resize-none"
            maxLength={maxLength}
          />

          {/* Character Counter */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Use apenas letras e números. Não utilize vírgulas ou acentos. Você pode usar hífen
              para separar informações.
            </p>
            <span className="text-xs text-muted-foreground">
              {currentLength} / {maxLength} caracteres
            </span>
          </div>
        </div>
      </div>

      {/* Card 1: Restrições de Datas */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 pb-3 border-b border-border">
          <h3 className="font-semibold text-base">Datas de Restrição</h3>
          <p className="text-xs text-muted-foreground">
            Selecione as datas em que você NÃO pode comparecer
          </p>
        </div>

        {/* Calendar */}
        <div className="flex justify-center mb-4">
          <Calendar
            mode="multiple"
            selected={calendarDates}
            onSelect={handleSelect}
            className="rounded-md border"
            disabled={{ before: new Date() }}
            classNames={{
              month_caption: "flex justify-center pt-1 relative items-center w-full",
              caption_label: "text-sm font-medium",
              month_grid: "w-full border-collapse space-x-1 space-y-1",
            }}
          />
        </div>

        {/* Selected Dates Display */}
        {datasRestricao.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Datas de restrição ({datasRestricao.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {sortedDates.map((dateStr) => {
                const date = new Date(dateStr);
                return (
                  <Badge key={dateStr} variant="secondary" className="gap-1 pr-1">
                    {date.toLocaleDateString("pt-BR")}
                    <button
                      type="button"
                      onClick={() => removeDate(dateStr)}
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Helper text */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 mt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Dica:</span> Selecione as datas em que
            você não poderá comparecer ao consulado. Isso nos ajuda a encontrar o melhor horário,
            evitando conflitos na agenda.
          </p>
        </div>

        {/* Empty state hint */}
        {datasRestricao.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Você pode selecionar datas de restrição clicando no calendário acima ou deixar vazio
              se não tiver restrições.
            </p>
          </div>
        )}
      </div>


    </div>
  );
};

export default StepObservacoes;
