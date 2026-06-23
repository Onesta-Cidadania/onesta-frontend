import {FormEvent, useCallback, useEffect, useMemo, useState} from "react";
import {Building2, Loader2, Pencil, Plus, Search} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {PaginationControls} from "@/components/PaginationControls";
import {useAuthenticatedActivity} from "@/hooks/use-authenticated-activity";
import {useAuth} from "@/hooks/use-auth";
import {toast} from "@/components/ui/sonner";
import {usePaginatedQuery} from "@/hooks/use-paginated-query";
import {isRoleIn, UserRole} from "@/lib/auth/access-control";
import {supabase} from "@/lib/supabase/client";

/** Formata valor digitado como telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX */
function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Formata telefone para exibição na tabela */
function displayPhone(phone: string | null): string {
    if (!phone) return "—";
    return formatPhone(phone);
}

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
    const {role, partnerId, user} = useAuth();
    useAuthenticatedActivity();

    const [partners, setPartners] = useState<Partner[]>([]);
    const [nameFilter, setNameFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [form, setForm] = useState<PartnerFormState>(emptyForm);
    const pagination = usePaginatedQuery(10);
    const {page, pageSize, total, totalPages, from, to, setPage, setPageSize, setTotal, resetPage} = pagination;


    const canCreatePartner = role === UserRole.Admin;
    const canEditPartners = isRoleIn(role, [UserRole.Admin, UserRole.Partner]);

    const filteredTitle = useMemo(() => {
        if (role === UserRole.Partner) {
            return "Sua assessoria";
        }

        return "Assessorias";
    }, [role]);

    const fetchPartners = useCallback(async (filterName?: string) => {
        setIsLoading(true);

        try {
            let query = supabase()
                .from("partners")
                .select("id,full_name,email,phone,created_at", {count: role === UserRole.Admin ? "exact" : undefined})
                .order("full_name", {ascending: true});

            if (role === UserRole.Partner) {
                if (!partnerId) {
                    setPartners([]);
                    toast.error("Seu usuário não possui assessoria vinculada.");
                    return;
                }

                query = query.eq("id", partnerId);
            } else {
                const searchName = (filterName ?? nameFilter).trim();
                if (searchName) {
                    query = query.ilike("full_name", `%${searchName}%`);
                }
            }

            if (role === UserRole.Admin) {
                query = query.range(from, to);
            }

            const {data, error, count} = await query;

            if (error) {
                toast.error("Não foi possível carregar as assessorias.");
                setPartners([]);
                setTotal(0);
                return;
            }

            setPartners((data ?? []) as Partner[]);
            setTotal(role === UserRole.Admin ? count ?? 0 : data?.length ?? 0);
        } catch {
            toast.error("Não foi possível carregar as assessorias.");
            setPartners([]);
            setTotal(0);
        } finally {
            setIsLoading(false);
        }
    }, [from, nameFilter, partnerId, role, setTotal, to]);

    // Buscar ao montar / quando role muda
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Buscar quando role, partnerId, page ou pageSize mudam
    useEffect(() => {
        if (role) {
            void fetchPartners();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, partnerId, page, pageSize]);

    const openCreateDialog = () => {
        setEditingPartner(null);
        setForm(emptyForm);
        setIsDialogOpen(true);
    };

    const openEditDialog = (partner: Partner) => {
        setEditingPartner(partner);
        setForm({
            fullName: partner.full_name,
            email: partner.email,
            phone: formatPhone(partner.phone ?? ""),
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.fullName.trim()) {
            toast.error("Informe o nome da assessoria.");
            return;
        }

        if (!form.email.trim()) {
            toast.error("Informe o e-mail da assessoria.");
            return;
        }

        setIsSaving(true);

        const payload = {
            full_name: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.replace(/\D/g, "") || null,
            updated_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
        };

        try {
            if (editingPartner) {
                const {error} = await supabase().from("partners").update(payload).eq("id", editingPartner.id);

                if (error) {
                    toast.error("Não foi possível atualizar a assessoria.");
                    return;
                }

                toast.success("Assessoria atualizada com sucesso.");
            } else {
                const {error} = await supabase()
                    .from("partners")
                    .insert({
                        ...payload,
                        created_by: user?.id ?? null,
                    });

                if (error) {
                    toast.error("Não foi possível criar a assessoria.");
                    return;
                }

                toast.success("Assessoria criada com sucesso.");
            }

            setIsDialogOpen(false);
            setForm(emptyForm);
            setEditingPartner(null);
            await fetchPartners();
        } catch {
            toast.error(editingPartner ? "Não foi possível atualizar a assessoria." : "Não foi possível criar a assessoria.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFilterKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            void fetchPartners();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-section">
            <AppHeader/>

            <main className="section-container py-12 md:py-16">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary"/>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground md:text-4xl">{filteredTitle}</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            Consulte e mantenha os dados das assessorias cadastradas na plataforma.
                        </p>
                    </div>

                    {canCreatePartner && (
                        <Button type="button" onClick={openCreateDialog}>
                            <Plus className="h-4 w-4"/>
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
                                    <Search
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                    <Input
                                        value={nameFilter}
                                        onChange={(event) => {
                                            setNameFilter(event.target.value);
                                            resetPage();
                                        }}
                                        onKeyDown={handleFilterKeyDown} placeholder="Filtrar por nome da assessoria"
                                        className="pl-10"
                                    />
                                </div>
                                <Button type="button" variant="outline" onClick={() => void fetchPartners()}
                                        disabled={isLoading}>
                                    <Search className="h-4 w-4 mr-1"/>
                                    Buscar
                                </Button>
                            </div>
                        )}

                        {/* Loading state: initial load (no data yet) */}
                        {isLoading && partners.length === 0 ? (
                            <div className="flex min-h-48 items-center justify-center">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                                    <span className="text-sm">Carregando assessorias...</span>
                                </div>
                            </div>
                        ) : partners.length === 0 && !isLoading ? (
                            /* Empty state */
                            <div
                                className="flex min-h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                                <Building2 className="h-10 w-10 opacity-30"/>
                                <span className="text-sm">Nenhuma assessoria encontrada.</span>
                                <span className="text-xs">Tente ajustar o filtro de busca.</span>
                            </div>
                        ) : (
                            /* Table with loading overlay */
                            <div className="relative">
                                {isLoading && partners.length > 0 && (
                                    <div
                                        className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm">
                                        <div
                                            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 shadow-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary"/>
                                            <span className="text-sm">Carregando...</span>
                                        </div>
                                    </div>
                                )}
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
                                        {partners.map((partner) => (
                                            <TableRow key={partner.id}>
                                                <TableCell className="font-medium">{partner.full_name}</TableCell>
                                                <TableCell>{partner.email}</TableCell>
                                                <TableCell>{displayPhone(partner.phone)}</TableCell>
                                                <TableCell className="text-right">
                                                    {canEditPartners && (
                                                        <Button type="button" variant="outline" size="sm"
                                                                onClick={() => openEditDialog(partner)}>
                                                            <Pencil className="h-4 w-4"/>
                                                            Editar
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table></div>
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
                <DialogContent
                    className="left-4 right-4 max-h-[calc(100dvh-2rem)] w-auto max-w-none translate-x-0 overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:p-6">
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
                                onChange={(event) => setForm((current) => ({...current, fullName: event.target.value}))}
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
                                onChange={(event) => setForm((current) => ({...current, email: event.target.value}))}
                                disabled={isSaving}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={form.phone}
                                onChange={(event) =>
                                    setForm((current) => ({...current, phone: formatPhone(event.target.value)}))
                                }
                                disabled={isSaving}
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}
                                    disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin"/>
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
