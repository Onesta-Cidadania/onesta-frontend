import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Agendamentos from "./pages/Agendamentos";
import Assessorias from "./pages/Assessorias";
import Login from "./pages/Login";
import RecuperarSenha from "./pages/RecuperarSenha";
import NovaSenha from "./pages/NovaSenha";
import SessionExpirationMonitor from "./components/SessionExpirationMonitor";
import AcessoNegado from "./pages/AcessoNegado";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { UserRole } from "./lib/auth/access-control";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* <SupabaseTest /> */}
      <BrowserRouter>
        <AuthProvider>
          <SessionExpirationMonitor />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/nova-senha" element={<NovaSenha />} />
            <Route path="/acesso-negado" element={<AcessoNegado />} />
            <Route
              path="/agendamentos"
              element={<Agendamentos />}
            />
            <Route
              path="/assessorias"
              element={
                <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Partner]}>
                  <Assessorias />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
