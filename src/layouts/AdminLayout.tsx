import * as React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
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
  // No mobile (<lg), a sidebar começa fechada (drawer)
  // No desktop (>=lg), a sidebar começa expandida
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = React.useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  // Fecha o drawer mobile ao trocar de rota
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/50 shrink-0">
        <div className="flex items-center gap-3 w-full">
          {!collapsed ? (
            <div className="flex flex-col">
              <img
                src="/logo.png"
                alt="Melissa"
                className="h-7 w-auto object-contain brightness-0 invert"
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                Admin Panel
              </span>
            </div>
          ) : (
            <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center mx-auto">
              <img
                src="/logo.png"
                alt="M"
                className="h-5 w-auto object-contain brightness-0 invert"
              />
            </div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {sidebarLinks.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20 font-semibold"
                  : "hover:bg-white/5 hover:text-white text-slate-400"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <div className={`relative flex items-center justify-center shrink-0`}>
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                  }`}
                />
                {item.highlight && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse border-2 border-[#0f172a]" />
                )}
              </div>

              {!collapsed && (
                <span className="text-sm tracking-tight truncate">{item.name}</span>
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

      {/* Logout */}
      <div className="p-3 border-t border-slate-800/50 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => await logout()}
          title={collapsed ? "Sair" : undefined}
          className={`w-full gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-10 rounded-xl transition-all duration-200 ${
            collapsed ? "justify-center px-0" : "justify-start px-3"
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair do Sistema</span>}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 print:block overflow-x-hidden">
      
      {/* ============ MOBILE OVERLAY DRAWER ============ */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#0f172a] text-slate-400 flex flex-col z-50 shadow-2xl lg:hidden print:hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ============ DESKTOP SIDEBAR (hidden on mobile) ============ */}
      <aside
        className={`${
          isDesktopCollapsed ? "w-16" : "w-64"
        } bg-[#0f172a] text-slate-400 transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-30 border-r border-slate-800/50 shadow-xl hidden lg:flex print:hidden`}
      >
        <SidebarContent collapsed={isDesktopCollapsed} />
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <main
        className={`min-h-screen transition-all duration-300 flex flex-col ${
          isDesktopCollapsed ? "lg:ml-16" : "lg:ml-64"
        } print:ml-0`}
      >
        {/* ---- Header ---- */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 lg:px-6 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            {/* Mobile: hamburger abre drawer */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="text-slate-400 hover:text-slate-600 h-9 w-9 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Desktop: toggle collapse */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="text-slate-400 hover:text-slate-600 h-9 w-9 hidden lg:flex"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span className="hover:text-slate-600 cursor-pointer">Início</span>
              <ChevronRight size={12} />
              <span className="text-slate-900 font-medium capitalize">
                {location.pathname.split("/").filter(Boolean).pop() || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative hidden lg:block">
              <Input
                type="search"
                placeholder="Buscar no sistema..."
                className="w-48 xl:w-64 pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>

            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-400 hover:text-slate-600">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </Button>

            <Separator orientation="vertical" className="h-5 hidden sm:block" />

            <div className="flex items-center gap-2 lg:gap-3 cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-700 leading-none">Administrador</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-medium">Loja Matriz</p>
              </div>
              <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* ---- Page Content ---- */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 min-w-0 overflow-x-hidden print:p-0">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
