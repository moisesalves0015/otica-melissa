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
  ChevronDown,
  LogOut,
  Zap,
  Layout,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const sidebarLinks = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { name: "Atendimentos", icon: Zap, path: "/admin/atendimentos", highlight: true },
  { name: "Lista de Clientes", icon: Users, path: "/admin/clientes" },
  { name: "Pedidos", icon: ShoppingCart, path: "/admin/pedidos" },
  { name: "Gestão Financeira", icon: DollarSign, path: "/admin/financeiro" },
  { name: "Landing Page", icon: Layout, path: "/admin/landing-cms" },
  { name: "Agendamentos", icon: Calendar, path: "/admin/agendamentos" },
  { name: "Mensagens", icon: MessageSquare, path: "/admin/mensagens" },
  { name: "Configurações", icon: Settings, path: "/admin/configuracoes" },
];

export default function AdminLayout() {
  // No mobile (<lg), a sidebar começa fechada (drawer)
  // No desktop (>=lg), a sidebar começa expandida
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = React.useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const [atendentes, setAtendentes] = React.useState<any[]>([]);
  const [selectedAtendente, setSelectedAtendente] = React.useState("Administrador");
  const [dynamicBreadcrumb, setDynamicBreadcrumb] = React.useState("");

  React.useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "atendentes")), (snap) => {
      setAtendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length >= 3) {
      const collectionMap: Record<string, string> = {
        clientes: "clients",
        atendimentos: "atendimentos",
        pedidos: "orders",
        "landing-cms": "landing_products",
        agendamentos: "appointments"
      };
      const collectionName = collectionMap[parts[1]];
      const docId = parts[2];
      if (collectionName && docId) {
         getDoc(doc(db, collectionName, docId)).then(snap => {
           if (snap.exists()) {
              const data = snap.data();
              if (collectionName === "atendimentos") {
                 setDynamicBreadcrumb(`TSO #${data.tso || docId.slice(0, 8).toUpperCase()}`);
              } else if (collectionName === "orders") {
                 setDynamicBreadcrumb(`Pedido #${data.orderCode || data.tso || docId.slice(0, 6).toUpperCase()}`);
              } else {
                 setDynamicBreadcrumb(data.name || data.clientName || docId);
              }
           }
         }).catch(() => setDynamicBreadcrumb(""));
      } else {
        setDynamicBreadcrumb("");
      }
    } else {
      setDynamicBreadcrumb("");
    }
  }, [location.pathname]);

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
              <span className="hover:text-slate-600 cursor-pointer"><Link to="/admin">Início</Link></span>
              {(() => {
                const parts = location.pathname.split("/").filter(Boolean);
                if (parts.length === 1) {
                  return (
                    <>
                      <ChevronRight size={12} />
                      <span className="text-slate-900 font-medium capitalize">Dashboard</span>
                    </>
                  );
                }
                
                return parts.slice(1).map((part, idx) => {
                  const isLast = idx === parts.slice(1).length - 1;
                  let displayName = decodeURIComponent(part).replace(/-/g, ' ');
                  if (isLast && dynamicBreadcrumb) {
                    displayName = dynamicBreadcrumb;
                  }
                  
                  return (
                    <React.Fragment key={idx}>
                      <ChevronRight size={12} />
                      {isLast ? (
                        <span className="text-slate-900 font-medium capitalize">{displayName}</span>
                      ) : (
                        <Link to={`/admin/${part}`} className="hover:text-slate-600 capitalize">{displayName}</Link>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="text-right hidden sm:block">
                <div className="relative flex items-center justify-end group">
                  <select 
                    className="text-xs font-semibold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none text-right appearance-none py-0 pl-2 pr-4 m-0 z-10"
                    value={selectedAtendente}
                    onChange={(e) => setSelectedAtendente(e.target.value)}
                    style={{ textAlignLast: "right" }}
                  >
                    <option value="Administrador">Administrador</option>
                    {atendentes.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-medium">Administrador</p>
              </div>
              <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 uppercase">
                {selectedAtendente === "Administrador" ? "AD" : selectedAtendente.substring(0, 2)}
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
