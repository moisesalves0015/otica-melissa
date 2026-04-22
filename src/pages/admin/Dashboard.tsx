import * as React from "react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Gift,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

// ---------- helpers ----------
const todayBR = () => new Date().toLocaleDateString("pt-BR"); // DD/MM/YYYY

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  // Se for YYYY-MM-DD (do input date), converter para DD/MM/YYYY
  if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

const isToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return normalizeDate(dateStr) === todayBR();
};

const isBirthdayToday = (birthDate: string): boolean => {
  if (!birthDate) return false;
  // birthDate pode ser DD/MM/YYYY ou YYYY-MM-DD
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

const isOverdue = (dueDate: string): boolean => {
  if (!dueDate) return false;
  let d: Date;
  if (dueDate.includes("/")) {
    const [day, month, year] = dueDate.split("/").map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(dueDate);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d <= today; // Inclui hoje nos alertas de vencimento
};

const timeAgo = (isoDate: string): string => {
  if (!isoDate) return "";
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Há ${minutes} min`;
  if (hours < 24) return `Há ${hours} hora${hours > 1 ? "s" : ""}`;
  return "Hoje";
};

// ---------- component ----------
export default function Dashboard() {
  const [stats, setStats] = React.useState({
    vendasDia: 0,
    vendasMes: 0,
    ticketMedio: 0,
    novosClientes: 0,
    receitas: 0,
    despesas: 0,
  });

  const [salesChartData, setSalesChartData] = React.useState<any[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = React.useState<any[]>([]);
  const [topProducts, setTopProducts] = React.useState<any[]>([]);
  const [systemEvents, setSystemEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    // ---- ORDERS ----
    const unsubOrders = onSnapshot(query(collection(db, "orders")), (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];

      const totalVendasMes = orders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
      const vendasDia = orders
        .filter((o) => isToday(o.date))
        .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
      const ticketMedio = orders.length > 0 ? totalVendasMes / orders.length : 0;
      setStats((s) => ({ ...s, vendasDia, vendasMes: totalVendasMes, ticketMedio }));

      // Sales Chart — últimos 7 dias
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString("pt-BR");
      }).reverse();

      const chartData = last7Days.map((date) => {
        const dayTotal = orders
          .filter((o) => o.date === date)
          .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        return {
          day: date.split("/")[0] + "/" + date.split("/")[1],
          sales: dayTotal,
        };
      });
      setSalesChartData(chartData);

      // Payment methods pie
      const methods: Record<string, number> = {};
      orders.forEach((o) => {
        const m = o.paymentMethod || "Outros";
        methods[m] = (methods[m] || 0) + 1;
      });
      const pieData = Object.entries(methods).map(([name, value]) => ({
        name: name.replace("_", " ").toUpperCase(),
        value,
      }));
      setPaymentMethodsData(pieData);

      // Top products — agrupados por serviceType + usa categoria real se existir
      const products: Record<string, { count: number; revenue: number; category: string }> = {};
      orders.forEach((o) => {
        const name = o.serviceType || "Diversos";
        const cat = o.category || o.serviceType || "Serviço";
        if (!products[name]) products[name] = { count: 0, revenue: 0, category: cat };
        products[name].count += 1;
        products[name].revenue += Number(o.total) || 0;
      });
      const topData = Object.entries(products)
        .map(([name, data]) => ({
          name,
          category: data.category,
          sales: data.count,
          revenue: `R$ ${data.revenue.toFixed(2)}`,
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
      setTopProducts(topData);

      // Eventos: Pedido Pronto
      const readyOrders = orders
        .filter((o) => o.status === "Pronto para Entrega")
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map((o) => ({
          id: `ready-${o.id}`,
          type: "pedido",
          title: "Pedido Pronto",
          text: `Venda #${o.id.substring(0, 8).toUpperCase()} pronta para entrega`,
          time: timeAgo(o.createdAt),
        }));

      setSystemEvents((prev) => {
        const others = prev.filter((e) => !e.id.startsWith("ready-"));
        return [...others, ...readyOrders].slice(0, 6);
      });
    });

    // ---- CLIENTS ----
    const unsubClients = onSnapshot(query(collection(db, "clients")), (snapshot) => {
      const clients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
      setStats((s) => ({ ...s, novosClientes: clients.length }));

      // Aniversariantes de hoje
      const birthdays = clients
        .filter((c) => isBirthdayToday(c.birthDate || c.dataNascimento || ""))
        .map((c) => ({
          id: `bday-${c.id}`,
          type: "aniversario",
          title: "Aniversariante",
          text: `${c.name} faz aniversário hoje! 🎂`,
          time: "Hoje",
        }));

      setSystemEvents((prev) => {
        const others = prev.filter((e) => !e.id.startsWith("bday-"));
        return [...others, ...birthdays].slice(0, 6);
      });
    });

    // ---- FINANCIAL ----
    const unsubFin = onSnapshot(query(collection(db, "financial_transactions")), (snapshot) => {
      const transactions = snapshot.docs.map((doc) => doc.data());
      const receitas = transactions
        .filter((t) => t.type === "Entrada")
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const despesas = transactions
        .filter((t) => t.type === "Saída")
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const receitasDia = transactions
        .filter(t => t.type === 'Entrada' && isToday(t.date))
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setStats((s) => ({ ...s, receitas, despesas }));
    });

    // ---- INSTALLMENTS (Carnê Vencido) ----
    const unsubInstallments = onSnapshot(
      query(collection(db, "installments"), where("status", "==", "Pendente")),
      (snapshot) => {
        const installments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
        const overdue = installments
          .filter((inst) => isOverdue(inst.dueDate))
          .sort((a: any, b: any) => {
            // ordenar pela data mais antiga
            const toDate = (s: string) => {
              if (!s) return 0;
              if (s.includes("/")) {
                const [d, m, y] = s.split("/").map(Number);
                return new Date(y, m - 1, d).getTime();
              }
              return new Date(s).getTime();
            };
            return toDate(a.dueDate) - toDate(b.dueDate);
          })
          .slice(0, 3)
          .map((inst) => ({
            id: `carne-${inst.id}`,
            type: "vencimento",
            title: "Carnê Vencido",
            text: `${inst.clientName} — Parcela ${inst.number}/${inst.totalInstallments} · Venc: ${inst.dueDate}`,
            time: "Vencido",
          }));

        setSystemEvents((prev) => {
          const others = prev.filter((e) => !e.id.startsWith("carne-"));
          return [...others, ...overdue].slice(0, 6);
        });
      }
    );

    return () => {
      unsubOrders();
      unsubClients();
      unsubFin();
      unsubInstallments();
    };
  }, []);

  interface StatItem {
    label: string;
    value: string;
    color?: string;
  }

  const DYNAMIC_STATS: StatItem[] = [
    { label: "Vendas de Hoje", value: `R$ ${stats.vendasDia.toFixed(2)}` },
    { label: "Vendas Totais", value: `R$ ${stats.vendasMes.toFixed(2)}` },
    { label: "Ticket Médio", value: `R$ ${stats.ticketMedio.toFixed(2)}` },
    { label: "Total de Clientes", value: stats.novosClientes.toString() },
    { label: "Total Receitas", value: `R$ ${stats.receitas.toFixed(2)}`, color: "text-emerald-600" },
    { label: "Total Despesas", value: `R$ ${stats.despesas.toFixed(2)}`, color: "text-red-600" },
  ];

  const PIE_COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

  // Ordenar eventos: vencimentos primeiro, depois aniversários, depois pedidos
  const eventOrder: Record<string, number> = { vencimento: 0, aniversario: 1, pedido: 2 };
  const sortedEvents = [...systemEvents].sort(
    (a, b) => (eventOrder[a.type] ?? 9) - (eventOrder[b.type] ?? 9)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Visão Geral</h1>
        <p className="text-xs text-slate-500">Resumo operacional da unidade Ótica Melissa - São Paulo.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {DYNAMIC_STATS.map((stat) => (
          <Card key={stat.label} className="rounded border-slate-200 shadow-none">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3
                className={`text-lg font-bold ${
                  stat.color === "text-red-600"
                    ? "text-red-600"
                    : stat.color === "text-emerald-600"
                    ? "text-emerald-600"
                    : "text-slate-900"
                }`}
              >
                {stat.value}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-8 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fluxo de Vendas Mensal
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500">
              Últimos 7 dias
            </Badge>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData.length > 0 ? salesChartData : [{ day: "...", sales: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "4px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "none",
                    fontSize: "12px",
                  }}
                  formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Vendas"]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#0f172a", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#0f172a" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-4 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Distribuição Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center h-[300px]">
            {paymentMethodsData.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum dado disponível.</p>
            ) : (
              <>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentMethodsData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                  {paymentMethodsData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-[10px] font-medium text-slate-600 truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products */}
        <Card className="lg:col-span-7 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ranking de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">Nenhuma venda registrada.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Produto</th>
                    <th className="px-6 py-3 font-semibold">Categoria</th>
                    <th className="px-6 py-3 text-center font-semibold">Volume</th>
                    <th className="px-6 py-3 text-right font-semibold">Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {topProducts.map((product) => (
                    <tr key={product.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-900">{product.name}</td>
                      <td className="px-6 py-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 rounded">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center text-slate-600">{product.sales}</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-900">{product.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* System Events */}
        <Card className="lg:col-span-5 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Eventos do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                <p className="text-sm font-medium">Tudo em dia! Nenhum evento pendente.</p>
              </div>
            ) : (
              sortedEvents.map((alert) => (
                <div key={alert.id} className="flex gap-3">
                  <div
                    className={`h-9 w-9 rounded border flex items-center justify-center shrink-0 ${
                      alert.type === "vencimento"
                        ? "bg-red-50 border-red-100 text-red-600"
                        : alert.type === "aniversario"
                        ? "bg-amber-50 border-amber-100 text-amber-600"
                        : "bg-slate-900 text-white border-slate-900"
                    }`}
                  >
                    {alert.type === "vencimento" && <CreditCard className="h-4 w-4" />}
                    {alert.type === "aniversario" && <Gift className="h-4 w-4" />}
                    {alert.type === "pedido" && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[13px] font-semibold text-slate-900 truncate">{alert.title}</h4>
                      <span
                        className={`text-[10px] font-medium whitespace-nowrap ml-2 ${
                          alert.type === "vencimento" ? "text-red-500" : "text-slate-400"
                        }`}
                      >
                        {alert.time}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{alert.text}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
