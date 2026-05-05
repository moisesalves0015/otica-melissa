import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import html2pdf from "html2pdf.js";
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [atendentes, setAtendentes] = React.useState<any[]>([]);
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [categorias, setCategorias] = React.useState<any[]>([]);
  
  // Estados para Filtros Avançados
  const [filterStartDate, setFilterStartDate] = React.useState("");
  const [filterEndDate, setFilterEndDate] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("todos");
  const [filterSupplier, setFilterSupplier] = React.useState("todos");
  const [filterPayment, setFilterPayment] = React.useState("todos");
  const [showFilters, setShowFilters] = React.useState(false);

  const formatDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/(\d{2})(\d)/, "$1/$2")
            .replace(/(\d{2})(\d)/, "$1/$2");
  };

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

    const unsubAtendentes = onSnapshot(query(collection(db, "atendentes")), (snap) => {
      setAtendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFornecedores = onSnapshot(query(collection(db, "fornecedores")), (snap) => {
      setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAtendimentos = onSnapshot(query(collection(db, "atendimentos")), (snap) => {
      setAtendimentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCat = onSnapshot(query(collection(db, "categorias")), (snap) => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubOrders();
      unsubClients();
      unsubAtendentes();
      unsubFornecedores();
      unsubAtendimentos();
      unsubCat();
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

      let orderDueDate = data.dueDate ? String(data.dueDate) : "";
      if (orderDueDate.includes("-") && orderDueDate.split("-")[0].length === 4) {
          const [y, m, d] = orderDueDate.split("-");
          orderDueDate = `${d}/${m}/${y}`;
      }

      await addDoc(collection(db, "orders"), {
        clientId: clientId,
        clientName: client ? client.name : "Cliente Avulso",
        seller: data.seller || "",
        serviceType: data.serviceType || "",
        dueDate: orderDueDate,
        notes: data.notes || "",
        items: data.items || "A definir",
        total: Number(data.total) || 0,
        paymentMethod: data.paymentMethod || "Pendente",
        status: "Pendente",
        orderCode: data.orderCode || "",
        labCode: data.labCode || "",
        supplier: data.supplier || "",
        linkedAtendimentoId: data.linkedAtendimentoId || "",
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

  const filteredOrders = orders.filter(o => {
    // Busca por texto
    const matchesSearch = o.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || o.id?.includes(searchTerm);
    
    // Filtro por Status
    const matchesStatus = filterStatus === "todos" || o.status === filterStatus;
    
    // Filtro por Fornecedor
    const matchesSupplier = filterSupplier === "todos" || o.supplier === filterSupplier;
    
    // Filtro por Pagamento
    const matchesPayment = filterPayment === "todos" || o.paymentMethod === filterPayment;

    // Filtro por Data
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
        if (o.date) {
            const [d, m, y] = o.date.split("/").map(Number);
            const itemDate = new Date(y, m - 1, d);
            
            if (filterStartDate) {
                const [sd, sm, sy] = filterStartDate.split("/").map(Number);
                const startDate = new Date(sy, sm - 1, sd);
                if (itemDate < startDate) matchesDate = false;
            }
            if (filterEndDate) {
                const [ed, em, ey] = filterEndDate.split("/").map(Number);
                const endDate = new Date(ey, em - 1, ed);
                if (itemDate > endDate) matchesDate = false;
            }
        } else {
            matchesDate = false;
        }
    }

    return matchesSearch && matchesStatus && matchesSupplier && matchesPayment && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterStatus("todos");
    setFilterSupplier("todos");
    setFilterPayment("todos");
  };

  const getStatusCount = (status: string) => {
    return orders.filter(o => o.status === status).length;
  };

  const handlePrint = () => {
    const totalValorFiltrado = filteredOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const element = document.createElement('div');
    
    element.innerHTML = `
      <div style="font-family: sans-serif; color: #1e293b; padding: 40px; background: white;">
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Relatório de Pedidos & Vendas</h1>
            <p style="margin: 2px 0; font-size: 10px; color: #64748b; font-weight: 600;">ÓTICA MELISSA - GESTÃO OPERACIONAL</p>
          </div>
          <div style="text-align: right">
            <p style="margin: 2px 0; font-size: 10px; color: #64748b; font-weight: 600;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p style="margin: 2px 0; font-size: 10px; color: #64748b; font-weight: 600;">Total de Registros: ${filteredOrders.length}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9px;">
          <thead>
            <tr>
              <th style="background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: 800; color: #475569;">ID Pedido</th>
              <th style="background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: 800; color: #475569;">Cód. Lab</th>
              <th style="background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: 800; color: #475569;">Data</th>
              <th style="background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: 800; color: #475569;">Cliente</th>
              <th style="background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: 800; color: #475569;">Itens / Descrição</th>
              <th style="background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: 800; color: #475569;">Status</th>
              <th style="background: #f8fafc; text-align: right; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: 800; color: #475569;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map(o => `
              <tr style="page-break-inside: avoid;">
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 800;">#${o.orderCode || o.tso || o.id.substring(0, 8).toUpperCase()}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${o.orderCode || '—'}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">${o.date || '—'}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 700;">${o.clientName}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">${o.items}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; font-weight: 700;">${o.status}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 800;">R$ ${(Number(o.total) || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; border-top: 2px solid #f1f5f9; padding-top: 15px; display: flex; justify-content: space-between;">
          <div style="background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; display: inline-block; min-width: 200px;">
            <p style="margin: 5px 0; font-size: 11px; font-weight: 600;">Resumo Financeiro</p>
            <p style="margin: 5px 0; font-size: 11px; font-weight: 600;">Quantidade: <strong style="font-size: 14px; color: #0f172a;">${filteredOrders.length}</strong></p>
            <p style="margin: 5px 0; font-size: 11px; font-weight: 600;">Total Bruto: <strong style="font-size: 14px; color: #0f172a;">R$ ${totalValorFiltrado.toFixed(2)}</strong></p>
          </div>
          <div style="font-size: 9px; color: #94a3b8; align-self: flex-end; margin-top: 40px;">
            Assinatura: _________________________________________________
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `relatorio-pedidos-${new Date().getTime()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    toast.promise(html2pdf().from(element).set(opt).save(), {
      loading: 'Gerando PDF...',
      success: 'Relatório baixado com sucesso!',
      error: 'Erro ao gerar PDF.'
    });
  };

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
                </DialogHeader>
                <form onSubmit={handleSave} className="flex flex-col max-h-[85vh] overflow-hidden">
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
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vendedor / Atendente</Label>
                                <Select name="seller" required>
                                  <SelectTrigger className="rounded border-slate-200 h-9 text-sm">
                                    <SelectValue placeholder="Selecione o vendedor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {atendentes.map(a => (
                                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Código do Pedido</Label>
                                <Input name="orderCode" placeholder="Ex: PED-001" className="rounded border-slate-200 h-9 text-xs font-mono font-semibold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Código Lab</Label>
                                <Input name="labCode" placeholder="Ex: LAB-001" className="rounded border-slate-200 h-9 text-xs font-mono font-semibold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</Label>
                                <Select name="supplier">
                                  <SelectTrigger className="rounded border-slate-200 h-9 text-sm">
                                    <SelectValue placeholder="Selecione o fornecedor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fornecedores.map(f => (
                                      <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vincular a um Atendimento (Opcional)</Label>
                            <Select name="linkedAtendimentoId">
                              <SelectTrigger className="rounded border-slate-200 h-9 text-sm">
                                <SelectValue placeholder="Selecione um atendimento" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhum">Nenhum vínculo</SelectItem>
                                {atendimentos.slice(0, 10).map(a => (
                                  <SelectItem key={a.id} value={a.id}>{a.date} - {a.clientName || 'Cliente'} (R$ {a.totalValue?.toFixed(2)})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                              <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Serviço</Label>
                              <Select name="serviceType" defaultValue={categorias[0]?.name || ""}>
                                <SelectTrigger className="rounded border-slate-200 h-9 text-sm">
                                  <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categorias.length === 0 ? (
                                    <SelectItem value="Serviço">Cadastre categorias em Configurações</SelectItem>
                                  ) : (
                                    categorias.map(cat => (
                                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-1.5">
                              <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data Prometida</Label>
                              <Input name="dueDate" type="date" className="rounded border-slate-200 h-9 text-sm" required />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição dos Itens / Lentes</Label>
                            <Input name="items" placeholder="Ex: Armação RX + Lentes Kodak Anti-Reflexo" className="rounded border-slate-200 h-9 text-sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                              <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor do Pedido (R$)</Label>
                              <Input name="total" type="number" step="0.01" className="rounded border-slate-200 h-9 text-sm font-bold" required />
                          </div>
                          <div className="space-y-1.5">
                              <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Forma de Pagto</Label>
                              <Select name="paymentMethod" defaultValue="pix">
                                <SelectTrigger className="rounded border-slate-200 h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pix">PIX</SelectItem>
                                  <SelectItem value="cartao">Cartão</SelectItem>
                                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                  <SelectItem value="carne">Carnê</SelectItem>
                                </SelectContent>
                              </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observações Técnicas</Label>
                            <textarea name="notes" className="w-full rounded border-slate-200 text-sm p-3 min-h-[80px] focus:outline-none focus:ring-0 focus:border-slate-400 font-medium" placeholder="Detalhes para o laboratório..."></textarea>
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

      {/* Workflow Overview Dinâmico */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
            { label: "Pendente", key: "Pendente" },
            { label: "Produção", key: "Em Produção" },
            { label: "Qualidade", key: "Qualidade" },
            { label: "Pronto", key: "Pronto para Entrega" },
            { label: "Entregue", key: "Entregue" },
            { label: "Cancelado", key: "Cancelado" }
        ].map((item, i) => (
            <Card key={item.key} className="rounded border-slate-200 shadow-none bg-white">
                <CardContent className="p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">{item.label}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900">{getStatusCount(item.key)}</span>
                        <div className={`h-1.5 w-1.5 rounded-full ${item.key === 'Pendente' ? 'bg-slate-300' : item.key === 'Entregue' ? 'bg-emerald-500' : item.key === 'Cancelado' ? 'bg-red-500' : 'bg-slate-900'}`} />
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card className="rounded border-slate-200 shadow-none">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 group max-w-md">
             <Input
                placeholder="Buscar por cliente ou Nº do pedido..."
                className="pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={`h-9 rounded border-slate-200 text-xs font-bold transition-colors ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          >
              <Filter className="h-3.5 w-3.5 mr-2" />
              {showFilters ? 'OCULTAR FILTROS' : 'FILTROS AVANÇADOS'}
              {(filterStatus !== 'todos' || filterSupplier !== 'todos' || filterPayment !== 'todos' || filterStartDate || filterEndDate) && (
                  <Badge className="ml-2 bg-emerald-500 text-white border-none h-4 px-1 min-w-[16px] flex items-center justify-center text-[9px]">
                      !
                  </Badge>
              )}
          </Button>

          {(searchTerm || filterStatus !== 'todos' || filterSupplier !== 'todos' || filterPayment !== 'todos' || filterStartDate || filterEndDate) && (
              <Button 
                  variant="ghost" 
                  onClick={clearFilters}
                  className="h-9 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
              >
                  LIMPAR
              </Button>
          )}

          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="rounded h-9 px-4 font-semibold text-xs border-slate-200 text-slate-600 ml-auto"
          >
              <Printer className="h-3.5 w-3.5 mr-2" /> IMPRIMIR
          </Button>
        </div>

        {/* PAINEL DE FILTROS AVANÇADOS (PEDIDOS) */}
        {showFilters && (
            <div className="p-5 bg-slate-50/80 border-b border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Data Inicial</Label>
                        <Input 
                            placeholder="DD/MM/YYYY" 
                            value={filterStartDate} 
                            onChange={(e) => setFilterStartDate(formatDate(e.target.value))}
                            className="h-9 rounded border-slate-200 bg-white text-xs font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Data Final</Label>
                        <Input 
                            placeholder="DD/MM/YYYY" 
                            value={filterEndDate} 
                            onChange={(e) => setFilterEndDate(formatDate(e.target.value))}
                            className="h-9 rounded border-slate-200 bg-white text-xs font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-9 rounded border-slate-200 bg-white text-xs font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                <SelectItem value="todos">Todos Status</SelectItem>
                                {Object.keys(statusIcons).map(st => (
                                    <SelectItem key={st} value={st}>{st}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fornecedor</Label>
                        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                            <SelectTrigger className="h-9 rounded border-slate-200 bg-white text-xs font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                <SelectItem value="todos">Todos</SelectItem>
                                {fornecedores.map(f => (
                                    <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pagamento</Label>
                        <Select value={filterPayment} onValueChange={setFilterPayment}>
                            <SelectTrigger className="h-9 rounded border-slate-200 bg-white text-xs font-medium uppercase">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                <SelectItem value="todos">Todas</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="cartao">Cartão</SelectItem>
                                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="carne">Carnê</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        )}
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pedido</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cód. / Lab</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</TableHead>
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
                      <span className="font-semibold text-slate-900">#{order.orderCode || order.tso || order.id.substring(0, 8).toUpperCase()}</span>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{order.orderCode || "—"}</span>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <span className="text-[11px] font-semibold text-slate-600">{order.supplier || "—"}</span>
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded hover:bg-slate-100"
                            onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                          >
                              <FileText className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded hover:bg-slate-100 text-slate-400"
                            onClick={() => navigate(`/admin/pedidos/${order.id}?print=true`)}
                          >
                              <Printer className="h-3.5 w-3.5" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-slate-500 font-medium">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
