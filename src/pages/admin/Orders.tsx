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
  AlertTriangle,
  BarChart2,
  TrendingUp,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
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

export default function Orders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isOverdueDialogOpen, setIsOverdueDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [orderToDelete, setOrderToDelete] = React.useState<any>(null);

  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteDoc(doc(db, "orders", orderToDelete.id));
      toast.success("Pedido excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (error: any) {
      toast.error("Erro ao excluir pedido: " + error.message);
    }
  };
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
  
  // Período Principal (unificado com Dashboard/Financial)
  const [period, setPeriod] = React.useState<PeriodKey>("30-dias");
  const [customStartDate, setCustomStartDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = React.useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

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

  // Filtro de período principal para KPIs e outros analytics
  const periodOrders = React.useMemo(() => {
    return orders.filter(o => isInPeriod(o.date || o.createdAt || '', period, customStartDate, customEndDate));
  }, [orders, period, customStartDate, customEndDate]);

  const filteredOrders = orders.filter(o => {
    // Filtro por Período Principal
    const matchesPeriod = isInPeriod(o.date || o.createdAt || '', period, customStartDate, customEndDate);

    // Busca por texto
    const matchesSearch = o.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || o.id?.includes(searchTerm);
    
    // Filtro por Status
    const matchesStatus = filterStatus === "todos" || o.status === filterStatus;
    
    // Filtro por Fornecedor
    const matchesSupplier = filterSupplier === "todos" || o.supplier === filterSupplier;
    
    // Filtro por Pagamento
    const matchesPayment = filterPayment === "todos" || o.paymentMethod === filterPayment;

    // Filtro por Data Adicional
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

    return matchesPeriod && matchesSearch && matchesStatus && matchesSupplier && matchesPayment && matchesDate;
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
    return periodOrders.filter(o => o.status === status).length;
  };

  // ---- Analytics Computados ----
  const parseOrderDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/').map(Number);
      if (!d || !m || !y) return null;
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
  };

  const overdueOrders = React.useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return orders.filter(o => {
      if (o.status === 'Entregue' || o.status === 'Cancelado') return false;
      const due = parseOrderDate(o.dueDate || '');
      return due && due < today;
    });
  }, [orders]);

  const totalVolume = React.useMemo(
    () => periodOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0),
    [periodOrders]
  );

  const ticketMedioOrder = periodOrders.length > 0 ? totalVolume / periodOrders.length : 0;

  const deliveredOrders = periodOrders.filter(o => o.status === 'Entregue').length;
  const taxaEntrega = periodOrders.length > 0 ? Math.round((deliveredOrders / periodOrders.length) * 100) : 0;

  // Gráfico de Volume Dinâmico por Período
  const volumeChartData = React.useMemo(() => {
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
      const dayLabel = `${parts[0]}/${parts[1]}`;
      const dayOrders = orders.filter(o => {
        const d = parseOrderDate(o.date || o.createdAt || '');
        return d && d.toLocaleDateString('pt-BR') === date;
      });
      return {
        day: dayLabel,
        pedidos: dayOrders.length,
        valor: dayOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0),
      };
    });
  }, [orders, period, customStartDate, customEndDate]);

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

  const periodLabel: Record<PeriodKey, string> = {
    hoje: "Hoje",
    ontem: "Ontem",
    semana: "Últimos 7 dias",
    mes: "Este mês",
    "30-dias": "Últimos 30 dias",
    "mes-anterior": "Mês Anterior",
    trimestre: "Últimos 3 Meses",
    ano: "Este ano",
    personalizado: "Personalizado",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Pedidos & Vendas</h1>
          <p className="text-xs text-slate-500">Gestão completa do fluxo operacional e entregas.</p>
        </div>

        {/* Period Selector & OS Action */}
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-8 px-4 flex items-center gap-2">
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
                <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3 !m-0 rounded-b-xl">
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

      {/* Alerta de Pedidos Atrasados */}
      {overdueOrders.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700">
              {overdueOrders.length} {overdueOrders.length === 1 ? 'pedido atrasado' : 'pedidos atrasados'}
            </p>
            <p className="text-xs text-red-500 mt-0.5 truncate">
              {overdueOrders.slice(0, 3).map(o => o.clientName).join(', ')}{overdueOrders.length > 3 ? ` e mais ${overdueOrders.length - 3}...` : ''}
            </p>
          </div>
          <button
            onClick={() => setIsOverdueDialogOpen(true)}
            className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-800 whitespace-nowrap"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KPIs expandidos */}
        <div className="lg:col-span-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Pendente", key: "Pendente", dot: "bg-slate-300" },
              { label: "Em Produção", key: "Em Produção", dot: "bg-amber-400" },
              { label: "Qualidade", key: "Qualidade", dot: "bg-blue-400" },
              { label: "Pronto p/ Entrega", key: "Pronto para Entrega", dot: "bg-emerald-400" },
              { label: "Entregue", key: "Entregue", dot: "bg-emerald-600" },
              { label: "Cancelado", key: "Cancelado", dot: "bg-red-400" },
            ].map(item => (
              <Card key={item.key} className="rounded border-slate-200 shadow-none bg-white">
                <CardContent className="p-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">{item.label}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900">{getStatusCount(item.key)}</span>
                    <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card 
              onClick={() => overdueOrders.length > 0 && setIsOverdueDialogOpen(true)}
              className={`rounded shadow-none ${overdueOrders.length > 0 ? 'border-red-200 bg-red-50/50 cursor-pointer hover:border-red-400 transition-colors' : 'border-slate-200 bg-white'}`}
            >
              <CardContent className="p-3">
                <div className={`h-7 w-7 rounded flex items-center justify-center mb-2 ${overdueOrders.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <p className={`text-[10px] font-semibold uppercase mb-1 ${overdueOrders.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>Atrasados</p>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${overdueOrders.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>{overdueOrders.length}</span>
                  {overdueOrders.length > 0 && <ChevronRight className="h-4 w-4 text-red-400" />}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded border-slate-200 shadow-none bg-white">
              <CardContent className="p-3">
                <div className="h-7 w-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Taxa de Entrega</p>
                <span className="text-lg font-bold text-slate-900">{taxaEntrega}%</span>
              </CardContent>
            </Card>
            <Card className="rounded border-slate-200 shadow-none bg-white">
              <CardContent className="p-3">
                <div className="h-7 w-7 rounded bg-slate-50 text-slate-600 flex items-center justify-center mb-2">
                  <BarChart2 className="h-3.5 w-3.5" />
                </div>
                <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Ticket Médio</p>
                <span className="text-sm font-bold text-slate-900">R$ {ticketMedioOrder.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </CardContent>
            </Card>
            <Card className="rounded border-slate-200 shadow-none bg-slate-900">
              <CardContent className="p-3">
                <div className="h-7 w-7 rounded bg-white/10 text-white flex items-center justify-center mb-2">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Volume Total</p>
                <span className="text-sm font-bold text-white">R$ {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gráfico de Volume */}
        <Card className="lg:col-span-7 rounded border-slate-200 shadow-none">
          <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Volume de Pedidos
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-400">
              {periodLabel[period]}
            </Badge>
          </CardHeader>
          <CardContent className="px-5 py-4 h-[190px]">
            {volumeChartData.every(d => d.pedidos === 0) ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                <BarChart2 className="h-8 w-8" />
                <p className="text-xs font-medium">Sem pedidos no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "4px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: "10px", fontWeight: "bold" }}
                    formatter={(v: any, name: string) => [name === 'pedidos' ? v : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name === 'pedidos' ? 'Pedidos' : 'Valor']}
                  />
                  <Bar dataKey="pedidos" fill="#0f172a" radius={[3, 3, 0, 0]} barSize={volumeChartData.length > 15 ? 8 : 16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
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
            <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pedido</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</TableHead>
                <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cliente / Data</TableHead>
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
                      <span className="text-[11px] font-semibold text-slate-600">{order.supplier || "—"}</span>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{order.clientName}</span>
                          <span className="text-[11px] text-slate-400">{order.date}</span>
                      </div>
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded hover:bg-slate-100 text-red-500 hover:text-red-700"
                            onClick={() => {
                              setOrderToDelete(order);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Pop-up de Pedidos em Atraso */}
      <Dialog open={isOverdueDialogOpen} onOpenChange={setIsOverdueDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[640px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-red-600 p-6 text-white border-b border-red-700">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-white" /> Pedidos em Atraso ({overdueOrders.length})
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
            {overdueOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                Nenhum pedido em atraso.
              </div>
            ) : (
              overdueOrders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                // Calcule os dias de atraso se possível
                let delayDaysText = "";
                const today = new Date(); today.setHours(0,0,0,0);
                const due = parseOrderDate(order.dueDate || "");
                if (due) {
                  const diffTime = today.getTime() - due.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays > 0) {
                    delayDaysText = `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} de atraso`;
                  }
                }

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setIsOverdueDialogOpen(false);
                      navigate(`/admin/pedidos/${order.id}`);
                    }}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3.5 rounded border border-slate-100 hover:border-red-200 hover:bg-red-50/10 transition-all cursor-pointer group bg-white shadow-sm"
                  >
                    {/* Col 1: OS & Cliente */}
                    <div className="sm:col-span-5 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-slate-900 text-xs tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          #{order.orderCode || order.tso || order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <Badge className={`rounded ${statusColors[order.status] || 'bg-slate-100'} text-[8px] font-bold uppercase tracking-wider shadow-none border-none px-1.5 py-0.5`}>
                          {order.status}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-slate-900">
                        {order.clientName}
                      </h4>
                    </div>

                    {/* Col 2: Atraso e Prazo */}
                    <div className="sm:col-span-4 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Previsão de Entrega</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">
                          {order.dueDate || '—'}
                        </span>
                        {delayDaysText && (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                            {delayDaysText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Financeiro e Botão de Ir */}
                    <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3 min-w-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Valor Total</p>
                        <p className="text-xs font-bold text-slate-950">
                          R$ {(Number(order.total) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="h-7 w-7 rounded bg-slate-50 group-hover:bg-red-50 flex items-center justify-center border border-slate-100 group-hover:border-red-100 transition-colors">
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end !m-0 rounded-b-xl">
            <Button
              variant="outline"
              onClick={() => setIsOverdueDialogOpen(false)}
              className="rounded px-4 font-semibold text-slate-600 text-xs h-9 border-slate-200"
            >
              FECHAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pop-up de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[480px] rounded border-slate-200 shadow-2xl p-6 bg-white animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="flex flex-col items-center text-center pb-4">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3 border border-red-100">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirmar Exclusão de Pedido
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-sm text-slate-500 text-center space-y-2 py-2">
            <p>Você está prestes a excluir permanentemente o pedido do cliente:</p>
            {orderToDelete && (
              <div className="p-3 bg-slate-50 rounded border border-slate-100 font-medium text-slate-800 space-y-1">
                <p className="font-mono text-xs text-slate-500">#{orderToDelete.orderCode || orderToDelete.tso || orderToDelete.id.substring(0, 8).toUpperCase()}</p>
                <p className="text-sm font-bold">{orderToDelete.clientName}</p>
                <p className="text-xs text-slate-400">Total: R$ {(Number(orderToDelete.total) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            )}
            <p className="text-xs text-red-500 font-semibold pt-2">Esta ação é irreversível e removerá todos os dados do banco de dados.</p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-4 border-t border-slate-100 !m-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setOrderToDelete(null);
              }}
              className="w-full sm:w-auto rounded px-4 font-semibold text-slate-600 text-xs h-9 border-slate-200"
            >
              CANCELAR
            </Button>
            <Button
              onClick={handleDelete}
              className="w-full sm:w-auto rounded bg-red-600 hover:bg-red-700 text-white px-5 font-semibold text-xs h-9"
            >
              CONFIRMAR E EXCLUIR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
