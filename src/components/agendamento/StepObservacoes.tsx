import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cleanObservations, getCharCount } from "@/lib/formUtils";
import { DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";

interface DateRangeRestricao {
  inicio: Date | null;
  fim: Date | null;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  datasRestricao: DateRangeRestricao[];
  onChangeDatasRestricao: (ranges: DateRangeRestricao[]) => void;
  maxLength?: number;
}

const StepObservacoes = ({
  value,
  onChange,
  datasRestricao,
  onChangeDatasRestricao,
  maxLength = 100,
}: Props) => {
  const [selectedRange, setSelectedRange] = React.useState<
    DateRange | undefined
  >();
  const [hoverDate, setHoverDate] = React.useState<Date | undefined>();

  // Calendar handlers
  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);

    if (range && range.from && range.to) {
      // Cria um novo range e adiciona à lista
      const novoRange: DateRangeRestricao = {
        inicio: range.from,
        fim: range.to,
      };
      onChangeDatasRestricao([...datasRestricao, novoRange]);
      // Limpa a seleção atual
      setSelectedRange(undefined);
      setHoverDate(undefined);
    }
  };

  // Calcula o range de preview quando hovering
  const getPreviewRange = (): DateRange | undefined => {
    if (selectedRange?.from && hoverDate) {
      const from = selectedRange.from;
      const to = hoverDate;

      // Ordena as datas para garantir que from <= to
      if (from <= to) {
        return { from, to };
      } else {
        return { from: to, to: from };
      }
    }
    return undefined;
  };

  // Helper function to get all dates in a range
  const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    const startDateCopy = new Date(startDate);
    const endDateCopy = new Date(endDate);

    for (
      let d = new Date(startDateCopy);
      d <= endDateCopy;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d));
    }

    return dates;
  };

  const previewRange = getPreviewRange();

  const removeRange = (indexToRemove: number) => {
    onChangeDatasRestricao(
      datasRestricao.filter((_, index) => index !== indexToRemove),
    );
  };

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
            Caso tenha informações importantes a serem comunicadas ao consulado,
            descreva-as de forma clara e objetiva.
          </p>
        </div>

        {/* Textarea */}
        <div className="space-y-3">
          {/* <Label htmlFor="observacoes" className="text-sm font-medium">
            Observações
          </Label> */}
          <Textarea
            id="observacoes"
            value={value}
            onChange={handleChange}
            placeholder="Ex: Necessidade de acessibilidade, restrição médica ou preferência de horário"
            rows={4}
            className="resize-none"
            maxLength={maxLength}
          />

          {/* Character Counter */}
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentLength} / {maxLength} caracteres
            </span>
          </div>
        </div>
      </div>

      {/* Card 1: Restrições de Datas */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-base">Datas de Restrição</h3>
        <div className="pb-3 mt-2">
          <p className="text-xs text-muted-foreground">
            Selecione os períodos em que você NÃO pode comparecer
          </p>
        </div>
        <div className="mb-4 pb-3 border-b border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Selecione um período clicando na data inicial e depois na data
            final, você pode adicionar múltiplos períodos.
          </p>
        </div>

        {/* Calendar */}
        <div className="flex justify-center mb-4">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            className="rounded-md border"
            disabled={{ before: new Date() }}
            numberOfMonths={1}
            locale={ptBR}
            modifiers={{
              hover: hoverDate ? [hoverDate] : [],
              preview: previewRange
                ? getDatesInRange(previewRange.from!, previewRange.to!)
                : [],
            }}
            modifiersStyles={{
              hover: {
                backgroundColor: "hsl(var(--destructive) / 0.2)",
                border: "2px solid hsl(var(--destructive))",
              },
              preview: {
                backgroundColor: "hsl(var(--destructive) / 0.15)",
              },
            }}
            modifiersClassNames={{
              selected:
                "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground",
            }}
            classNames={{
              day_selected:
                "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground",
              day_range_middle:
                "aria-selected:bg-destructive/20 aria-selected:text-destructive-foreground",
              day_today: "font-bold text-destructive",
            }}
            onDayMouseEnter={(date) => {
              if (selectedRange?.from) {
                setHoverDate(date);
              }
            }}
            onDayMouseLeave={() => {
              setHoverDate(undefined);
            }}
          />
        </div>

        {/* Selected Ranges Display */}
        {datasRestricao.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Períodos de restrição ({datasRestricao.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {datasRestricao.map(
                (range, index) =>
                  range.inicio &&
                  range.fim && (
                    <Badge
                      key={index}
                      className="gap-1 pr-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {range.inicio.toLocaleDateString("pt-BR")} até{" "}
                      {range.fim.toLocaleDateString("pt-BR")}
                      <button
                        type="button"
                        onClick={() => removeRange(index)}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ),
              )}
            </div>
          </div>
        )}

        {/* Helper text */}
        {/* <div className="rounded-lg border border-border bg-muted/30 p-4 mt-4"> */}
          {/* <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Dica:</span> Selecione
            um período clicando na data inicial e depois na data final. O
            sistema adicionará automaticamente o período à lista. Você pode
            adicionar múltiplos períodos.
          </p> */}
        {/* </div> */}

        {/* Empty state hint */}
        {datasRestricao.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Você pode selecionar períodos de restrição clicando no calendário
              acima ou deixar vazio se não tiver restrições.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepObservacoes;
