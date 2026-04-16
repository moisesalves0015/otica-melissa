import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Financial from "./pages/admin/Financial";

// Temporary placeholder for settings
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-3xl font-black tracking-tighter uppercase">{title}</h1>
    <p className="mt-4 text-slate-500">Esta página está em desenvolvimento como parte das configurações do sistema.</p>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="produtos" element={<Products />} />
          <Route path="pedidos" element={<Orders />} />
          <Route path="financeiro" element={<Financial />} />
          <Route path="configuracoes" element={<Placeholder title="Configurações" />} />
          <Route path="venda-rapida" element={<Placeholder title="Venda Rápida" />} />
        </Route>
      </Routes>
    </Router>
  );
}
