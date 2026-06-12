/**
 * ConsultaClientes - Tela de consulta de clientes com filtros e paginação
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Users } from "lucide-react";
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
  Partner,
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
  const [partners, setPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
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
    setSuccessMessage("");

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

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
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
            <Button type="button" variant="outline" onClick={() => navigate("/assessorias")}>
              Assessorias
            </Button>
            {role === "admin" && (
              <Button type="button" variant="outline" onClick={() => navigate("/configuracoes")}>
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </Button>
            )}
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
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Consulta de Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pesquise e filtre os clientes cadastrados no sistema.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {successMessage}
          </div>
        )}

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
        <div className="mt-6">
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
          />
        </div>
      </main>
    </div>
  );
};

export default ConsultaClientes;