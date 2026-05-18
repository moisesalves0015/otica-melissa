import * as React from "react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  Clock,
  CheckCircle2,
  Package,
  Gift,
  Activity,
  TrendingUp,
  UserPlus,
  Zap,
  AlertCircle,
  Calendar,
  BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ---------- helpers ----------
const todayBR = () => new Date().toLocaleDateString("pt-BR");

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const norm = normalizeDate(dateStr);
  if (norm.includes("/")) {
    const [d, m, y] = norm.split("/").map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const isToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return normalizeDate(dateStr) === todayBR();
};

const isBirthdayToday = (birthDate: string): boolean => {
  if (!birthDate) return false;
  let day = "", month = "";
  if (birthDate.includes("/")) {
    [day, month] = birthDate.split("/");
  } else if (birthDate.includes("-")) {
    const parts = birthDate.split("-");
    day = parts[2];
    month = parts[1];
  }
  const today = new Date();
  return (
    parseInt(day) === today.getDate() &&
    parseInt(month) === today.getMonth() + 1
  );
};

const timeAgo = (isoDate: string): string => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `Há ${minutes} min`;
  if (hours < 24) return `Há ${hours}h`;
  
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const hr = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} às ${hr}:${min}`;
};

type PeriodKey = "hoje" | "ontem" | "semana" | "mes" | "mes-anterior" | "trimestre" | "ano" | "personalizado" | "30-dias";

const isInPeriod = (
  dateStr: string, 
  period: PeriodKey, 
  customStartDate?: string, 
  customEndDate?: string
): boolean => {
  const date = parseDate(dateStr);
  if (!date) return false;
  
  let start = new Date();
  let end = new Date();
  
  if (period === 'hoje') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'ontem') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'semana') {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'mes') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === '30-dias') {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'mes-anterior') {
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() - 1 + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'trimestre') {
    start.setMonth(start.getMonth() - 2);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'ano') {
    start.setMonth(0);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'personalizado') {
    if (!customStartDate && !customEndDate) return true;
    if (customStartDate) {
      const [y, m, d] = customStartDate.split("-").map(Number);
      start = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
      start = new Date(1970, 0, 1);
    }
    if (customEndDate) {
      const [y, m, d] = customEndDate.split("-").map(Number);
      end = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      end = new Date(2100, 11, 31);
    }
  }
  
  return date >= start && date <= end;
};

// ---------- component ----------
export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = React.useState<PeriodKey>("30-dias");
  const [customStartDate, setCustomStartDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = React.useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [installments, setInstallments] = React.useState<any[]>([]);
  const [activeEvent, setActiveEvent] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubAtend = onSnapshot(query(collection(db, "atendimentos")), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAtendimentos(data);
      setLoading(false);
    });

    const unsubClients = onSnapshot(query(collection(db, "clients")), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setClients(data);
    });

    const unsubOrders = onSnapshot(query(collection(db, "orders")), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setOrders(data);
    });

    const unsubInst = onSnapshot(query(collection(db, "installments")), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInstallments(data);
    });

    return () => {
      unsubAtend();
      unsubClients();
      unsubOrders();
      unsubInst();
    };
  }, []);

  // ---- Computed KPIs ----
  const periodAtendimentos = React.useMemo(
    () => atendimentos.filter(a => isInPeriod(a.date || "", period, customStartDate, customEndDate)),
    [atendimentos, period, customStartDate, customEndDate]
  );

  const totalAtendimentos = periodAtendimentos.length;
  const receitaOperacional = periodAtendimentos.reduce((acc, a) => acc + (Number(a.totalValue) || 0), 0);
  const ticketMedio = totalAtendimentos > 0 ? receitaOperacional / totalAtendimentos : 0;
  const atendimentosCarne = periodAtendimentos.filter(a => a.isCarne).length;

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  const novosClientesMes = clients.filter(c => {
    const d = parseDate(c.createdAt || c.date || "");
    return d && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).length;

  // ---- Gráfico: Atendimentos por dia ----
  const dailyChartData = React.useMemo(() => {
    let start = new Date();
    let end = new Date();
    
    if (period === 'hoje') {
      start.setHours(0,0,0,0);
    } else if (period === 'ontem') {
      start.setDate(start.getDate() - 1);
      start.setHours(0,0,0,0);
      end.setDate(end.getDate() - 1);
      end.setHours(23,59,59,999);
    } else if (period === 'semana') {
      start.setDate(start.getDate() - 6);
      start.setHours(0,0,0,0);
    } else if (period === 'mes') {
      start.setDate(1);
      start.setHours(0,0,0,0);
    } else if (period === 'mes-anterior') {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0,0,0,0);
      end.setMonth(end.getMonth() - 1 + 1);
      end.setDate(0);
      end.setHours(23,59,59,999);
    } else if (period === 'trimestre') {
      start.setMonth(start.getMonth() - 2);
      start.setDate(1);
      start.setHours(0,0,0,0);
    } else if (period === 'ano') {
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0,0,0,0);
    } else if (period === 'personalizado') {
      if (customStartDate) {
        const [y, m, d] = customStartDate.split("-").map(Number);
        start = new Date(y, m - 1, d, 0, 0, 0, 0);
      } else {
        start.setDate(start.getDate() - 29);
      }
      if (customEndDate) {
        const [y, m, d] = customEndDate.split("-").map(Number);
        end = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    }
    
    const days: string[] = [];
    const current = new Date(start);
    let safety = 0;
    while (current <= end && safety < 366) {
      days.push(current.toLocaleDateString("pt-BR"));
      current.setDate(current.getDate() + 1);
      safety++;
    }
    
    return days.map(date => {
      const parts = date.split("/");
      return {
        day: `${parts[0]}/${parts[1]}`,
        atendimentos: atendimentos.filter(a => normalizeDate(a.date || "") === date).length,
      };
    });
  }, [atendimentos, period, customStartDate, customEndDate]);

  // ---- Gráfico: Horários de Pico ----
  const peakHoursData = React.useMemo(() => {
    const hours: Record<string, number> = {};
    for (let h = 8; h <= 18; h++) {
      hours[`${String(h).padStart(2, "0")}h`] = 0;
    }
    periodAtendimentos.forEach(a => {
      if (a.time) {
        const hour = a.time.split(":")[0];
        const key = `${hour}h`;
        if (hours[key] !== undefined) hours[key]++;
      }
    });
    return Object.entries(hours).map(([hour, count]) => ({ hour, count }));
  }, [periodAtendimentos]);

  // ---- KPIs de Status de Pedidos ----
  const statusCounts = React.useMemo(() => ({
    pendente: orders.filter(o => o.status === "Pendente").length,
    producao: orders.filter(o => o.status === "Em Produção").length,
    qualidade: orders.filter(o => o.status === "Qualidade").length,
    pronto: orders.filter(o => o.status === "Pronto para Entrega").length,
    entregue: orders.filter(o => o.status === "Entregue").length,
    cancelado: orders.filter(o => o.status === "Cancelado").length,
  }), [orders]);

  // ---- Últimos Atendimentos ----
  const recentAtendimentos = periodAtendimentos.slice(0, 6);

  // ---- Computed systemEvents (Memoized) ----
  const sortedEvents = React.useMemo(() => {
    // 1. Birthdays
    const birthdays = clients
      .filter(c => isBirthdayToday(c.birthDate || c.dataNascimento || ""))
      .map(c => ({
        id: `bday-${c.id}`,
        type: "aniversario",
        title: "Aniversariante",
        text: `${c.name} faz aniversário hoje! 🎂`,
        time: "Hoje",
        rawTime: new Date().toISOString(),
        client: c,
      }));

    // 2. Ready Orders
    const readyOrders = orders
      .filter(o => o.status === "Pronto para Entrega")
      .map(o => ({
        id: `ready-${o.id}`,
        type: "pedido-pronto",
        title: "Pedido Pronto",
        text: `${o.clientName || 'Cliente'} — #${o.orderCode || o.id.substring(0, 8).toUpperCase()} pronto para retirada`,
        time: timeAgo(o.createdAt),
        rawTime: o.createdAt || "",
        order: o,
      }));

    // 3. Overdue Installments (Boleto Vencido / Inadimplência)
    const debtEvents = installments
      .filter(inst => {
        if (inst.status === 'Pago') return false;
        if (!inst.dueDate) return false;
        let due: Date | null = null;
        if (inst.dueDate.includes("/")) {
          const [d, m, y] = inst.dueDate.split("/").map(Number);
          due = new Date(y, m - 1, d);
        } else {
          due = new Date(inst.dueDate);
        }
        if (isNaN(due.getTime())) return false;
        due.setHours(23, 59, 59, 999);
        return due < new Date();
      })
      .map(inst => {
        const client = clients.find(c => c.id === inst.clientId);
        const clientName = client?.name || inst.clientName || "Cliente";
        return {
          id: `debt-${inst.id}`,
          type: "inadimplencia",
          title: "Boleto Vencido",
          text: `${clientName} tem parcela de R$ ${Number(inst.value).toFixed(2)} vencida em ${inst.dueDate}`,
          time: timeAgo(inst.createdAt || inst.date || ""),
          rawTime: inst.createdAt || inst.date || "",
          installment: inst,
          client: client,
        };
      });

    // Combined & Chronological Order
    const all = [...birthdays, ...readyOrders, ...debtEvents];
    all.sort((a, b) => new Date(b.rawTime || 0).getTime() - new Date(a.rawTime || 0).getTime());
    return all.slice(0, 8);
  }, [clients, orders, installments]);

  const periodLabel: Record<PeriodKey, string> = {
    hoje: "Hoje",
    ontem: "Ontem",
    semana: "Últimos 7 dias",
    mes: "Este mês",
    "mes-anterior": "Mês Anterior",
    trimestre: "Últimos 3 Meses",
    ano: "Este ano",
    personalizado: "Personalizado",
  };

  const CHART_COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8"];

  const kpis = [
    {
      label: "Atendimentos",
      value: totalAtendimentos,
      icon: Activity,
      color: "text-slate-900",
      bg: "bg-slate-50",
    },
    {
      label: "Receita Operacional",
      value: `R$ ${receitaOperacional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Ticket Médio",
      value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: BarChart2,
      color: "text-slate-700",
      bg: "bg-slate-50",
    },
    {
      label: "Total de Clientes",
      value: clients.length,
      icon: Users,
      color: "text-slate-900",
      bg: "bg-slate-50",
    },
    {
      label: "Novos Clientes (mês)",
      value: novosClientesMes,
      icon: UserPlus,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Atendimentos Carnê",
      value: atendimentosCarne,
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Painel Operacional</h1>
          <p className="text-xs text-slate-500">Visão de atendimento e operação — Ótica Melissa.</p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {period === 'personalizado' && (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-250">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
              />
              <span className="text-[10px] font-bold text-slate-400">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
              />
            </div>
          )}
          <Select value={period} onValueChange={(p: PeriodKey) => setPeriod(p)}>
            <SelectTrigger className="h-8 w-44 rounded border-slate-200 text-xs font-semibold uppercase tracking-wider bg-slate-50 text-slate-700">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent className="text-xs font-medium uppercase tracking-wider">
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="ontem">Ontem</SelectItem>
              <SelectItem value="semana">Últimos 7 Dias</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="30-dias">Últimos 30 Dias</SelectItem>
              <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
              <SelectItem value="trimestre">Últimos 3 Meses</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
              <SelectItem value="personalizado">Período Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="rounded border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <div className={`h-8 w-8 rounded flex items-center justify-center mb-3 ${kpi.bg}`}>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {kpi.label}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{kpi.value}</h3>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Atendimentos por Dia */}
        <Card className="lg:col-span-8 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Volume de Atendimentos
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-400">
              {periodLabel[period]}
            </Badge>
          </CardHeader>
          <CardContent className="px-5 py-4 h-[190px]">
            {dailyChartData.every(d => d.atendimentos === 0) ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                <Activity className="h-8 w-8" />
                <p className="text-xs font-medium">Nenhum atendimento no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }}
                    dy={5}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "4px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    formatter={(v: any) => [v, "Atendimentos"]}
                  />
                  <Bar dataKey="atendimentos" fill="#0f172a" radius={[3, 3, 0, 0]} barSize={dailyChartData.length > 15 ? 8 : 16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
 
        {/* Horários de Pico */}
        <Card className="lg:col-span-4 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Horários de Pico
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4 h-[190px]">
            {peakHoursData.every(h => h.count === 0) ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                <Clock className="h-8 w-8" />
                <p className="text-xs font-medium text-center">Sem dados de horário</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} allowDecimals={false} />
                  <YAxis dataKey="hour" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} width={28} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "4px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    formatter={(v: any) => [v, "Atend."]}
                  />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={8}>
                    {peakHoursData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.count > 0 ? "#0f172a" : "#f1f5f9"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status de Pedidos (Operacional) */}
        <Card className="lg:col-span-4 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status de Pedidos (Total)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {[
              { label: "Pendente", count: statusCounts.pendente, color: "bg-slate-200" },
              { label: "Em Produção", count: statusCounts.producao, color: "bg-amber-400" },
              { label: "Qualidade", count: statusCounts.qualidade, color: "bg-blue-400" },
              { label: "Pronto p/ Entrega", count: statusCounts.pronto, color: "bg-emerald-400" },
              { label: "Entregue", count: statusCounts.entregue, color: "bg-emerald-600" },
              { label: "Cancelado", count: statusCounts.cancelado, color: "bg-red-400" },
            ].map(item => {
              const total = (Object.values(statusCounts) as number[]).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round(((item.count as number) / total) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-slate-600">{item.label}</span>
                    <span className="text-[11px] font-bold text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Últimos Atendimentos */}
        <Card className="lg:col-span-5 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Últimos Atendimentos
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-400">
              {periodLabel[period]}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {recentAtendimentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-300">
                <Calendar className="h-8 w-8" />
                <p className="text-sm font-medium">Nenhum atendimento no período</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentAtendimentos.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{a.clientName}</p>
                      <p className="text-[11px] text-slate-400">
                        {a.attendant} · {a.date} {a.time && `às ${a.time}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-bold text-slate-900">
                        R$ {(Number(a.totalValue) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        a.isCarne ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {a.isCarne ? "Carnê" : a.paymentMethod?.toUpperCase() || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eventos do Sistema */}
        <Card className="lg:col-span-3 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
            {sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-300 gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                <p className="text-sm font-medium text-center">Tudo em dia!</p>
              </div>
            ) : (
              sortedEvents.map(event => (
                <div 
                  key={event.id} 
                  onClick={() => setActiveEvent(event)}
                  className="flex gap-3 p-2 rounded hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                >
                  <div
                    className={`h-8 w-8 rounded border flex items-center justify-center shrink-0 ${
                      event.type === "aniversario"
                        ? "bg-amber-50 border-amber-100 text-amber-600"
                        : event.type === "inadimplencia"
                        ? "bg-red-50 border-red-100 text-red-600"
                        : "bg-slate-900 text-white border-slate-900"
                    }`}
                  >
                    {event.type === "aniversario" ? (
                      <Gift className="h-3.5 w-3.5" />
                    ) : event.type === "inadimplencia" ? (
                      <AlertCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Package className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[12px] font-semibold text-slate-900 truncate">{event.title}</h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{event.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{event.text}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Action Dialog (Popup) */}
      <Dialog open={!!activeEvent} onOpenChange={(open) => !open && setActiveEvent(null)}>
        <DialogContent className="w-[90vw] sm:max-w-[450px] rounded-lg border-slate-200 p-0 overflow-hidden shadow-2xl bg-white animate-in zoom-in-95 duration-200">
          {activeEvent && (
            <>
              <DialogHeader className="bg-slate-900 p-5 text-white border-b border-slate-800 flex flex-row items-center gap-3">
                <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${
                  activeEvent.type === "aniversario"
                    ? "bg-amber-500/10 text-amber-400"
                    : activeEvent.type === "inadimplencia"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {activeEvent.type === "aniversario" ? (
                    <Gift className="h-4 w-4" />
                  ) : activeEvent.type === "inadimplencia" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                </div>
                <DialogTitle className="text-sm font-bold uppercase tracking-wider text-white">
                  {activeEvent.title}
                </DialogTitle>
              </DialogHeader>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                    {activeEvent.text}
                  </p>
                  {activeEvent.installment && (
                    <p className="text-[10px] font-bold text-red-500 mt-2">
                      Vencido em: {activeEvent.installment.dueDate} · Valor: R$ {Number(activeEvent.installment.value).toFixed(2)}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Selecione uma das ações abaixo para processar ou responder a este evento operacional.
                </p>
              </div>

              <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end !m-0 rounded-b-lg">
                <Button
                  variant="ghost"
                  onClick={() => setActiveEvent(null)}
                  className="rounded font-semibold text-[10px] tracking-wider uppercase h-8 px-3 text-slate-500"
                >
                  Fechar
                </Button>

                {activeEvent.type === "pedido-pronto" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveEvent(null);
                        navigate(`/admin/pedidos/${activeEvent.order?.id}`);
                      }}
                      className="rounded border-slate-200 font-semibold text-[10px] tracking-wider uppercase h-8 px-3 text-slate-700 hover:bg-slate-100"
                    >
                      Ver Pedido
                    </Button>
                    <Button
                      onClick={() => {
                        const name = activeEvent.order?.clientName || "Cliente";
                        const code = activeEvent.order?.orderCode || activeEvent.order?.id?.substring(0, 8).toUpperCase();
                        const phone = activeEvent.order?.clientPhone || activeEvent.order?.phone || "";
                        const msg = `Olá, ${name}! Temos ótimas notícias! O seu pedido da Ótica Melissa (Código: ${code}) já está pronto e disponível para retirada na nossa loja. Aguardamos sua visita! 😊`;
                        
                        const cleanPhone = phone.replace(/\D/g, "");
                        const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`, "_blank");
                        setActiveEvent(null);
                        toast.success("Mensagem de notificação enviada!");
                      }}
                      className="rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] tracking-wider uppercase h-8 px-4"
                    >
                      Enviar WhatsApp
                    </Button>
                  </>
                )}

                {activeEvent.type === "inadimplencia" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveEvent(null);
                        navigate(`/admin/clientes/${activeEvent.client?.id}`);
                      }}
                      className="rounded border-slate-200 font-semibold text-[10px] tracking-wider uppercase h-8 px-3 text-slate-700 hover:bg-slate-100"
                    >
                      Ver Cliente
                    </Button>
                    <Button
                      onClick={() => {
                        const name = activeEvent.client?.name || activeEvent.installment?.clientName || "Cliente";
                        const val = Number(activeEvent.installment?.value).toFixed(2);
                        const due = activeEvent.installment?.dueDate;
                        const phone = activeEvent.client?.phone || activeEvent.installment?.phone || "";
                        const msg = `Olá, ${name}! Passando para lembrar que a parcela no valor de R$ ${val} da Ótica Melissa venceu em ${due}. Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem. Deseja que eu envie a segunda via do boleto/chave Pix?`;
                        
                        const cleanPhone = phone.replace(/\D/g, "");
                        const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`, "_blank");
                        setActiveEvent(null);
                        toast.success("Mensagem de cobrança enviada!");
                      }}
                      className="rounded bg-red-600 hover:bg-red-500 text-white font-semibold text-[10px] tracking-wider uppercase h-8 px-4"
                    >
                      Cobrar via WhatsApp
                    </Button>
                  </>
                )}

                {activeEvent.type === "aniversario" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveEvent(null);
                        navigate(`/admin/clientes/${activeEvent.client?.id}`);
                      }}
                      className="rounded border-slate-200 font-semibold text-[10px] tracking-wider uppercase h-8 px-3 text-slate-700 hover:bg-slate-100"
                    >
                      Ver Cliente
                    </Button>
                    <Button
                      onClick={() => {
                        const name = activeEvent.client?.name || "Cliente";
                        const phone = activeEvent.client?.phone || "";
                        const msg = `Olá, ${name}! Nós da Ótica Melissa desejamos um feliz aniversário! Que seu dia seja repleto de alegria, saúde e realizações! Como presente, você tem um desconto especial exclusivo de 10% em sua próxima compra conosco! 🎂🎉`;
                        
                        const cleanPhone = phone.replace(/\D/g, "");
                        const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`, "_blank");
                        setActiveEvent(null);
                        toast.success("Mensagem de aniversário enviada!");
                      }}
                      className="rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[10px] tracking-wider uppercase h-8 px-4"
                    >
                      Enviar Parabéns
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
