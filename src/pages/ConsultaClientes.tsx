/**
 * ConsultaClientes - Tela de consulta de clientes com filtros e paginação
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthenticatedActivity } from "@/hooks/use-authenticated-activity";
import { useAuth } from "@/hooks/use-auth";
import { customerService } from "@/services/customer.service";
import { CustomerFiltersPanel } from "@/components/customers/CustomerFilters";
import { CustomerTable } from "@/components/customers/CustomerTable";
import type {
  CustomerFilters,
  CustomerWithRelations,
  Service,
  CustomerStatusOption,
} from "@/lib/supabase/types";

const ConsultaClientes = () => {
  const navigate = useNavigate();
  const { role, partnerId, signOut } = useAuth();
  useAuthenticatedActivity();

  // State
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [statusOptions, setStatusOptions] = useState<CustomerStatusOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAppliedFilters, setLastAppliedFilters] = useState<CustomerFilters>({});

  // Buscar serviços e status para os filtros
  useEffect(() => {
    const loadData = async () => {
      const [servicesResult, statusesResult] = await Promise.all([
        customerService.getServices(),
        customerService.getStatuses(),
      ]);
      if (servicesResult.data) {
        setServices(servicesResult.data);
      }
      if (statusesResult.data) {
        setStatusOptions(statusesResult.data);
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

  // Buscar ao montar
  useEffect(() => {
    if (role) {
      fetchCustomers({}, page, pageSize);
    }
  }, [fetchCustomers, page, pageSize, role]);

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

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Italian Stripe */}
      <div className="italian-stripe w-full" />

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/agendamentos")}
              className="mr-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <a href="/" className="flex items-center gap-3" aria-label="Onestà Cidadania Italiana">
              <span className="font-serif text-xl md:text-2xl font-semibold text-foreground">
                Onestà
              </span>
              <span className="hidden sm:inline text-muted-foreground text-sm">
                Consulta de Clientes
              </span>
            </a>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Consulta de Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pesquise e filtre os clientes cadastrados no sistema.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
          isLoading={isLoading}
          hasActiveFilters={Object.values(lastAppliedFilters).some(
            (v) => v !== undefined && v !== ""
          )}
        />

        {/* Table */}
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
        />
      </main>
    </div>
  );
};

export default ConsultaClientes;