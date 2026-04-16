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
    <div className="min-h-screen bg-[#F8F9FC] flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-[#0F172A] text-slate-300 transition-all duration-300 flex flex-col fixed inset-y-0 z-50`}
      >
        <div className="p-6 flex items-center justify-center border-b border-slate-800/50">
          <img 
            src="/logo.png" 
            alt="Ótica Melissa" 
            className={`${isSidebarOpen ? "h-14" : "h-8"} w-auto object-contain transition-all duration-300`}
          />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-hide">
          {sidebarLinks.map((group) => (
            <div key={group.group} className="space-y-2">
              {isSidebarOpen && (
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 px-2 uppercase">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "hover:bg-slate-800 hover:text-white"
                      } ${item.highlight ? "text-amber-400 font-bold" : ""}`}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "group-hover:text-white"}`} />
                      {isSidebarOpen && (
                        <span className="text-sm font-medium">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800 px-3"
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}
      >
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-500"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative group hidden md:block">
              <Input
                type="search"
                placeholder="Pesquisar..."
                className="w-64 pl-10 h-10 bg-slate-100 border-none rounded-full text-sm focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative group hover:bg-slate-100 rounded-full h-10 w-10">
              <Bell className="h-5 w-5 text-slate-500 group-hover:text-primary transition-colors" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <div className="flex items-center gap-3 ml-2 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-none">Admin</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-black">Ótica Melissa</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
