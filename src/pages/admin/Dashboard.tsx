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
  DASHBOARD_STATS,
  SALES_CHART_DATA,
  PAYMENT_METHODS_DATA,
  TOP_PRODUCTS,
  RECENT_ALERTS,
} from "../../data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Dashboard</h1>
        <p className="text-slate-500">Bem-vinda, Mara. Aqui está o resumo operacional da sua ótica hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {DASHBOARD_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                <h3 className={`text-xl font-black tracking-tight ${stat.color || "text-slate-900"}`}>
                  {stat.value}
                </h3>
                {stat.change && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-[10px] font-bold ${stat.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                      {stat.change} em relação a ontem
                    </span>
                  </div>
                )}
                {stat.urgent && (
                  <div className="flex items-center gap-1 mt-2 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Reposição Crítica</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Sales Chart */}
        <Card className="lg:col-span-8 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Fluxo de Vendas (30 dias)</CardTitle>
            <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary italic uppercase">
                    <TrendingUp className="h-3 w-3" /> Meta Mensal: 85%
                </span>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SALES_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}}
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}}
                    tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700}}
                />
                <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#c4121a" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#c4121a', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, fill: '#c4121a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Chart */}
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center h-[350px]">
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={PAYMENT_METHODS_DATA}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={8}
                                dataKey="value"
                            >
                                {PAYMENT_METHODS_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                    {PAYMENT_METHODS_DATA.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}} />
                            <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{item.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Selling Products */}
        <Card className="lg:col-span-7 border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <table className="w-full text-left">
                    <thead className="bg-[#F8F9FC] text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4">Produto</th>
                            <th className="px-8 py-4">Categoria</th>
                            <th className="px-8 py-4 text-center">Vendas</th>
                            <th className="px-8 py-4 text-right">Faturamento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {TOP_PRODUCTS.map((product) => (
                            <tr key={product.name} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4 font-bold text-sm text-slate-900">{product.name}</td>
                                <td className="px-8 py-4">
                                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter rounded-full">
                                        {product.category}
                                    </Badge>
                                </td>
                                <td className="px-8 py-4 text-center font-bold text-slate-600">{product.sales}</td>
                                <td className="px-8 py-4 text-right font-black text-slate-900">{product.revenue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>

        {/* Alerts and Reminders */}
        <Card className="lg:col-span-5 border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Alertas e Notificações</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                {RECENT_ALERTS.map((alert) => (
                    <div key={alert.id} className="flex gap-4 group cursor-pointer">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            alert.type === 'vencimento' ? 'bg-red-50 text-red-600' :
                            alert.type === 'aniversario' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'
                        }`}>
                            {alert.type === 'vencimento' && <Clock className="h-6 w-6" />}
                            {alert.type === 'aniversario' && <Users className="h-6 w-6" />}
                            {alert.type === 'pedido' && <CheckCircle2 className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{alert.title}</h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{alert.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{alert.text}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
