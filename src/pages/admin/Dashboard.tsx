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
} from "lucide-react";
import {
  RECENT_ALERTS,
} from "../../data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../lib/firebase";

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

  React.useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, "orders")), (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());
      
      // Basic Stats
      const totalVendasMes = orders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
      const todayStr = new Date().toLocaleDateString('pt-BR');
      const vendasDia = orders.filter(o => o.date === todayStr).reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
      const ticketMedio = orders.length > 0 ? totalVendasMes / orders.length : 0;
      setStats(s => ({ ...s, vendasDia, vendasMes: totalVendasMes, ticketMedio }));

      // Process Sales Chart Data (Last 7 days for better visualization)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('pt-BR');
      }).reverse();

      const chartData = last7Days.map(date => {
        const dayTotal = orders
          .filter(o => o.date === date)
          .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        return { day: date.split('/')[0] + '/' + date.split('/')[1], sales: dayTotal };
      });
      setSalesChartData(chartData);

      // Process Payment Methods Data
      const methods: Record<string, number> = {};
      orders.forEach(o => {
        const m = o.paymentMethod || "Outros";
        methods[m] = (methods[m] || 0) + 1;
      });
      const pieData = Object.entries(methods).map(([name, value]) => ({ 
        name: name.replace('_', ' ').toUpperCase(), 
        value 
      }));
      setPaymentMethodsData(pieData);

      // Process Top Products
      const products: Record<string, { count: number, revenue: number, category: string }> = {};
      orders.forEach(o => {
        const name = o.serviceType || "Diversos";
        if (!products[name]) products[name] = { count: 0, revenue: 0, category: "Serviço" };
        products[name].count += 1;
        products[name].revenue += (Number(o.total) || 0);
      });
      const topData = Object.entries(products)
        .map(([name, data]) => ({
          name,
          category: data.category,
          sales: data.count,
          revenue: `R$ ${data.revenue.toFixed(2)}`
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
      setTopProducts(topData);
    });

    const unsubClients = onSnapshot(query(collection(db, "clients")), (snapshot) => {
      setStats(s => ({ ...s, novosClientes: snapshot.size }));
    });

    const unsubFin = onSnapshot(query(collection(db, "financial_transactions")), (snapshot) => {
      const trans = snapshot.docs.map(doc => doc.data());
      const receitas = trans.filter(t => t.type === 'Entrada').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const despesas = trans.filter(t => t.type === 'Saída').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setStats(s => ({ ...s, receitas, despesas }));
    });

    return () => {
      unsubOrders();
      unsubClients();
      unsubFin();
    };
  }, []);

  interface StatItem {
    label: string;
    value: string;
    trend?: "up" | "down";
    color?: string;
    change?: string;
    urgent?: boolean;
  }

  const DYNAMIC_STATS: StatItem[] = [
    { label: "Vendas de Hoje", value: `R$ ${stats.vendasDia.toFixed(2)}`, trend: "up" },
    { label: "Vendas Totais", value: `R$ ${stats.vendasMes.toFixed(2)}`, trend: "up" },
    { label: "Ticket Médio", value: `R$ ${stats.ticketMedio.toFixed(2)}`, trend: "up" },
    { label: "Total de Clientes", value: stats.novosClientes.toString(), trend: "up" },
    { label: "Total Receitas", value: `R$ ${stats.receitas.toFixed(2)}`, color: "text-emerald-600" },
    { label: "Total Despesas", value: `R$ ${stats.despesas.toFixed(2)}`, color: "text-red-600" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Visão Geral</h1>
        <p className="text-xs text-slate-500">Resumo operacional da unidade Ótica Melissa - São Paulo.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {DYNAMIC_STATS.map((stat, i) => (
          <div key={stat.label}>
            <Card className="rounded border-slate-200 shadow-none">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-slate-500 mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className={`text-lg font-bold ${stat.color && stat.color.includes('red') ? "text-red-600" : "text-slate-900"}`}>
                        {stat.value}
                    </h3>
                </div>
                {stat.change && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[10px] font-medium ${stat.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">vs ontem</span>
                  </div>
                )}
                {stat.urgent && (
                  <div className="flex items-center gap-1 mt-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-[10px] font-semibold uppercase">Reposição Crítica</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Sales Chart */}
        <Card className="lg:col-span-8 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fluxo de Vendas Mensal</CardTitle>
            <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500">Últimos 30 dias</Badge>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData.length > 0 ? salesChartData : [{day: '...', sales: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                    contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '12px'}}
                />
                <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#0f172a" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#0f172a', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#0f172a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Chart */}
        <Card className="lg:col-span-4 rounded border-slate-200 shadow-none">
            <CardHeader className="px-6 py-4 border-b border-slate-100 italic">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Distribuição Financeira</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center h-[300px]">
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={paymentMethodsData.length > 0 ? paymentMethodsData : [{name: 'Sem dados', value: 1}]}
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {(paymentMethodsData.length > 0 ? paymentMethodsData : [{name: '...', value: 1}]).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0f172a' : index === 1 ? '#334155' : index === 2 ? '#64748b' : '#94a3b8'} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                    {paymentMethodsData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{backgroundColor: index === 0 ? '#0f172a' : index === 1 ? '#334155' : index === 2 ? '#64748b' : '#94a3b8'}} />
                            <span className="text-[10px] font-medium text-slate-600 truncate">{item.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products */}
        <Card className="lg:col-span-7 rounded border-slate-200 shadow-none">
            <CardHeader className="px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ranking de Produtos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
            </CardContent>
        </Card>

        {/* Alerts and Reminders */}
        <Card className="lg:col-span-5 rounded border-slate-200 shadow-none">
            <CardHeader className="px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Eventos do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
                {RECENT_ALERTS.map((alert) => (
                    <div key={alert.id} className="flex gap-3">
                        <div className={`h-9 w-9 rounded border flex items-center justify-center shrink-0 ${
                            alert.type === 'vencimento' ? 'bg-red-50 border-red-100 text-red-600' :
                            alert.type === 'aniversario' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 text-white'
                        }`}>
                            {alert.type === 'vencimento' && <Clock className="h-4 w-4" />}
                            {alert.type === 'aniversario' && <Users className="h-4 w-4" />}
                            {alert.type === 'pedido' && <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="text-[13px] font-semibold text-slate-900 truncate">{alert.title}</h4>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{alert.time}</span>
                            </div>
                            <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">{alert.text}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
