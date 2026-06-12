import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, LogOut, Pencil, Plus, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/PaginationControls";
import { useAuthenticatedActivity } from "@/hooks/use-authenticated-activity";
import { useAuth } from "@/hooks/use-auth";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { isRoleIn, UserRole } from "@/lib/auth/access-control";
import { supabase } from "@/lib/supabase/client";

interface Partner {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface PartnerFormState {
  fullName: string;
  email: string;
  phone: string;
}

const emptyForm: PartnerFormState = {
  fullName: "",
  email: "",
  phone: "",
};

const Assessorias = () => {
  const navigate = useNavigate();
  const { role, partnerId, user, signOut } = useAuth();
  useAuthenticatedActivity();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [form, setForm] = useState<PartnerFormState>(emptyForm);
  const pagination = usePaginatedQuery(10);
  const { page, pageSize, total, totalPages, from, to, setPage, setPageSize, setTotal, resetPage } = pagination;

  const canCreatePartner = role === UserRole.Admin;
  const canEditPartners = isRoleIn(role, [UserRole.Admin, UserRole.Partner]);

  const filteredTitle = useMemo(() => {
    if (role === UserRole.Partner) {
      return "Sua assessoria";
    }

    return "Assessorias";
  }, [role]);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      let query = supabase()
        .from("partners")
        .select("id,full_name,email,phone,created_at", { count: role === UserRole.Admin ? "exact" : undefined })
        .order("full_name", { ascending: true });

      if (role === UserRole.Partner) {
        if (!partnerId) {
          setPartners([]);
          setErrorMessage("Seu usuário não possui assessoria vinculada.");
          return;
        }

        query = query.eq("id", partnerId);
      } else if (nameFilter.trim()) {
        query = query.ilike("full_name", `%${nameFilter.trim()}%`);
      }

      if (role === UserRole.Admin) {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        setErrorMessage("Não foi possível carregar as assessorias.");
        setPartners([]);
        setTotal(0);
        return;
      }

      setPartners((data ?? []) as Partner[]);
      setTotal(role === UserRole.Admin ? count ?? 0 : data?.length ?? 0);
    } catch {
      setErrorMessage("Não foi possível carregar as assessorias.");
      setPartners([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [from, nameFilter, partnerId, role, setTotal, to]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchPartners();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [fetchPartners]);

  const openCreateDialog = () => {
    setEditingPartner(null);
    setForm(emptyForm);
    setErrorMessage("");
    setSuccessMessage("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner);
    setForm({
      fullName: partner.full_name,
      email: partner.email,
      phone: partner.phone ?? "",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.fullName.trim()) {
      setErrorMessage("Informe o nome da assessoria.");
      return;
    }

    if (!form.email.trim()) {
      setErrorMessage("Informe o e-mail da assessoria.");
      return;
    }

    setIsSaving(true);

    const payload = {
      full_name: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingPartner) {
        const { error } = await supabase().from("partners").update(payload).eq("id", editingPartner.id);

        if (error) {
          setErrorMessage("Não foi possível atualizar a assessoria.");
          return;
        }

        setSuccessMessage("Assessoria atualizada com sucesso.");
      } else {
        const { error } = await supabase()
          .from("partners")
          .insert({
            ...payload,
            created_by: user?.id ?? null,
          });

        if (error) {
          setErrorMessage("Não foi possível criar a assessoria.");
          return;
        }

        setSuccessMessage("Assessoria criada com sucesso.");
      }

      setIsDialogOpen(false);
      setForm(emptyForm);
      setEditingPartner(null);
      await fetchPartners();
    } catch {
      setErrorMessage(editingPartner ? "Não foi possível atualizar a assessoria." : "Não foi possível criar a assessoria.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-section">
      <div className="italian-stripe w-full" />

      <header className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="section-container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-3" aria-label="Onestà Cidadania Italiana - Página Inicial">
            <span className="font-serif text-xl font-semibold text-foreground md:text-2xl">Onestà</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">Cidadania Italiana</span>
          </a>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/agendamentos")}>
              Agendamentos
            </Button>
            {role === UserRole.Admin && (
              <Button type="button" variant="outline" onClick={() => navigate("/perfis-acesso")}>
                <ShieldCheck className="h-4 w-4" />
                Perfis
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="section-container py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">{filteredTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Consulte e mantenha os dados das assessorias cadastradas na plataforma.
            </p>
          </div>

          {canCreatePartner && (
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Nova assessoria
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de assessorias</CardTitle>
          </CardHeader>
          <CardContent>
            {role === UserRole.Admin && (
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
	                  <Input
	                    value={nameFilter}
	                    onChange={(event) => {
	                      setNameFilter(event.target.value);
	                      resetPage();
	                    }}
	                    placeholder="Filtrar por nome da assessoria"
	                    className="pl-10"
	                  />
                </div>
                <Button type="button" variant="outline" onClick={() => void fetchPartners()}>
                  Buscar
                </Button>
              </div>
            )}

            {errorMessage && (
              <p className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="mb-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {successMessage}
              </p>
            )}

            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-28 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhuma assessoria encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    partners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium">{partner.full_name}</TableCell>
                        <TableCell>{partner.email}</TableCell>
                        <TableCell>{partner.phone || "-"}</TableCell>
                        <TableCell className="text-right">
                          {canEditPartners && (
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(partner)}>
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
	              </Table>
	            )}
	            {role === UserRole.Admin && (
	              <PaginationControls
	                page={page}
	                pageSize={pageSize}
	                total={total}
	                totalPages={totalPages}
	                onPageChange={setPage}
	                onPageSizeChange={setPageSize}
	              />
	            )}
	          </CardContent>
	        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="left-4 right-4 max-h-[calc(100dvh-2rem)] w-auto max-w-none translate-x-0 overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingPartner ? "Editar assessoria" : "Nova assessoria"}</DialogTitle>
            <DialogDescription>Preencha os dados básicos da assessoria.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                disabled={isSaving}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assessorias;
