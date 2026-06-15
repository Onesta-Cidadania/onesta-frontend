import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Agendamento from "./pages/Agendamento";
import Agendamentos from "./pages/Agendamentos";
import Testes from "./pages/Testes";
import Assessorias from "./pages/Assessorias";
import ConsultaClientes from "./pages/ConsultaClientes";
import Login from "./pages/Login";
import PerfisAcesso from "./pages/PerfisAcesso";
import RecuperarSenha from "./pages/RecuperarSenha";
import NovaSenha from "./pages/NovaSenha";
import SessionExpirationMonitor from "./components/SessionExpirationMonitor";
import AcessoNegado from "./pages/AcessoNegado";
import Configuracoes from "./pages/Configuracoes";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { UserRole } from "./lib/auth/access-control";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SessionExpirationMonitor />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/nova-senha" element={<NovaSenha />} />
            <Route path="/acesso-negado" element={<AcessoNegado />} />
            {/* Rota pública - sem ProtectedRoute */}
            <Route path="/agendamentos" element={<Agendamentos />} />
            {/* Formulário dinâmico - público */}
            <Route path="/agendamento" element={<Agendamento />} />
            <Route path="/testes" element={<Testes />} />
            <Route
              path="/assessorias"
              element={
                <ProtectedRoute
                  allowedRoles={[UserRole.Admin, UserRole.Partner]}
                >
                  <Assessorias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfis-acesso"
              element={
                <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                  <PerfisAcesso />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consulta-clientes"
              element={
                <ProtectedRoute
                  allowedRoles={[UserRole.Admin, UserRole.Partner]}
                >
                  <ConsultaClientes />
                </ProtectedRoute>
              }
            />
            {
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                    <Configuracoes />
                  </ProtectedRoute>
                }
              />
            }
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;