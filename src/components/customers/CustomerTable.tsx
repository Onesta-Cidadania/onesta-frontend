/**
 * CustomerTable - Tabela de resultados da consulta de clientes
 * @description Inclui seleção de linhas, alteração de status inline e ações em lote
 */

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckSquare, HelpCircle, Star, Users, X } from "lucide-react";
import { UserRole } from "@/lib/auth/access-control";
import { PaginationControls } from "@/components/PaginationControls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CustomerWithRelations, CustomerStatusOption } from "@/lib/supabase/types";

// Mapeamento de status code → classes CSS do badge
const STATUS_COLOR_MAP: Record<string, string> = {
  EM_ANALISE: "bg-amber-100 text-amber-800 border-amber-300",
  AGUARDANDO_CORRECAO: "bg-red-100 text-red-800 border-red-300",
  EM_ANDAMENTO: "bg-blue-100 text-blue-800 border-blue-300",
  PAUSADO: "bg-red-100 text-red-800 border-red-300",
  CANCELADO: "bg-white text-gray-600 border-gray-300",
  AGENDADO: "bg-green-100 text-green-800 border-green-300",
};

// Fallback labels caso não consiga buscar do banco
const STATUS_LABEL_FALLBACK: Record<string, string> = {
  EM_ANALISE: "Em Análise",
  AGUARDANDO_CORRECAO: "Aguardando Correção",
  EM_ANDAMENTO: "Tentando Agendar",
  PAUSADO: "Pausado",
  CANCELADO: "Cancelado",
  AGENDADO: "Agendado",
};

// Status que o Assessor pode selecionar
const PARTNER_ALLOWED_TARGETS = ["CANCELADO", "PAUSADO", "EM_ANALISE"];

// Status que bloqueia o Assessor de fazer qualquer alteração
const PARTNER_BLOCKED_CURRENT = "AGENDADO";

interface CustomerTableProps {
  customers: CustomerWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  statusOptions?: CustomerStatusOption[];
  role?: UserRole | null;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onStatusChange?: (customerId: string, newStatus: string) => void;
  onBatchStatusChange?: (ids: string[], newStatus: string) => void;
  isUpdatingStatus?: boolean;
  onPriorityChange?: (customerId: string, priority: boolean) => void;
  onBatchPriorityChange?: (ids: string[], newPriority: boolean) => void;
  isUpdatingPriority?: boolean;
}

