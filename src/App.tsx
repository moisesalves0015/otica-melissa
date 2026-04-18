import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import ClientProfile from "./pages/admin/ClientProfile";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Financial from "./pages/admin/Financial";
import Atendimentos from "./pages/admin/Atendimentos";
import AdminLogin from "./pages/admin/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

// Temporary placeholder for settings
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-3xl font-black tracking-tighter uppercase">{title}</h1>
    <p className="mt-4 text-slate-500">Esta página está em desenvolvimento como parte das configurações do sistema.</p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="clientes" element={<Clients />} />
              <Route path="clientes/:id" element={<ClientProfile />} />
              <Route path="produtos" element={<Products />} />
              <Route path="pedidos" element={<Orders />} />
              <Route path="financeiro" element={<Financial />} />
              <Route path="configuracoes" element={<Placeholder title="Configurações" />} />
              <Route path="atendimentos" element={<Atendimentos />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
