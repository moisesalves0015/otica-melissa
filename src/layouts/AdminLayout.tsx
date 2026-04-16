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

const sidebarLinks = [
  {
    group: "PRINCIPAL",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
      { name: "Venda Rápida", icon: Zap, path: "/admin/venda-rapida", highlight: true },
    ],
  },
  {
    group: "CLIENTES",
    items: [
      { name: "Lista de Clientes", icon: Users, path: "/admin/clientes" },
    ],
  },
  {
    group: "PRODUTOS",
    items: [
      { name: "Estoque", icon: Package, path: "/admin/produtos" },
    ],
  },
  {
    group: "OPERACIONAL",
    items: [
      { name: "Pedidos", icon: ShoppingCart, path: "/admin/pedidos" },
    ],
  },
  {
    group: "FINANCEIRO",
    items: [
      { name: "Gestão Financeira", icon: DollarSign, path: "/admin/financeiro" },
    ],
  },
  {
    group: "SISTEMA",
    items: [
      { name: "Configurações", icon: Settings, path: "/admin/configuracoes" },
    ],
  },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-60" : "w-16"
        } bg-slate-900 text-slate-400 transition-all duration-300 flex flex-col fixed inset-y-0 z-50 border-r border-slate-800`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
               <img src="/logo.png" alt="" className="h-6 w-auto" />
            </div>
            {isSidebarOpen && (
              <span className="text-sm font-bold text-white uppercase tracking-tight">Melissa Admin</span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          {sidebarLinks.map((group) => (
            <div key={group.group} className="space-y-1">
              {isSidebarOpen && (
                <p className="text-[10px] font-semibold tracking-wider text-slate-500 px-3 mb-2">
                  {group.group}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded transition-colors group ${
                        isActive
                          ? "bg-slate-800 text-white"
                          : "hover:bg-slate-800/50 hover:text-slate-200"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "group-hover:text-slate-200"}`} />
                      {isSidebarOpen && (
                        <span className="text-[13px] font-medium">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-slate-500 hover:text-white hover:bg-slate-800 px-3 h-10"
          >
            <LogOut className="h-4 w-4" />
            {isSidebarOpen && <span className="text-[13px] font-medium">Sair do Sistema</span>}
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
