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
import type { DateRange } from "react-day-picker";
import { UserRole } from "@/lib/auth/access-control";
import type { CustomerFilters as TCustomerFilters, Service, CustomerStatusOption, Partner } from "@/lib/supabase/types";

interface CustomerFiltersProps {
  filters: TCustomerFilters;
  onFiltersChange: (filters: TCustomerFilters) => void;
  onSearch: (overrideFilters?: TCustomerFilters) => void;
  services: Service[];
  statusOptions?: CustomerStatusOption[];
  partners?: Partner[];
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  role?: UserRole | null;
}

function DateRangePickerField({
  label,
  startDate,
  endDate,
  onRangeChange,
}: {
  label: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onRangeChange: (range: { start: Date | undefined; end: Date | undefined }) => void;
}) {
  const [open, setOpen] = useState(false);

  const range: DateRange = {
    from: startDate,
    to: endDate,
  };

  const displayText = () => {
    if (startDate && endDate) {
      return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} — ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (startDate) {
      return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} — ...`;
    }
    return "Selecione o período...";
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            {displayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={(selectedRange) => {
              onRangeChange({
                start: selectedRange?.from,
                end: selectedRange?.to,
              });
              // Close popover only when both dates are selected
              if (selectedRange?.from && selectedRange?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={1}
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
  statusOptions = [],
  partners = [],
  isLoading,
  hasActiveFilters = false,
  role,
}: CustomerFiltersProps) {
  const [expanded, setExpanded] = useState(true);
  const isAdmin = role === UserRole.Admin;

  const handleClear = () => {
    onFiltersChange({});
    onSearch({});
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
          <div className={`grid gap-4 ${isAdmin ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'}`}>
            {/* Serviço */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Serviço</Label>
              <Select
                value={filters.service_id != null ? String(filters.service_id) : "ALL"}
                onValueChange={(v) =>
                  updateFilter("service_id", v === "ALL" ? undefined : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os serviços</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
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

            {/* Assessoria (só para Admin) */}
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assessoria</Label>
                <Select
                  value={filters.partner_id || "ALL"}
                  onValueChange={(v) =>
                    updateFilter("partner_id", v === "ALL" ? undefined : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as assessorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as assessorias</SelectItem>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={filters.status || "ALL"}
                onValueChange={(v) =>
                  updateFilter("status", v === "ALL" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  {(statusOptions || []).map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select
                value={
                  filters.priority === undefined
                    ? "ALL"
                    : filters.priority
                      ? "TRUE"
                      : "FALSE"
                }
                onValueChange={(v) =>
                  updateFilter(
                    "priority",
                    v === "ALL" ? undefined : v === "TRUE"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as prioridades</SelectItem>
                  <SelectItem value="TRUE">Apenas prioritários</SelectItem>
                  <SelectItem value="FALSE">Apenas não prioritários</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Date range filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DateRangePickerField
              label="Data de Inclusão"
              startDate={filters.created_at_start}
              endDate={filters.created_at_end}
              onRangeChange={({ start, end }) => {
                onFiltersChange({
                  ...filters,
                  created_at_start: start,
                  created_at_end: end,
                });
              }}
            />

            <DateRangePickerField
              label="Data de Agendamento"
              startDate={filters.scheduled_at_start}
              endDate={filters.scheduled_at_end}
              onRangeChange={({ start, end }) => {
                onFiltersChange({
                  ...filters,
                  scheduled_at_start: start,
                  scheduled_at_end: end,
                });
              }}
            />

            <DateRangePickerField
              label="Data de Reserva"
              startDate={filters.reservation_date_start}
              endDate={filters.reservation_date_end}
              onRangeChange={({ start, end }) => {
                onFiltersChange({
                  ...filters,
                  reservation_date_start: start,
                  reservation_date_end: end,
                });
              }}
            />
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
            <Button size="sm" onClick={() => onSearch()} disabled={isLoading}>
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