function formatDateSafe(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatDateTimeSafe(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Formata data SEM conversão de timezone (considera apenas a parte YYYY-MM-DD).
 * Usado para campos já gravados em horário local (ex.: scheduled_at), evitando
 * que datas no fim do dia "andem" para o dia anterior por causa do offset UTC.
 */
function formatDateNoTzSafe(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const datePart = dateStr.slice(0, 10);
    return format(parseISO(datePart), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Formata data/hora SEM conversão de timezone (exibe data E hora exatamente
 * como estão gravados no banco). Remove o offset/zone da string ISO antes de
 * interpretar, para que o parseISO não converta para o timezone local do browser.
 */
function formatDateTimeNoTzSafe(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const noTz = dateStr.replace(/([+-]\d{2}:\d{2}|Z)$/, "");
    return format(parseISO(noTz), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Retorna os status disponíveis para seleção baseado no role e status atual
 */
function getAvailableStatuses(
  currentStatus: string,
  role: UserRole | null | undefined,
  allStatuses: CustomerStatusOption[]
): CustomerStatusOption[] {
  if (role === UserRole.Admin) {
    // Admin pode trocar para qualquer status
    return allStatuses.filter((s) => s.code !== currentStatus);
  }

  if (role === UserRole.Partner) {
    // Assessor não pode alterar se status atual é AGENDADO
    if (currentStatus === PARTNER_BLOCKED_CURRENT) {
      return [];
    }
    // Assessor pode trocar apenas para CANCELADO, PAUSADO ou EM_ANALISE (exceto o atual)
    return allStatuses.filter(
      (s) =>
        PARTNER_ALLOWED_TARGETS.includes(s.code) && s.code !== currentStatus
    );
  }

  // Customer e outros não podem alterar
  return [];
}

/**
 * Cabeçalho de coluna com tooltip de ajuda (ícone de interrogação)
 */
function HeaderWithTooltip({
  label,
  tooltip,
  className,
}: {
  label: string;
  tooltip: string;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/60">
            {label}
            <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TableHead>
  );
}

export function CustomerTable({
  customers,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isLoading,
  statusOptions = [],
  role,
  selectedIds = new Set(),
  onSelectionChange,
  onStatusChange,
  onBatchStatusChange,
  isUpdatingStatus,
  onPriorityChange,
  onBatchPriorityChange,
  isUpdatingPriority,
}: CustomerTableProps) {
  const isAdmin = role === UserRole.Admin;
  const isPartner = role === UserRole.Partner;
  const canEditPriority = isAdmin || isPartner;

  // Derived state
  const allOnPageSelected =
    customers.length > 0 &&
    customers.every((c) => selectedIds.has(c.id));
  const someOnPageSelected =
    customers.some((c) => selectedIds.has(c.id)) && !allOnPageSelected;
  const hasSelection = selectedIds.size > 0;

  // Selection handlers
  const toggleAll = () => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (allOnPageSelected) {
      // Deselect all on current page
      customers.forEach((c) => next.delete(c.id));
    } else {
      // Select all on current page
      customers.forEach((c) => next.add(c.id));
    }
    onSelectionChange(next);
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const clearSelection = () => {
    onSelectionChange?.(new Set());
  };

  // Status change handler (individual)
  const handleStatusSelect = (customerId: string, newStatus: string) => {
    onStatusChange?.(customerId, newStatus);
  };

  // Priority toggle handler (individual)
  const handlePriorityToggle = (customerId: string, currentPriority: boolean) => {
    onPriorityChange?.(customerId, !currentPriority);
  };

  // Batch status change handler
  const handleBatchStatusSelect = (newStatus: string) => {
    if (newStatus && hasSelection) {
      onBatchStatusChange?.(Array.from(selectedIds), newStatus);
    }
  };

  // Batch priority change handler
  const handleBatchPrioritySelect = (newPriority: boolean) => {
    if (hasSelection) {
      onBatchPriorityChange?.(Array.from(selectedIds), newPriority);
    }
  };

  // Initial load (no data yet)
  if (isLoading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">Carregando clientes...</span>
      </div>
    );
  }

  if (!isLoading && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-8">
        <Users className="h-10 w-10 opacity-30" />
        <span className="text-sm">Nenhum cliente encontrado.</span>
        <span className="text-xs">Tente ajustar os filtros de busca.</span>
      </div>
    );
  }

  return (
    <>

      {/* Batch Action Bar */}
      {hasSelection && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-primary/5 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedIds.size} {selectedIds.size === 1 ? "selecionado" : "selecionados"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Alterar status para:</span>
            <Select onValueChange={handleBatchStatusSelect} disabled={isUpdatingStatus}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Selecione o status..." />
              </SelectTrigger>
              <SelectContent>
                {statusOptions
                  .filter((s) => {
                    if (isAdmin) return true;
                    if (isPartner) return PARTNER_ALLOWED_TARGETS.includes(s.code);
                    return false;
                  })
                  .map((status) => (
                    <SelectItem key={status.code} value={status.code}>
                      {status.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {canEditPriority && (
            <div className="flex items-center gap-2 border-l pl-4 ml-4">
              <span className="text-xs text-muted-foreground">Prioridade:</span>
              <Button
                size="sm"
                variant={hasSelection ? "default" : "outline"}
                onClick={() => handleBatchPrioritySelect(true)}
                disabled={isUpdatingPriority}
                className="h-8 text-xs gap-1"
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Marcar como Prioritário
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleBatchPrioritySelect(false)}
                disabled={isUpdatingPriority}
                className="h-8 text-xs"
              >
                Remover Prioridade
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-x-auto">
        {/* Loading overlay for subsequent loads (when data already exists) */}
        {isLoading && customers.length > 0 && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground bg-white rounded-lg px-4 py-2 shadow-sm border">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Carregando...</span>
            </div>
          </div>
        )}
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allOnPageSelected}
                  ref={(el) => {
                    if (el) {
                      (el as unknown as HTMLButtonElement).dataset.state = someOnPageSelected
                        ? "indeterminate"
                        : allOnPageSelected
                          ? "checked"
                          : "unchecked";
                    }
                  }}
                  onCheckedChange={toggleAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead className="w-[80px]">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Serviço</TableHead>
              {isAdmin && (
                <TableHead>Assessoria</TableHead>
              )}
              <TableHead className="text-center">Prioritário</TableHead>
              <TableHead>Status</TableHead>
              <HeaderWithTooltip
                label="Inclusão"
                tooltip="Data em que o cliente foi incluído no sistema"
              />
              <TableHead>Últ. Tentativa</TableHead>
              <HeaderWithTooltip
                label="Agendado"
                tooltip="Dia em que o sistema teve êxito no agendamento do cliente"
              />
              <HeaderWithTooltip
                label="Reserva"
                tooltip="Data em que ficou agendado para o cliente comparecer ao Consulado"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              // Busca label do status: primeiro do banco, depois fallback, último o code raw
              const statusFromDb = statusOptions.find((s) => s.code === customer.status);
              const statusLabel =
                statusFromDb?.label || STATUS_LABEL_FALLBACK[customer.status] || customer.status;
              const statusColor =
                STATUS_COLOR_MAP[customer.status] || "bg-gray-100 text-gray-800 border-gray-300";

              const serviceName = customer.services?.name || "—";
              const partnerName = customer.partners?.full_name || "—";

              // Determine available statuses for this customer
              const availableStatuses = getAvailableStatuses(
                customer.status,
                role,
                statusOptions
              );
              const canChangeStatus = availableStatuses.length > 0;

              return (
                <TableRow
                  key={customer.id}
                  className={`hover:bg-muted/50 ${selectedIds.has(customer.id) ? "bg-primary/5" : ""}`}
                >
                  {/* Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(customer.id)}
                      onCheckedChange={() => toggleOne(customer.id)}
                      aria-label={`Selecionar ${customer.full_name}`}
                    />
                  </TableCell>

                  {/* Código */}
                  <TableCell className="font-mono text-xs font-medium">
                    {customer.customer_code}
                  </TableCell>

                  {/* Nome */}
                  <TableCell>
                    <div className="font-medium text-sm">{customer.full_name}</div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.email}
                  </TableCell>

                  {/* Serviço */}
                  <TableCell className="text-sm">
                    <div className="text-sm">{serviceName}</div>
                  </TableCell>

                  {/* Assessoria (só para Admin) */}
                  {isAdmin && (
                    <TableCell className="text-sm text-muted-foreground">
                      {partnerName}
                    </TableCell>
                  )}

                  {/* Prioritário */}
                  <TableCell className="text-center">
                    {canEditPriority ? (
                      <button
                        type="button"
                        onClick={() => handlePriorityToggle(customer.id, customer.priority)}
                        disabled={isUpdatingPriority}
                        className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        title={customer.priority ? "Remover prioridade" : "Marcar como prioritário"}
                        aria-label={customer.priority ? "Remover prioridade" : "Marcar como prioritário"}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            customer.priority
                              ? "fill-amber-400 text-amber-400"
                              : "fill-none text-muted-foreground"
                          }`}
                        />
                      </button>
                    ) : (
                      <Star
                        className={`h-4 w-4 mx-auto ${
                          customer.priority
                            ? "fill-amber-400 text-amber-400"
                            : "fill-none text-muted-foreground opacity-40"
                        }`}
                      />
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {canChangeStatus ? (
                      <Select
                        value={customer.status}
                        onValueChange={(value) => handleStatusSelect(customer.id, value)}
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger className="w-auto min-w-[120px] h-7 text-xs border-0 p-0 gap-1 focus:ring-0">
                          <Badge
                            variant="outline"
                            className={`whitespace-nowrap text-xs border cursor-pointer ${statusColor}`}
                          >
                            {statusLabel}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {availableStatuses.map((status) => (
                            <SelectItem key={status.code} value={status.code}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`whitespace-nowrap text-xs border ${statusColor}`}
                      >
                        {statusLabel}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Data Inclusão */}
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateSafe(customer.created_at)}
                  </TableCell>

                  {/* Última Tentativa */}
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateSafe(customer.last_attempt)}
                  </TableCell>

                  {/* Data Agendamento */}
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateSafe(customer.scheduled_at)}
                  </TableCell>

                  {/* Data Reserva (sem conversão UTC) */}
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTimeNoTzSafe(customer.reservation_date)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </TooltipProvider>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </>
  );
}

export default CustomerTable;