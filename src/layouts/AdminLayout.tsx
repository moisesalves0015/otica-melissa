import * as React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  LogOut,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../contexts/AuthContext";

const sidebarLinks = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { name: "Atendimentos", icon: Zap, path: "/admin/atendimentos", highlight: true },
  { name: "Lista de Clientes", icon: Users, path: "/admin/clientes" },
  { name: "Pedidos", icon: ShoppingCart, path: "/admin/pedidos" },
  { name: "Gestão Financeira", icon: DollarSign, path: "/admin/financeiro" },
  { name: "Configurações", icon: Settings, path: "/admin/configuracoes" },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-[#0f172a] text-slate-400 transition-all duration-300 flex flex-col fixed inset-y-0 z-50 border-r border-slate-800/50 shadow-xl`}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            {isSidebarOpen ? (
              <div className="flex flex-col">
                <img 
                  src="/logo.png" 
                  alt="Melissa" 
                  className="h-8 w-auto object-contain brightness-0 invert" 
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Admin Panel</span>
              </div>
            ) : (
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                <img 
                  src="/logo.png" 
                  alt="M" 
                  className="h-6 w-auto object-contain brightness-0 invert" 
                />
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className={`relative flex items-center justify-center ${isActive ? "" : "group-hover:scale-110 transition-transform"}`}>
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-primary"}`} />
                  {item.highlight && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse border-2 border-[#0f172a]" />
                  )}
                </div>
                
                {isSidebarOpen && (
                  <span className="text-sm tracking-tight">{item.name}</span>
                )}
                
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50 mt-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
            }}
            className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 px-4 h-12 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Sair do Sistema</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${isSidebarOpen ? "ml-60" : "ml-16"}`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-400 hover:text-slate-600 h-9 w-9"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                <span className="hover:text-slate-600 cursor-pointer">Início</span>
                <ChevronRight size={12} />
                <span className="text-slate-900 font-medium">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden lg:block mr-2">
              <Input
                type="search"
                placeholder="Buscar no sistema..."
                className="w-64 pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>

            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-400 hover:text-slate-600">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </Button>

            <Separator orientation="vertical" className="h-5" />
            
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-700 leading-none">Administrador</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">Loja Matriz</p>
              </div>
              <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 lg:p-10 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
