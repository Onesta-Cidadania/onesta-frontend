/**
 * ConsultaClientes - Tela de consulta de clientes com filtros e paginação
 */

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "@/components/ui/sonner";
import { useAuthenticatedActivity } from "@/hooks/use-authenticated-activity";
import { useAuth } from "@/hooks/use-auth";
import { customerService } from "@/services/customer.service";
import { CustomerFiltersPanel } from "@/components/customers/CustomerFilters";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { Card, CardContent } from "@/components/ui/card";
import type {
  CustomerFilters,
  CustomerWithRelations,
  Service,
  CustomerStatusOption,
  Partner,
} from "@/lib/supabase/types";

const ConsultaClientes = () => {
  const { role, partnerId, user } = useAuth();
  useAuthenticatedActivity();

  // State
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [statusOptions, setStatusOptions] = useState<CustomerStatusOption[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastAppliedFilters, setLastAppliedFilters] = useState<CustomerFilters>({});

  // Buscar serviços, status e parceiros para os filtros
  useEffect(() => {
    const loadData = async () => {
      const [servicesResult, statusesResult, partnersResult] = await Promise.all([
        customerService.getServices(),
        customerService.getStatuses(),
        customerService.getPartners(),
      ]);
      if (servicesResult.data) {
        setServices(servicesResult.data);
      }
      if (statusesResult.data) {
        setStatusOptions(statusesResult.data);
      }
      if (partnersResult.data) {
        setPartners(partnersResult.data);
      }
    };
    loadData();
  }, []);

  // Buscar clientes - recebe parâmetros diretamente (não lê do state)
  const fetchCustomers = useCallback(async (
    searchFilters: CustomerFilters,
    searchPage: number,
    searchPageSize: number
  ) => {
    setIsLoading(true);
    setError(null);

    const result = await customerService.getCustomers(
      searchFilters, searchPage, searchPageSize,
      { role, partnerId }
    );

    if (result.error) {
      setError(result.error.message);
      setCustomers([]);
      setTotal(0);
      setTotalPages(0);
    } else if (result.data) {
      setCustomers(result.data.customers);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
    }

    setIsLoading(false);
  }, [role, partnerId]);

  // Buscar ao montar / quando role muda (não depende de page/pageSize para evitar dupla chamada)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (role) {
      fetchCustomers({}, 1, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Handlers
  const handleSearch = (overrideFilters?: CustomerFilters) => {
    const searchFilters = overrideFilters ?? filters;
    setPage(1);
    setLastAppliedFilters(searchFilters);
    fetchCustomers(searchFilters, 1, pageSize);
  };

  const handleFiltersChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCustomers(lastAppliedFilters, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    fetchCustomers(lastAppliedFilters, 1, newSize);
  };

  // Status change handlers
  const handleStatusChange = async (customerId: string, newStatus: string) => {
    setIsUpdatingStatus(true);

    const customer = customers.find((c) => c.id === customerId);
    const currentStatus = customer?.status;

    const result = await customerService.updateCustomerStatus(
      customerId, 
      newStatus, 
      currentStatus, 
      user?.email,
      {
        customerName: customer?.full_name || '',
        customerCode: customer?.customer_code || '',
        customerEmail: customer?.email || '',
      },
      role
    );

    if (result.error) {
      toast.error("Erro ao atualizar status: " + result.error.message);
    } else {
      toast.success("Status atualizado com sucesso.");
      // Update local state to reflect change immediately
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, status: newStatus, previous_status: currentStatus ?? c.status }
            : c
        )
      );
      setSelectedIds(new Set());
    }

    setIsUpdatingStatus(false);
  };

  const handleBatchStatusChange = async (ids: string[], newStatus: string) => {
    setIsUpdatingStatus(true);

    const items = ids.map((id) => {
      const customer = customers.find((c) => c.id === id);
      return { 
        id, 
        currentStatus: customer?.status ?? "",
        customerCode: customer?.customer_code,
        customerEmail: customer?.email
      };
    });

    const result = await customerService.batchUpdateCustomerStatus(items, newStatus, user?.email, role);

    if (result.error) {
      toast.error(result.error.message || "Erro ao atualizar status em lote.");
    }

    if (result.data) {
      const successCount = result.data.success.length;
      const failedCount = result.data.failed.length;

      if (failedCount === 0) {
        toast.success(
          `${successCount} ${successCount === 1 ? "status atualizado" : "status atualizados"} com sucesso.`
        );
      } else {
        toast.error(
          `${successCount} ${successCount === 1 ? "status atualizado" : "status atualizados"}. ${failedCount} ${failedCount === 1 ? "falha" : "falhas"}.`
        );
      }

      // Update local state for successful changes
      setCustomers((prev) =>
        prev.map((c) =>
          result.data!.success.includes(c.id) ? { ...c, status: newStatus } : c
        )
      );
      setSelectedIds(new Set());
    }

    setIsUpdatingStatus(false);
  };

  // Priority change handler (individual)
  const handlePriorityChange = async (customerId: string, priority: boolean) => {
    const customer = customers.find((c) => c.id === customerId);
    const previousPriority = customer?.priority ?? false;

    // Optimistic update
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, priority } : c))
    );

    setIsUpdatingPriority(true);

    const result = await customerService.updateCustomerPriority(
      customerId,
      priority,
      customer?.priority,
      user?.email,
      role,
      {
        customerName: customer?.full_name || '',
        customerCode: customer?.customer_code || '',
        customerEmail: customer?.email || '',
      }
    );

    if (result.error) {
      toast.error("Erro ao atualizar prioridade: " + result.error.message);
      // Revert on error
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, priority: previousPriority } : c
        )
      );
    } else {
      toast.success(priority ? "Cliente marcado como prioritário." : "Prioridade removida.");
    }

    setIsUpdatingPriority(false);
  };

  // Priority change handler (batch)
  const handleBatchPriorityChange = async (ids: string[], newPriority: boolean) => {
    setIsUpdatingPriority(true);

    const items = ids.map((id) => {
      const customer = customers.find((c) => c.id === id);
      return { 
        id, 
        currentPriority: customer?.priority,
        customerCode: customer?.customer_code || '',
        customerEmail: customer?.email || ''
      };
    });

    const result = await customerService.batchUpdateCustomerPriority(
      items, 
      newPriority, 
      user?.email,
      role
    );

    if (result.error) {
      toast.error(result.error.message || "Erro ao atualizar prioridade em lote.");
    }

    if (result.data) {
      const successCount = result.data.success.length;
      const failedCount = result.data.failed.length;

      if (failedCount === 0) {
        toast.success(
          `${successCount} ${successCount === 1 ? "cliente marcado" : "clientes marcados"} como ${newPriority ? 'prioritário' : 'não prioritário'}.`
        );
      } else {
        toast.error(
          `${successCount} ${successCount === 1 ? "cliente marcado" : "clientes marcados"}. ${failedCount} ${failedCount === 1 ? "falha" : "falhas"}.`
        );
      }

      // Update local state for successful changes
      setCustomers((prev) =>
        prev.map((c) =>
          result.data!.success.includes(c.id) ? { ...c, priority: newPriority } : c
        )
      );
      setSelectedIds(new Set());
    }

    setIsUpdatingPriority(false);
  };

  return (
    <div className="min-h-screen bg-gradient-section">
      <AppHeader />

      {/* Content */}
      <main className="section-container py-12 md:py-16">
        {/* Title */}
        <div className="mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Consulta de Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pesquise e filtre os clientes cadastrados no sistema.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Erro ao buscar clientes: {error}
          </div>
        )}

        {/* Filters */}
        <CustomerFiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          services={services}
          statusOptions={statusOptions}
          partners={partners}
          isLoading={isLoading}
          hasActiveFilters={Object.values(lastAppliedFilters).some(
            (v) => v !== undefined && v !== ""
          )}
          role={role}
        />

        {/* Table */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <CustomerTable
              customers={customers}
              total={total}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={isLoading}
              statusOptions={statusOptions}
              role={role}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onStatusChange={handleStatusChange}
              onBatchStatusChange={handleBatchStatusChange}
              isUpdatingStatus={isUpdatingStatus}
              onPriorityChange={handlePriorityChange}
              onBatchPriorityChange={handleBatchPriorityChange}
              isUpdatingPriority={isUpdatingPriority}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ConsultaClientes;
