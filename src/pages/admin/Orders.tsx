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
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
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
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);

  React.useEffect(() => {
    const qOrders = query(collection(db, "orders"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setOrders(data);
    });

    const qClients = query(collection(db, "clients"));
    const unsubClients = onSnapshot(qClients, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(data);
    });

    return () => {
      unsubOrders();
      unsubClients();
    };
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const clientId = data.clientId?.toString() || "";
      const client = clients.find(c => c.id === clientId);

      await addDoc(collection(db, "orders"), {
        clientId: clientId,
        clientName: client ? client.name : "Cliente Avulso",
        seller: data.seller || "",
        serviceType: data.serviceType || "",
        dueDate: data.dueDate || "",
        notes: data.notes || "",
        items: data.items || "A definir",
        total: Number(data.total) || 0,
        paymentMethod: data.paymentMethod || "Pendente",
        status: "Pendente",
        createdAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('pt-BR'),
      });
      
      toast.success("Pedido criado com sucesso!");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Pedidos & Vendas</h1>
          <p className="text-xs text-slate-500">Gestão completa do fluxo operacional e entregas.</p>
        </div>

        <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> NOVO PEDIDO
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-[720px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800">
                  <DialogTitle className="text-lg font-semibold flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5" /> Abertura de Ordem de Serviço
                  </DialogTitle>
                  <p className="text-slate-400 text-xs font-medium">Inicie um novo pedido com montagem e laboratório.</p>
                </DialogHeader>
                <form onSubmit={handleSave} className="flex flex-col max-h-[70vh] overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cliente Responsável</Label>
                                <Select name="clientId" required>
                                  <SelectTrigger className="rounded border-slate-200 h-9 text-sm">
                                    <SelectValue placeholder="Selecione o cliente" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {clients.map(c => (
                                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vendedor</Label>
                                <Input name="seller" placeholder="Selecione o vendedor" className="rounded border-slate-200 h-9 text-sm" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Serviço</Label>
                            <Select name="serviceType" defaultValue="Óculos Completo">
                              <SelectTrigger className="rounded border-slate-200 h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Óculos Completo">Óculos Completo</SelectItem>
                                <SelectItem value="Apenas Lentes">Apenas Lentes</SelectItem>
                                <SelectItem value="Apenas Armação">Apenas Armação</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data Prometida de Entrega</Label>
                            <Input name="dueDate" type="date" className="rounded border-slate-200 h-9 text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor Total Estimado (R$)</Label>
                            <Input name="total" type="number" step="0.01" className="rounded border-slate-200 h-9 text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observações de Laboratório</Label>
                            <textarea name="notes" className="w-full rounded border-slate-200 text-sm p-3 min-h-[80px] focus:outline-none focus:ring-0 focus:border-slate-400 font-medium" placeholder="Detalhes técnicos para montagem..."></textarea>
                        </div>
                    </div>
                </div>
                <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button type="button" variant="ghost" className="rounded px-4 font-semibold text-slate-500 text-xs h-9" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
                    <Button type="submit" disabled={isSaving} className="rounded bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold text-xs h-9">
                      {isSaving ? "SALVANDO..." : "CRIAR PEDIDO"}
                    </Button>
                </DialogFooter>
                </form>
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
                      R$ {(Number(order.total) || 0).toFixed(2)}
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
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-500 font-medium">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              )}
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
