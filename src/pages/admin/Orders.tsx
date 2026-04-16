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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Pedidos & Vendas</h1>
          <p className="text-xs text-slate-500">Gestão completa do fluxo operacional e entregas.</p>
        </div>

        <div className="flex gap-2">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" className="rounded border-slate-200 text-slate-700 font-semibold text-xs h-9 px-4 flex items-center gap-2" />}>
                  <Zap className="h-3.5 w-3.5" /> VENDA RÁPIDA
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-[960px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800">
                  <DialogTitle className="text-lg font-semibold flex items-center gap-3">
                    <Zap className="h-5 w-5 text-amber-400" /> Terminal de Venda Rápida
                  </DialogTitle>
                  <p className="text-slate-400 text-xs font-medium">Fluxo simplificado para vendas de pronta entrega.</p>
                </DialogHeader>
                <div className="max-h-[65vh] overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Localizar Cliente</Label>
                                <div className="relative group">
                                    <Input placeholder="Nome ou CPF do cliente..." className="rounded border-slate-200 h-9 text-sm pl-9" />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Adicionar Itens (SKU / Nome)</Label>
                                <div className="relative group">
                                    <Input placeholder="Buscar no estoque..." className="rounded border-slate-200 h-9 text-sm pl-9" />
                                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                </div>
                            </div>
                            <div className="border border-slate-100 rounded bg-slate-50/50 p-4 min-h-[120px] flex flex-col items-center justify-center">
                                <ShoppingCart className="h-6 w-6 text-slate-200 mb-2" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Carrinho Vazio</p>
                            </div>
                        </div>
                        <div className="space-y-4 bg-slate-50 p-6 rounded border border-slate-100">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">Resumo do Pagamento</h4>
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-semibold text-slate-900">R$ 0,00</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Descontos</span>
                                    <span className="font-semibold text-red-600">R$ 0,00</span>
                                </div>
                                <Separator className="bg-slate-200" />
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-900">Total</span>
                                    <span className="font-bold text-slate-900">R$ 0,00</span>
                                </div>
                            </div>
                            <div className="space-y-1.5 pt-4">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Forma de Pagamento</Label>
                                <Select>
                                    <SelectTrigger className="rounded border-slate-200 h-9 font-medium text-xs text-slate-600 bg-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded border-slate-200 shadow-2xl text-xs">
                                        <SelectItem value="pix">PIX (5% desc.)</SelectItem>
                                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                                        <SelectItem value="carne">Carnê Próprio</SelectItem>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button variant="ghost" className="rounded px-4 font-semibold text-slate-500 text-xs h-9">CANCELAR</Button>
                    <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold text-xs h-9 flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5" /> FINALIZAR VENDA
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger render={<Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2" />}>
                  <Plus className="h-4 w-4" /> NOVO PEDIDO
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-[720px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800">
                  <DialogTitle className="text-lg font-semibold flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5" /> Abertura de Ordem de Serviço
                  </DialogTitle>
                  <p className="text-slate-400 text-xs font-medium">Inicie um novo pedido com montagem e laboratório.</p>
                </DialogHeader>
                <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cliente Responsável</Label>
                                <Input placeholder="Buscar cliente..." className="rounded border-slate-200 h-9 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vendedor</Label>
                                <Input placeholder="Selecione o vendedor" className="rounded border-slate-200 h-9 text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Serviço</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Óculos Completo', 'Apenas Lentes', 'Apenas Armação'].map((opt) => (
                                    <Button key={opt} variant="outline" className="rounded border-slate-200 h-8 text-[10px] font-bold uppercase hover:bg-slate-50">{opt}</Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data Prometida de Entrega</Label>
                            <Input type="date" className="rounded border-slate-200 h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observações de Laboratório</Label>
                            <textarea className="w-full rounded border-slate-200 text-sm p-3 min-h-[80px] focus:outline-none focus:ring-0 focus:border-slate-400 font-medium" placeholder="Detalhes técnicos para montagem..."></textarea>
                        </div>
                    </div>
                </div>
                <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button variant="ghost" className="rounded px-4 font-semibold text-slate-500 text-xs h-9">SALVAR RASCUNHO</Button>
                    <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold text-xs h-9">CRIAR PEDIDO</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Workflow Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {["Pendente", "Em Produção", "Montagem", "Qualidade", "Pronto", "Entregue"].map((status, i) => (
            <Card key={status} className="rounded border-slate-200 shadow-none bg-white">
                <CardContent className="p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">{status}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900">{Math.floor(Math.random() * 10)}</span>
                        <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-slate-300' : i === 5 ? 'bg-emerald-500' : 'bg-slate-900'}`} />
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card className="rounded border-slate-200 shadow-none">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 group">
             <Input
                placeholder="Buscar por cliente ou Nº do pedido..."
                className="pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <div className="flex gap-2">
             <Select defaultValue="todos">
                <SelectTrigger className="w-[160px] h-9 rounded border-slate-200 font-medium text-xs text-slate-600">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded border-slate-200 shadow-xl text-xs">
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="producao">Em Produção</SelectItem>
                    <SelectItem value="entrega">Pronto para Entrega</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" className="rounded h-9 px-4 font-semibold text-xs border-slate-200 text-slate-600">
                <Printer className="h-3.5 w-3.5 mr-2" /> IMPRIMIR
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pedido</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cliente / Data</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Itens</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Valor Total</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Pagto</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Status</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                return (
                  <TableRow key={order.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors text-[13px]">
                    <TableCell className="px-6 py-3">
                      <span className="font-semibold text-slate-900">#{order.id}</span>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{order.clientName}</span>
                          <span className="text-[11px] text-slate-400">{order.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-slate-500 max-w-[200px] truncate">
                      {order.items}
                    </TableCell>
                    <TableCell className="px-6 py-3 text-right font-semibold text-slate-900">
                      R$ {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600">
                          {order.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                        <Badge className={`rounded ${statusColors[order.status]} text-[10px] font-semibold uppercase tracking-wider shadow-none border-none px-2 py-0.5 inline-flex items-center gap-1`}>
                            <StatusIcon size={12} /> {order.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-100">
                              <FileText className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-100 text-slate-400">
                              <Printer className="h-3.5 w-3.5" />
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
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Acompanhamento de Produção</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card className="rounded border-slate-200 shadow-none bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-8 w-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Wrench className="h-4 w-4" />
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Na Produção</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Lentes em laboratório.</p>
                    </div>
                    <span className="text-lg font-bold text-slate-900">4</span>
                </div>
           </Card>

           <Card className="rounded border-slate-200 shadow-none bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-8 w-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4" />
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Montagem Local</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Aguardando montagem.</p>
                    </div>
                    <span className="text-lg font-bold text-slate-900">2</span>
                </div>
           </Card>

           <Card className="rounded border-slate-200 shadow-none bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-8 w-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Prontos p/ Entrega</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Controle realizado.</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">7</span>
                </div>
           </Card>

           <Card className="rounded border-none bg-slate-900 p-5 text-white">
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <h3 className="text-sm font-semibold">Início Operacional</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Clique para abrir o módulo de venda rápida e medição digital.</p>
                    </div>
                    <Button className="w-full mt-4 bg-white text-slate-900 font-bold hover:bg-slate-100 h-9 rounded text-xs uppercase">ABRIR PDV</Button>
                </div>
           </Card>
       </div>
    </div>
  );
}
