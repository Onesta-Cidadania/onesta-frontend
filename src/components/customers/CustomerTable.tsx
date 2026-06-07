/**
 * CustomerTable - Tabela de resultados da consulta de clientes
 */

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerWithRelations, CustomerStatusOption } from "@/lib/supabase/types";

// Mapeamento de status code → cor do badge
const STATUS_VARIANT_MAP: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  EM_ANALISE: "secondary",
  AGUARDANDO_CORRECAO: "outline",
  EM_ANDAMENTO: "default",
  PAUSADO: "secondary",
  CANCELADO: "destructive",
  AGENDADO: "default",
};

// Fallback labels caso não consiga buscar do banco
const STATUS_LABEL_FALLBACK: Record<string, string> = {
  EM_ANALISE: "Em Análise",
  AGUARDANDO_CORRECAO: "Aguardando Correção",
  EM_ANDAMENTO: "Em Andamento",
  PAUSADO: "Pausado",
  CANCELADO: "Cancelado",
  AGENDADO: "Agendado",
};

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
}

function formatDateSafe(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
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
}: CustomerTableProps) {
  // Initial load (no data yet)
  if (isLoading && customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Carregando clientes...</span>
        </div>
      </div>
    );
  }

  if (!isLoading && customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Users className="h-10 w-10 opacity-30" />
          <span className="text-sm">Nenhum cliente encontrado.</span>
          <span className="text-xs">Tente ajustar os filtros de busca.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm relative">
      {/* Loading overlay for subsequent loads (when data already exists) */}
      {isLoading && customers.length > 0 && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground bg-white rounded-lg px-4 py-2 shadow-sm border">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">Carregando...</span>
          </div>
        </div>
      )}

      {/* Header com contagem */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {total} {total === 1 ? "registro encontrado" : "registros encontrados"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Itens por página:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Inclusão</TableHead>
              <TableHead className="hidden lg:table-cell">Agendamento</TableHead>
              <TableHead className="hidden xl:table-cell">Reserva</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              // Busca label do status: primeiro do banco, depois fallback, último o code raw
              const statusFromDb = statusOptions.find(s => s.code === customer.status);
              const statusLabel = statusFromDb?.label || STATUS_LABEL_FALLBACK[customer.status] || customer.status;
              const statusVariant = STATUS_VARIANT_MAP[customer.status] || "outline" as const;

              const serviceName = customer.services?.name || "—";
              const partnerName = customer.partners?.full_name || "—";

              return (
                <TableRow key={customer.id} className="hover:bg-muted/50">
                  {/* Código */}
                  <TableCell className="font-mono text-xs font-medium">
                    {customer.customer_code}
                  </TableCell>

                  {/* Nome */}
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{customer.full_name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        {customer.email}
                      </div>
                      <div className="text-xs text-muted-foreground lg:hidden">
                        {serviceName}
                      </div>
                    </div>
                  </TableCell>

                  {/* Email (hidden em mobile) */}
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {customer.email}
                  </TableCell>

                  {/* Serviço */}
                  <TableCell className="hidden lg:table-cell text-sm">
                    <div>
                      <div className="text-sm">{serviceName}</div>
                      <div className="text-xs text-muted-foreground">
                        Parceiro: {partnerName}
                      </div>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={statusVariant} className="text-xs">
                      {statusLabel}
                    </Badge>
                  </TableCell>

                  {/* Data Inclusão */}
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {formatDateSafe(customer.created_at)}
                  </TableCell>

                  {/* Data Agendamento */}
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDateSafe(customer.scheduled_at)}
                  </TableCell>

                  {/* Data Reserva */}
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    {formatDateSafe(customer.reservation_date)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 p-4 border-t">
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
              className="h-8 text-xs"
            >
              Primeira
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-8 text-xs"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-8 text-xs"
            >
              Próxima
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              className="h-8 text-xs"
            >
              Última
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerTable;