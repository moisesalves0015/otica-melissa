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
import OrderDetails from "./pages/admin/OrderDetails";
import AdminLogin from "./pages/admin/Login";
import Configuracoes from "./pages/admin/Configuracoes";
import ProtectedRoute from "./components/ProtectedRoute";
import Rastreio from "./pages/Rastreio";
import { AuthProvider } from "./contexts/AuthContext";


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
              <Route path="pedidos/:id" element={<OrderDetails />} />
              <Route path="financeiro" element={<Financial />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="atendimentos" element={<Atendimentos />} />
            </Route>
          </Route>
          <Route path="/rastreio" element={<Rastreio />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
