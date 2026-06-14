import { Building2, CalendarDays, LogOut, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { isRoleIn, UserRole } from "@/lib/auth/access-control";
import { cn } from "@/lib/utils";

const AppHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { role, signOut, status } = useAuth();
  const isAuthenticated = status === "authenticated";
  const canAccessPartners = isRoleIn(role, [UserRole.Admin, UserRole.Partner]);
  const canAccessProfiles = role === UserRole.Admin;

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  const menuItems = [
    {
      label: "Agendamentos",
      path: "/agendamentos",
      icon: CalendarDays,
      visible: true,
    },
    {
      label: "Clientes",
      path: "/consulta-clientes",
      icon: Users,
      visible: canAccessPartners,
    },
    {
      label: "Assessorias",
      path: "/assessorias",
      icon: Building2,
      visible: canAccessPartners,
    },
    {
      label: "Configurações",
      path: "/configuracoes",
      icon: Settings,
      visible: role === UserRole.Admin,
    },
    {
      label: "Perfis",
      path: "/perfis-acesso",
      icon: ShieldCheck,
      visible: canAccessProfiles,
    },
  ].filter((item) => item.visible);

  return (
    <>
      <div className="italian-stripe w-full" />
      <header className="relative z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="section-container relative">
          <div className="flex h-16 items-center justify-between">
            <button
              type="button"
              onClick={() => handleNavigate("/")}
              className="flex items-center gap-3 text-left"
              aria-label="Onestà Cidadania Italiana - Página Inicial"
            >
              <span className="font-serif text-xl font-semibold text-foreground md:text-2xl">Onestà</span>
              <span className="hidden text-sm text-muted-foreground sm:inline">Cidadania Italiana</span>
            </button>

            <button
              type="button"
              className="p-2"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
          </div>

          {isMenuOpen && (
            <nav
              className="absolute left-0 right-0 top-full z-50 border-t border-border bg-background p-4 shadow-lg animate-fade-in md:left-auto md:mt-2 md:w-80 md:rounded-lg md:border md:p-3"
              aria-label="Menu de navegação"
            >
              <div className="flex flex-col gap-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Button
                      key={item.path}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      className={cn("w-full justify-start", isActive && "pointer-events-none")}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}

                {isAuthenticated && (
                  <Button type="button" variant="outline" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default AppHeader;
