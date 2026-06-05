/**
 * CustomerFilters - Painel de filtros para consulta de clientes
 */

import { useState } from "react";
import { Search, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CustomerFilters as TCustomerFilters, CustomerStatus, FormService } from "@/lib/supabase/types";

interface CustomerFiltersProps {
  filters: TCustomerFilters;
  onFiltersChange: (filters: TCustomerFilters) => void;
  onSearch: () => void;
  services: FormService[];
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: "EM_ANALISE", label: "Em Análise" },
  { value: "AGENDADO", label: "Agendado" },
  { value: "RESERVADO", label: "Reservado" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "PENDENTE", label: "Pendente" },
];

function DatePickerField({
  label,
  date,
  onDateChange,
}: {
  label: string;
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              onDateChange(d);
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CustomerFiltersPanel({
  filters,
  onFiltersChange,
  onSearch,
  services,
  isLoading,
}: CustomerFiltersProps) {
  const [expanded, setExpanded] = useState(true);

  const handleClear = () => {
    onFiltersChange({});
  };

  const updateFilter = <K extends keyof TCustomerFilters>(
    key: K,
    value: TCustomerFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== ""
  );

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Ativos
              </span>
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Filters Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Row 1: Text/Select filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Serviço */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Serviço</Label>
              <Select
                value={filters.service_id || "ALL"}
                onValueChange={(v) =>
                  updateFilter("service_id", v === "ALL" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os serviços</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome</Label>
              <Input
                placeholder="Buscar por nome..."
                value={filters.name || ""}
                onChange={(e) => updateFilter("name", e.target.value || undefined)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                placeholder="Buscar por email..."
                value={filters.email || ""}
                onChange={(e) => updateFilter("email", e.target.value || undefined)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={filters.status || "ALL"}
                onValueChange={(v) =>
                  updateFilter("status", v === "ALL" ? undefined : (v as CustomerStatus))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Date filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Data de Inclusão
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <DatePickerField
                  label="De"
                  date={filters.created_at_start}
                  onDateChange={(d) => updateFilter("created_at_start", d)}
                />
                <DatePickerField
                  label="Até"
                  date={filters.created_at_end}
                  onDateChange={(d) => updateFilter("created_at_end", d)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Data de Agendamento
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <DatePickerField
                  label="De"
                  date={filters.scheduled_at_start}
                  onDateChange={(d) => updateFilter("scheduled_at_start", d)}
                />
                <DatePickerField
                  label="Até"
                  date={filters.scheduled_at_end}
                  onDateChange={(d) => updateFilter("scheduled_at_end", d)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Data de Reserva
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <DatePickerField
                  label="De"
                  date={filters.reservation_date_start}
                  onDateChange={(d) => updateFilter("reservation_date_start", d)}
                />
                <DatePickerField
                  label="Até"
                  date={filters.reservation_date_end}
                  onDateChange={(d) => updateFilter("reservation_date_end", d)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar
            </Button>
            <Button size="sm" onClick={onSearch} disabled={isLoading}>
              <Search className="h-3 w-3 mr-1" />
              Buscar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerFiltersPanel;