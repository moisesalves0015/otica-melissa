import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CategoryPage from "./pages/CategoryPage";
import Marketplace from "./pages/Marketplace";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import ClientProfile from "./pages/admin/ClientProfile";
import Orders from "./pages/admin/Orders";
import Financial from "./pages/admin/Financial";
import Atendimentos from "./pages/admin/Atendimentos";
import OrderDetails from "./pages/admin/OrderDetails";
import AtendimentoDetails from "./pages/admin/AtendimentoDetails";
import AdminLogin from "./pages/admin/Login";
import Configuracoes from "./pages/admin/Configuracoes";
import LandingCMS from "./pages/admin/LandingCMS";
import Appointments from "./pages/admin/Appointments";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientProtectedRoute from "./components/ClientProtectedRoute";
import Rastreio from "./pages/Rastreio";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

// Institutional & Legal Pages
import TrocasDevolucoes from "@/src/pages/institutional/TrocasDevolucoes";
import FAQ from "@/src/pages/institutional/FAQ";
import PoliticaEntrega from "@/src/pages/institutional/PoliticaEntrega";
import Cuidados from "@/src/pages/institutional/Cuidados";
import Contato from "@/src/pages/institutional/Contato";
import Privacidade from "@/src/pages/institutional/Privacidade";
import Termos from "@/src/pages/institutional/Termos";

import Messages from "./pages/admin/Messages";

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/categoria/:categoryId" element={<CategoryPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/cliente/login" element={<ClientLogin />} />
          
          {/* Institutional Routes */}
          <Route path="/trocas-e-devolucoes" element={<TrocasDevolucoes />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/politica-de-entrega" element={<PoliticaEntrega />} />
          <Route path="/cuidados" element={<Cuidados />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />

          <Route element={<ClientProtectedRoute />}>
            <Route path="/cliente/dashboard" element={<ClientDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="clientes" element={<Clients />} />
              <Route path="clientes/:id" element={<ClientProfile />} />
              <Route path="pedidos" element={<Orders />} />
              <Route path="pedidos/:id" element={<OrderDetails />} />
              <Route path="financeiro" element={<Financial />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="atendimentos" element={<Atendimentos />} />
              <Route path="atendimentos/:id" element={<AtendimentoDetails />} />
              <Route path="landing-cms" element={<LandingCMS />} />
              <Route path="agendamentos" element={<Appointments />} />
              <Route path="mensagens" element={<Messages />} />
            </Route>
          </Route>
          <Route path="/rastreio" element={<Rastreio />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
