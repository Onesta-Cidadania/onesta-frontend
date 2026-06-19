import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/PaginationControls";
import { useAuthenticatedActivity } from "@/hooks/use-authenticated-activity";
import { useAuth } from "@/hooks/use-auth";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/auth/access-control";
import { toast } from "@/components/ui/sonner";
import { accessProfileService } from "@/services/access-profile.service";
import type { AccessProfile, PartnerOption, UserOption, UserRoleType } from "@/lib/supabase/types";

interface AccessProfileFormState {
  userId: string;
  userEmail: string;
  role: UserRoleType;
  partnerId: string;
  partnerName: string;
}

const emptyForm: AccessProfileFormState = {
  userId: "",
  userEmail: "",
  role: UserRole.Customer,
  partnerId: "",
  partnerName: "",
};

const accessProfileRoleLabels: Record<UserRoleType, string> = {
  [UserRole.Customer]: "Cliente",
  [UserRole.Partner]: "Assessoria",
  [UserRole.Admin]: "Administrador",
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const PerfisAcesso = () => {
  const { user } = useAuth();
  useAuthenticatedActivity();

  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [emailFilter, setEmailFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
  const [hasMoreUserOptions, setHasMoreUserOptions] = useState(false);
  const [hasMorePartnerOptions, setHasMorePartnerOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);
  const [isPartnerPopoverOpen, setIsPartnerPopoverOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<AccessProfile | null>(null);
  const [form, setForm] = useState<AccessProfileFormState>(emptyForm);
  const pagination = usePaginatedQuery(10);
  const { page, pageSize, total, totalPages, setPage, setPageSize, setTotal, resetPage } = pagination;
  const isEditingOwnProfile = editingProfile?.userId === user?.id;

  const sortedPartnerOptions = useMemo(
    () => [...partnerOptions].sort((left, right) => left.full_name.localeCompare(right.full_name)),
    [partnerOptions],
  );

  const fetchUsersByEmail = useCallback(async (search: string) => {
    const result = await accessProfileService.getUserOptions(search);

    if (result.error) {
      setUserOptions([]);
      setHasMoreUserOptions(false);
      return;
    }

    if (result.data) {
      setUserOptions(result.data.options);
      setHasMoreUserOptions(result.data.hasMore);
    }
  }, []);

  const fetchPartnersBySearch = useCallback(async (search: string) => {
    const result = await accessProfileService.getPartnerOptions(search);

    if (result.error) {
      setPartnerOptions([]);
      setHasMorePartnerOptions(false);
      return;
    }

    if (result.data) {
      setPartnerOptions(result.data.options);
      setHasMorePartnerOptions(result.data.hasMore);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);

    const result = await accessProfileService.getProfiles(emailFilter, page, pageSize);

    if (result.error) {
      toast.error("Não foi possível carregar os perfis de acesso.");
      setProfiles([]);
      setTotal(0);
    } else if (result.data) {
      setProfiles(result.data.profiles);
      setTotal(result.data.total);
    }

    setIsLoading(false);
  }, [emailFilter, page, pageSize, setTotal]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchProfiles();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [fetchProfiles]);

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchUsersByEmail(userSearch);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [fetchUsersByEmail, isDialogOpen, userSearch]);

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchPartnersBySearch(partnerSearch);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [fetchPartnersBySearch, isDialogOpen, partnerSearch]);

  const openCreateDialog = () => {
    setEditingProfile(null);
    setForm(emptyForm);
    setUserSearch("");
    setPartnerSearch("");
    setUserOptions([]);
    setPartnerOptions([]);
    setHasMoreUserOptions(false);
    setHasMorePartnerOptions(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (profile: AccessProfile) => {
    setEditingProfile(profile);
    setForm({
      userId: profile.userId,
      userEmail: profile.email,
      role: profile.role,
      partnerId: profile.partnerId ?? "",
      partnerName: profile.partnerName ?? "",
    });
    setUserSearch(profile.email);
    setPartnerSearch(profile.partnerName ?? "");
    setUserOptions([{ user_id: profile.userId, email: profile.email }]);
    setPartnerOptions(
      profile.partnerId && profile.partnerName
        ? [{ id: profile.partnerId, full_name: profile.partnerName, email: "" }]
        : [],
    );
    setHasMoreUserOptions(false);
    setHasMorePartnerOptions(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.userId) {
      toast.error("Selecione o usuário.");
      return;
    }

    if (!form.partnerId) {
      toast.error("Selecione a assessoria.");
      return;
    }

    setIsSaving(true);

    const payload = {
      user_id: form.userId,
      role: isEditingOwnProfile ? editingProfile.role : form.role,
      partner_id: form.partnerId,
    };

    try {
      if (editingProfile) {
        const result = await accessProfileService.updateProfile(editingProfile.id, payload);

        if (result.error || !result.data) {
          toast.error("Não foi possível atualizar o perfil de acesso.");
          return;
        }

        toast.success("Perfil de acesso atualizado com sucesso.");
      } else {
        const result = await accessProfileService.createProfile(payload);

        if (result.error || !result.data) {
          toast.error("Não foi possível criar o perfil. Verifique se o usuário já possui perfil.");
          return;
        }

        toast.success("Perfil de acesso criado com sucesso.");
      }

      setIsDialogOpen(false);
      setForm(emptyForm);
      setEditingProfile(null);
      await fetchProfiles();
    } catch {
      toast.error(editingProfile ? "Não foi possível atualizar o perfil de acesso." : "Não foi possível criar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profileToDelete) {
      return;
    }

    if (profileToDelete.userId === user?.id) {
      toast.error("Não é possível excluir seu próprio perfil de acesso.");
      setProfileToDelete(null);
      return;
    }

    setIsDeleting(true);

    try {
      const result = await accessProfileService.deleteProfile(profileToDelete.id);

      if (result.error) {
        toast.error("Não foi possível excluir o perfil de acesso.");
        return;
      }

      toast.success("Perfil de acesso excluído com sucesso.");
      setProfileToDelete(null);

      if (profiles.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchProfiles();
      }
    } catch {
      toast.error("Não foi possível excluir o perfil de acesso.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-section">
      <AppHeader />

      <main className="section-container py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Perfis de acesso</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Consulte e mantenha os perfis vinculados aos usuários cadastrados.
            </p>
          </div>

          <Button type="button" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Novo perfil
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de perfis de acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={emailFilter}
                  onChange={(event) => {
                    setEmailFilter(event.target.value);
                    resetPage();
                  }}
                  placeholder="Filtrar por e-mail"
                  className="pl-10"
                />
              </div>
              <Button type="button" variant="outline" onClick={() => void fetchProfiles()}>
                Buscar
              </Button>
            </div>

            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Assessoria</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-48 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum perfil de acesso encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.email}</TableCell>
                        <TableCell>{accessProfileRoleLabels[profile.role]}</TableCell>
                        <TableCell>{profile.partnerName ?? "-"}</TableCell>
                        <TableCell>{formatDate(profile.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(profile)}>
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setProfileToDelete(profile)}
                              disabled={profile.userId === user?.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="left-4 right-4 max-h-[calc(100dvh-2rem)] w-auto max-w-none translate-x-0 overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingProfile ? "Editar perfil de acesso" : "Novo perfil de acesso"}</DialogTitle>
            <DialogDescription>Defina o perfil e a assessoria vinculada ao usuário.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Popover
                open={isUserPopoverOpen}
                onOpenChange={(open) => {
                  setIsUserPopoverOpen(open);

                  if (open) {
                    void fetchUsersByEmail(userSearch);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={isSaving || Boolean(editingProfile)}
                    className="w-full justify-between"
                  >
                    <span className="truncate">{form.userEmail || "Pesquisar e-mail"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput value={userSearch} onValueChange={setUserSearch} placeholder="Buscar e-mail" />
                    <div className="max-h-64 overflow-y-auto overscroll-contain" onWheel={(event) => event.stopPropagation()}>
                      <CommandList className="max-h-none overflow-visible">
                        <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                        <CommandGroup>
                          {userOptions.map((option) => (
                            <CommandItem
                            key={option.user_id}
                            value={option.user_id}
                              className="data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
                              onSelect={() => {
                                setForm((current) => ({
                                  ...current,
                                  userId: option.user_id,
                                  userEmail: option.email,
                                }));
                                setIsUserPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn("mr-2 h-4 w-4", form.userId === option.user_id ? "opacity-100" : "opacity-0")}
                              />
                              <span className="truncate">{option.email}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </div>
                    {hasMoreUserOptions && (
                      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                        {userSearch.trim()
                          ? "Mostrando 20 resultados. Refine a busca."
                          : "Mostrando 5 usuários. Digite para pesquisar."}
                      </div>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    role: value as UserRoleType,
                  }))
                }
                disabled={isSaving || isEditingOwnProfile}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.Customer}>{accessProfileRoleLabels[UserRole.Customer]}</SelectItem>
                  <SelectItem value={UserRole.Partner}>{accessProfileRoleLabels[UserRole.Partner]}</SelectItem>
                  <SelectItem value={UserRole.Admin}>{accessProfileRoleLabels[UserRole.Admin]}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assessoria</Label>
              <Popover
                open={isPartnerPopoverOpen}
                onOpenChange={(open) => {
                  setIsPartnerPopoverOpen(open);

                  if (open) {
                    void fetchPartnersBySearch(partnerSearch);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={isSaving}
                    className="w-full justify-between"
                  >
                    <span className="truncate">{form.partnerName || "Pesquisar assessoria"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput value={partnerSearch} onValueChange={setPartnerSearch} placeholder="Buscar assessoria" />
                    <div className="max-h-64 overflow-y-auto overscroll-contain" onWheel={(event) => event.stopPropagation()}>
                      <CommandList className="max-h-none overflow-visible">
                        <CommandEmpty>Nenhuma assessoria encontrada.</CommandEmpty>
                        <CommandGroup>
                          {sortedPartnerOptions.map((option) => (
                            <CommandItem
                              key={option.id}
                              value={option.id}
                              className="data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
                              onSelect={() => {
                                setForm((current) => ({
                                  ...current,
                                  partnerId: option.id,
                                  partnerName: option.full_name,
                                }));
                                setIsPartnerPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.partnerId === option.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="min-w-0">
                                <p className="truncate">{option.full_name}</p>
                                {option.email && <p className="truncate text-xs text-muted-foreground">{option.email}</p>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </div>
                    {hasMorePartnerOptions && (
                      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                        {partnerSearch.trim()
                          ? "Mostrando 20 resultados. Refine a busca."
                          : "Mostrando 5 assessorias. Digite para pesquisar."}
                      </div>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
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

      <AlertDialog open={Boolean(profileToDelete)} onOpenChange={(open) => !open && setProfileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir perfil de acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o vínculo de acesso de {profileToDelete?.email}. O usuário não será removido do Supabase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PerfisAcesso;
