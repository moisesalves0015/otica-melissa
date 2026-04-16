import * as React from "react";
import { motion } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Wrench,
  Truck,
  XCircle,
  FileText,
  Printer,
  ChevronRight,
  Eye,
  Zap,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { MOCK_ORDERS } from "../../data/mockData";

const statusIcons: Record<string, any> = {
  "Pendente": Clock,
  "Em Produção": Wrench,
  "Qualidade": Eye,
  "Pronto para Entrega": CheckCircle2,
  "Entregue": Truck,
  "Cancelado": XCircle,
};

const statusColors: Record<string, string> = {
  "Pendente": "bg-slate-100 text-slate-600",
  "Em Produção": "bg-amber-100 text-amber-700",
  "Qualidade": "bg-blue-100 text-blue-700",
  "Pronto para Entrega": "bg-emerald-100 text-emerald-700",
  "Entregue": "bg-emerald-600 text-white",
  "Cancelado": "bg-red-100 text-red-700",
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredOrders = MOCK_ORDERS.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.includes(searchTerm)
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Pedidos & Vendas</h1>
          <p className="text-slate-500">Gerencie o fluxo completo, desde a venda rápida até a entrega final.</p>
        </div>

        <div className="flex gap-4">
            <Button variant="outline" className="rounded-full px-6 font-bold h-12 border-primary text-primary hover:bg-primary/5 flex items-center gap-2">
                <Zap className="h-5 w-5" /> VENDA RÁPIDA
            </Button>
            <Button className="rounded-full px-6 font-bold h-12 shadow-lg shadow-primary/20 flex items-center gap-2">
                <Plus className="h-5 w-5" /> NOVO PEDIDO
            </Button>
        </div>
      </div>

      {/* Workflow Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {["Pendente", "Em Produção", "Montagem", "Qualidade", "Pronto", "Entregue"].map((status, i) => (
            <Card key={status} className="border-none shadow-sm bg-white overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${i === 0 ? 'bg-slate-400' : i === 4 ? 'bg-emerald-500' : 'bg-primary'}`} />
                <CardContent className="p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{status}</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{Math.floor(Math.random() * 10)}</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 group">
             <Input
                placeholder="Buscar por cliente ou Nº do pedido..."
                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <div className="flex gap-2">
             <Select defaultValue="todos">
                <SelectTrigger className="w-[180px] h-12 rounded-2xl border-slate-200 font-bold text-slate-600">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl font-bold">
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="producao">Em Produção</SelectItem>
                    <SelectItem value="entrega">Pronto para Entrega</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200 text-slate-600">
                <Printer className="h-4 w-4 mr-2" /> IMPRIMIR LISTA
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Pedido</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente / Data</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Itens / Detalhes</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Valor Total</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Forma Pagto</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                return (
                  <TableRow key={order.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                    <TableCell className="px-8 py-4">
                      <span className="font-black text-sm text-primary">#{order.id}</span>
                    </TableCell>
                    <TableCell className="px-8 py-4">
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{order.clientName}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{order.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">
                      {order.items}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right font-black text-slate-900 text-sm">
                      R$ {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-center">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-slate-200">
                          {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge className={`${statusColors[order.status]} text-[9px] font-black uppercase tracking-widest border-none rounded-full px-3`}>
                            <StatusIcon className="h-2.5 w-2.5 mr-1" /> {order.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                              <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400">
                              <Printer className="h-4 w-4" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Production Workflow visualization */}
      <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Acompanhamento de Produção</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card className="border-none shadow-sm bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Wrench className="h-5 w-5" />
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 font-black">4 PEDIDOS</Badge>
                </div>
                <h3 className="font-bold text-slate-900">Na Produção</h3>
                <p className="text-xs text-slate-500 mt-1">Lentes sendo fabricadas em laboratório externo.</p>
                <Button variant="link" className="p-0 h-auto mt-4 text-xs font-bold text-primary">Ver todos <ChevronRight className="h-3 w-3 inline" /></Button>
           </Card>

           <Card className="border-none shadow-sm bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 font-black">2 PEDIDOS</Badge>
                </div>
                <h3 className="font-bold text-slate-900">Montagem Local</h3>
                <p className="text-xs text-slate-500 mt-1">Lentes recebidas, aguardando montagem na armação.</p>
                <Button variant="link" className="p-0 h-auto mt-4 text-xs font-bold text-primary">Acompanhar <ChevronRight className="h-3 w-3 inline" /></Button>
           </Card>

           <Card className="border-none shadow-sm bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 font-black">7 PRONTOS</Badge>
                </div>
                <h3 className="font-bold text-slate-900">Prontos p/ Entrega</h3>
                <p className="text-xs text-slate-500 mt-1">Controle de qualidade realizado. Avisar clientes.</p>
                <Button variant="link" className="p-0 h-auto mt-4 text-xs font-bold text-primary text-emerald-600">Enviar Alertas <Zap className="h-3 w-3 inline ml-1" /></Button>
           </Card>

           <Card className="border-none shadow-sm bg-primary p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6" />
                    </div>
                </div>
                <h3 className="font-black text-lg">Nova Venda</h3>
                <p className="text-xs text-white/70 mt-1 italic font-bold">Inicie agora o processo completo de venda e medição.</p>
                <Button className="w-full mt-4 bg-white text-primary font-black hover:bg-white/90 rounded-xl">ABRIR PDV</Button>
           </Card>
       </div>
    </div>
  );
}
