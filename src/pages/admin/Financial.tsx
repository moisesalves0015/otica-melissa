import * as React from "react";
import { motion } from "motion/react";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Filter,
  Download,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  History,
  QrCode,
  Plus,
  Search,
  UserCheck,
  ShieldAlert,
  Edit,
  Printer,
  CheckCircle2,
  XCircle,
  Trash2,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { calculateCreditScore, getCreditStatusColor } from "../../lib/credit";
import { toast } from "sonner";
import html2pdf from 'html2pdf.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Financial() {
  const [activeTab, setActiveTab] = React.useState(localStorage.getItem('financialTab') || "caixa");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [groupedInstallments, setGroupedInstallments] = React.useState<any[]>([]);
  const [rawInstallments, setRawInstallments] = React.useState<any[]>([]);
  const [searchTermCarnes, setSearchTermCarnes] = React.useState("");
  const [filterStatusCarnes, setFilterStatusCarnes] = React.useState("todos");
  const [clients, setClients] = React.useState<any[]>([]);
  const [receivingInstallment, setReceivingInstallment] = React.useState<any>(null);
  const [receivedByName, setReceivedByName] = React.useState("");
  const [receiveAmount, setReceiveAmount] = React.useState<number>(0);
  const [editingTransaction, setEditingTransaction] = React.useState<any>(null);
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [isDebtorsDialogOpen, setIsDebtorsDialogOpen] = React.useState(false);
  const [isIssuanceDialogOpen, setIsIssuanceDialogOpen] = React.useState(false);

  const [isCreditDialogOpen, setIsCreditDialogOpen] = React.useState(false);
  const [editingCreditClient, setEditingCreditClient] = React.useState<any>(null);
  const [newCreditStatus, setNewCreditStatus] = React.useState("auto");
  const [newCreditReason, setNewCreditReason] = React.useState("");

  React.useEffect(() => {
    // 1. Transações (Fluxo de Caixa)
    const qTrans = query(collection(db, "financial_transactions"));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setTransactions(data);
    });

    // 2. Parcelas (Carnês)
    const qInst = query(collection(db, "installments"));
    const unsubInst = onSnapshot(qInst, (snapshot) => {
        const allInsts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setRawInstallments(allInsts);
        
        // Agrupar por atendimentoId
        const groups: Record<string, any> = {};
        allInsts.forEach((inst: any) => {
            if (!groups[inst.atendimentoId]) {
                groups[inst.atendimentoId] = {
                    id: inst.atendimentoId,
                    client: inst.clientName,
                    installments: [],
                    downPayment: null,
                    totalValue: 0,
                    remainingValue: 0,
                };
            }
            if (inst.isDownPayment) {
                groups[inst.atendimentoId].downPayment = inst;
            } else {
                groups[inst.atendimentoId].installments.push(inst);
                groups[inst.atendimentoId].totalValue += inst.value;
            }

            // Cálculo preciso do saldo devedor
            const paid = inst.paidAmount || (inst.status === 'Pago' ? inst.value : 0);
            const total = inst.value;
            groups[inst.atendimentoId].remainingValue += (total - paid);
        });

        const groupsArray = Object.values(groups).map((g: any) => {
            // Ordenar as parcelas por número
            g.installments.sort((a: any, b: any) => a.number - b.number);
            return g;
        });

        setGroupedInstallments(groupsArray);
    });

    const unsubAtendimentos = onSnapshot(query(collection(db, "atendimentos"), orderBy("createdAt", "desc")), (snap) => {
        setAtendimentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubClients = onSnapshot(collection(db, "clients"), (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
        unsubTrans();
        unsubInst();
        unsubAtendimentos();
        unsubClients();
    };
  }, []);

  const walletStats = React.useMemo(() => {
    if (rawInstallments.length === 0) return { adimplencia: 100, inadimplencia: 0, overdueCount: 0, overdueTotal: 0, debtors: [] };
    
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    let totalValue = 0;
    let paidValue = 0;
    let overdueCount = 0;
    let overdueTotal = 0;
    const debtorsMap: Record<string, any> = {};

    rawInstallments.forEach(inst => {
      totalValue += inst.value;
      const isPaid = inst.status === 'Pago';
      const paid = inst.paidAmount || (isPaid ? inst.value : 0);
      paidValue += paid;

      if (!isPaid) {
        let dueDate: Date;
        if (inst.dueDate?.includes("/")) {
            const [d, m, y] = inst.dueDate.split("/").map(Number);
            dueDate = new Date(y, m - 1, d);
        } else {
            dueDate = new Date(inst.dueDate);
        }

        if (hoje > dueDate) {
          overdueCount++;
          const remaining = inst.value - paid;
          overdueTotal += remaining;

          if (!debtorsMap[inst.clientId]) {
            debtorsMap[inst.clientId] = {
                id: inst.clientId,
                name: inst.clientName,
                totalOverdue: 0,
                count: 0,
                phone: ""
            };
          }
          debtorsMap[inst.clientId].totalOverdue += remaining;
          debtorsMap[inst.clientId].count++;
        }
      }
    });

    const adimplencia = totalValue > 0 ? (paidValue / totalValue) * 100 : 100;
    const inadimplencia = totalValue > 0 ? (overdueTotal / totalValue) * 100 : 0;

    const debtors = Object.values(debtorsMap).map(d => {
        const client = clients.find(c => c.id === d.id);
        return { ...d, phone: client?.phone || "" };
    }).sort((a, b) => b.totalOverdue - a.totalOverdue);

    return { 
      adimplencia: Math.round(adimplencia), 
      inadimplencia: Math.round(inadimplencia), 
      overdueCount, 
      overdueTotal,
      debtors
    };
  }, [rawInstallments, clients]);

  const handleIssueCarne = async (atend: any) => {
    if (!confirm(`Deseja gerar o carnê para o Atendimento #${atend.tso || atend.id.slice(0,6)}?\nIsso criará as parcelas no financeiro conforme configurado no atendimento.`)) return;

    try {
        const installmentsCount = atend.installmentsCount || 1;
        const totalValue = atend.totalValue || 0;
        const entrada = atend.entrada || 0;
        const remainingToInstall = totalValue - entrada;
        const installmentValue = remainingToInstall / installmentsCount;
        const firstDueDate = atend.firstDueDate;

        if (entrada > 0) {
            await addDoc(collection(db, "installments"), {
                atendimentoId: atend.id,
                clientId: atend.clientId,
                clientName: atend.clientName,
                value: entrada,
                paidAmount: 0,
                status: 'Pendente',
                dueDate: atend.date,
                isDownPayment: true,
                createdAt: new Date().toISOString()
            });
        }

        for (let i = 1; i <= installmentsCount; i++) {
            let dueDate = "";
            if (firstDueDate) {
                const [d, m, y] = firstDueDate.split("/").map(Number);
                const date = new Date(y, m - 1 + (i - 1), d);
                dueDate = date.toLocaleDateString('pt-BR');
            }

            await addDoc(collection(db, "installments"), {
                atendimentoId: atend.id,
                clientId: atend.clientId,
                clientName: atend.clientName,
                number: i,
                totalInstallments: installmentsCount,
                value: installmentValue,
                paidAmount: 0,
                status: 'Pendente',
                dueDate: dueDate,
                isDownPayment: false,
                createdAt: new Date().toISOString()
            });
        }

        toast.success("Carnê gerado com sucesso!");
        setIsIssuanceDialogOpen(false);
    } catch (err: any) {
        toast.error("Erro ao gerar carnê: " + err.message);
    }
  };

  const handleReceiveInstallment = async () => {
      if (!receivingInstallment || !receivedByName.trim() || receiveAmount <= 0) {
          toast.error("Informe quem está recebendo e um valor válido.");
          return;
      }
      try {
          const now = new Date();
          const receivedAt = now.toISOString();
          const receivedAtBr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          const currentPaid = receivingInstallment.paidAmount || 0;
          const newTotalPaid = currentPaid + receiveAmount;
          const isFullyPaid = newTotalPaid >= receivingInstallment.value - 0.01; // margem para float

          // Atualiza status da parcela
          const docRef = doc(db, "installments", receivingInstallment.id);
          await updateDoc(docRef, {
              status: isFullyPaid ? 'Pago' : 'Parcial',
              paidAmount: newTotalPaid,
              receivedBy: receivedByName,
              receivedAt: receivedAt,
              receivedAtBr: receivedAtBr,
          });

          const label = receivingInstallment.isDownPayment
              ? `Entrada (Carnê) - ${receivingInstallment.clientName}`
              : `Parcela ${receivingInstallment.number}/${receivingInstallment.totalInstallments} - ${receivingInstallment.clientName}`;

          const description = receiveAmount < receivingInstallment.value 
              ? `${label} (Parcial)` 
              : label;

          // Lança entrada no fluxo de caixa
          await addDoc(collection(db, "financial_transactions"), {
            atendimentoId: receivingInstallment.atendimentoId,
            installmentId: receivingInstallment.id,
            description: description,
            amount: receiveAmount,
            date: now.toLocaleDateString('pt-BR'),
            category: receivingInstallment.isDownPayment ? "Entrada Carnê" : "Recebimento Carnê",
            type: "Entrada",
            paymentMethod: "Dinheiro/Pix",
            receivedBy: receivedByName,
            createdAt: receivedAt,
          });

          toast.success(isFullyPaid ? "Recebimento total confirmado!" : `Recebimento parcial de R$ ${receiveAmount.toFixed(2)} confirmado!`);
          setReceivingInstallment(null);
          setReceivedByName("");
          setReceiveAmount(0);
      } catch (err: any) {
          toast.error("Erro ao receber: " + err.message);
      }
  };

  const handleRevertPayment = async (inst: any) => {
    if (!confirm(`DESEJA ESTORNAR O PAGAMENTO DE "${inst.clientName.toUpperCase()}"?\nEsta ação voltará a parcela para o status PENDENTE e removerá os lançamentos vinculados no caixa.`)) return;

    try {
        // 1. Voltar parcela para Pendente
        const docRef = doc(db, "installments", inst.id);
        await updateDoc(docRef, {
            status: 'Pendente',
            paidAmount: 0,
            receivedBy: null,
            receivedAt: null,
            receivedAtBr: null,
        });

        // 2. Tentar encontrar e remover as transações de caixa vinculadas a esta parcela
        const qTrans = query(collection(db, "financial_transactions"), where("installmentId", "==", inst.id));
        const transSnap = await getDocs(qTrans);
        const delPromises = transSnap.docs.map(d => deleteDoc(doc(db, "financial_transactions", d.id)));
        await Promise.all(delPromises);

        toast.success("Pagamento estornado com sucesso.");
    } catch (err: any) {
        toast.error("Erro ao estornar: " + err.message);
    }
  };

  const handlePrintCarne = (carneId: string) => {
      const printContent = document.getElementById(`printable-carne-${carneId}`);
      if (printContent) {
          const originalContent = document.body.innerHTML;
          document.body.innerHTML = printContent.innerHTML;
          window.print();
          document.body.innerHTML = originalContent;
          window.location.reload();
      }
  };

  const handleDownloadCarnePDF = (carneId: string, clientName: string) => {
    const element = document.getElementById(`printable-carne-${carneId}`) as HTMLElement;
    if (!element) {
        toast.error("Erro ao localizar o conteúdo do carnê.");
        return;
    }

    const opt = {
      margin:       0,
      filename:     `Carne_${clientName.replace(/\s+/g, '_')}_${carneId.substring(0,6)}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    toast.info("Gerando PDF do carnê, aguarde...");
    
    // Garantir que o elemento seja visível para captura
    const originalStyle = element.style.display;
    element.style.display = 'block';

    html2pdf().from(element).set(opt).save().then(() => {
        element.style.display = originalStyle;
        toast.success("Download do carnê concluído!");
    }).catch((err: any) => {
        element.style.display = originalStyle;
        /* Error logged internally */
        toast.error("Erro ao gerar PDF do carnê.");
    });
  };

  const handleDeleteCarne = async (atendimentoId: string, clientName: string) => {
    if (!confirm(`TEM CERTEZA QUE DESEJA EXCLUIR O CARNÊ DE "${clientName.toUpperCase()}"?\nEsta ação apagará todas as parcelas vinculadas a este atendimento.`)) return;

    try {
        const q = query(collection(db, "installments"), where("atendimentoId", "==", atendimentoId));
        const snapshot = await getDocs(q);
        
        const promises = snapshot.docs.map(d => deleteDoc(doc(db, "installments", d.id)));
        await Promise.all(promises);
        
        toast.success("Carnê excluído com sucesso.");
    } catch (err: any) {
        toast.error("Erro ao excluir carnê: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const amount = Number(data.amount) || 0;
      let transactionDate = data.date ? String(data.date) : new Date().toISOString().split('T')[0];
      
      if (transactionDate.includes("-") && transactionDate.split("-")[0].length === 4) {
        const [y, m, d] = transactionDate.split("-");
        transactionDate = `${d}/${m}/${y}`;
      }

      const transactionData = {
        description: data.description || "",
        amount: amount,
        date: transactionDate,
        category: data.category || "Não definida",
        type: data.type || "Entrada",
        updatedAt: new Date().toISOString(),
      };

      if (editingTransaction) {
          await updateDoc(doc(db, "financial_transactions", editingTransaction.id), transactionData);
          toast.success("Transação atualizada!");
      } else {
          await addDoc(collection(db, "financial_transactions"), {
            ...transactionData,
            createdAt: new Date().toISOString(),
          });
          toast.success("Transação registrada!");
      }
      
      setIsDialogOpen(false);
      setEditingTransaction(null);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getChartData = () => {
    const months: Record<string, { name: string, entrada: number, saida: number }> = {};
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthYear = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      months[key] = { name: monthYear, entrada: 0, saida: 0 };
      last6Months.push(key);
    }

    transactions.forEach(t => {
      if (!t.date) return;
      let date: Date;
      if (t.date.includes('/')) {
        const [d, m, y] = t.date.split('/').map(Number);
        date = new Date(y, m - 1, d);
      } else {
        date = new Date(t.date);
      }
      
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (months[key]) {
        if (t.type === 'Entrada') months[key].entrada += Number(t.amount);
        else months[key].saida += Number(t.amount);
      }
    });

    return last6Months.map(key => months[key]);
  };

  const chartData = getChartData();

  const handleDeleteTransaction = async (id: string) => {
      if (!confirm("Deseja excluir esta transação permanentemente?")) return;
      try {
          await deleteDoc(doc(db, "financial_transactions", id));
          toast.success("Transação excluída.");
      } catch (err: any) {
          toast.error("Erro ao excluir: " + err.message);
      }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('printable-cashflow');
    if (!element) {
        toast.error("Erro ao localizar o conteúdo para exportação.");
        return;
    }

    const opt = {
      margin:       10,
      filename:     `Relatorio_Financeiro_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    toast.info("Gerando PDF, aguarde...");
    html2pdf().from(element).set(opt).save().then(() => {
        toast.success("Download concluído!");
    }).catch((err: any) => {
        toast.error("Erro ao gerar PDF.");
    });
  };



  const handleSaveCreditOverride = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCreditClient) return;
      setIsSaving(true);
      try {
          const isAuto = newCreditStatus === "auto";
          await updateDoc(doc(db, "clients", editingCreditClient.id), {
              manualCreditStatus: isAuto ? null : newCreditStatus,
              creditStatusReason: isAuto ? null : newCreditReason
          });
          toast.success("Status de crédito atualizado!");
          setEditingCreditClient(null);
      } catch (err: any) {
          toast.error("Erro ao atualizar status: " + err.message);
      } finally {
          setIsSaving(false);
      }
  };

  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Dashboard calcs
  const totalReceitas = transactions.filter(t => t.type === 'Entrada').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalDespesas = transactions.filter(t => t.type === 'Saída').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  const expensesByCategory = transactions
      .filter(t => t.type === 'Saída')
      .reduce((acc, curr) => {
          acc[curr.category] = (acc[curr.category] || 0) + Math.abs(Number(curr.amount));
          return acc;
      }, {} as Record<string, number>);
  
  const categoryChartData = Object.keys(expensesByCategory).map(key => ({
      name: key,
      value: expensesByCategory[key]
  })).sort((a, b) => b.value - a.value);

  const monthlyFlow = transactions.reduce((acc, curr) => {
      if (!curr.date) return acc;
      const parts = curr.date.split('/');
      if (parts.length === 3) {
          const monthYear = `${parts[1]}/${parts[2]}`;
          if (!acc[monthYear]) acc[monthYear] = { name: monthYear, receitas: 0, despesas: 0 };
          if (curr.type === 'Entrada') acc[monthYear].receitas += Number(curr.amount);
          if (curr.type === 'Saída') acc[monthYear].despesas += Math.abs(Number(curr.amount));
      }
      return acc;
  }, {} as Record<string, any>);
  
  const monthlyChartData = Object.values(monthlyFlow).sort((a: any, b: any) => {
      const [mA, yA] = a.name.split('/');
      const [mB, yB] = b.name.split('/');
      return new Date(Number(yA), Number(mA)-1).getTime() - new Date(Number(yB), Number(mB)-1).getTime();
  });

  return (
    <div className="space-y-6">
      {/* DIALOG DE CONFIRMAÇÃO DE RECEBIMENTO */}
      {receivingInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                {receivingInstallment.isDownPayment ? 'Confirmar Recebimento da Entrada' : `Confirmar Recebimento — ${receivingInstallment.number}ª Parcela`}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Cliente: <strong>{receivingInstallment.clientName}</strong></p>
              <p className="text-sm text-slate-500">Valor da Parcela: <strong className="text-slate-900">R$ {receivingInstallment.value?.toFixed(2)}</strong></p>
              {receivingInstallment.paidAmount > 0 && (
                  <p className="text-sm text-emerald-600 font-bold uppercase text-[10px]">Já Pago: R$ {receivingInstallment.paidAmount.toFixed(2)}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Valor a Receber (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={receiveAmount}
                        onChange={e => setReceiveAmount(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recebido por *</label>
                    <input
                        type="text"
                        value={receivedByName}
                        onChange={e => setReceivedByName(e.target.value)}
                        placeholder="Nome"
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                        onKeyDown={e => e.key === 'Enter' && handleReceiveInstallment()}
                    />
                </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setReceivingInstallment(null); setReceivedByName(''); setReceiveAmount(0); }}
                className="flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-2 hover:bg-slate-50"
              >CANCELAR</button>
              <button
                onClick={handleReceiveInstallment}
                disabled={!receivedByName.trim() || receiveAmount <= 0}
                className="flex-1 bg-slate-900 text-white font-bold text-xs py-2 hover:bg-slate-800 disabled:opacity-40"
              >CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Gestão Financeira</h1>
          <p className="text-xs text-slate-500">Fluxo de caixa, controle de carnês e saúde financeira.</p>
        </div>

        <div className="flex gap-2">
            <Button 
                onClick={handleExportPDF}
                variant="outline" 
                className="rounded border-slate-200 text-slate-600 font-semibold text-xs h-9 px-4 flex items-center gap-2"
            >
                <Download className="h-4 w-4" /> EXPORTAR
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingTransaction(null);
            }}>
                <DialogTrigger asChild>
                    <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> NOVA TRANSAÇÃO
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-[600px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800">
                        <DialogTitle className="text-lg font-semibold flex items-center gap-3">
                            <DollarSign className="h-5 w-5" /> {editingTransaction ? 'Editar Transação' : 'Registrar Transação'}
                        </DialogTitle>
                        <p className="text-slate-400 text-xs font-medium">{editingTransaction ? 'Atualize os dados da transação selecionada.' : 'Lance novas receitas ou despesas no fluxo de caixa.'}</p>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição / Título</Label>
                            <Input name="description" defaultValue={editingTransaction?.description} placeholder="Ex: Aluguel da Loja - Abril" className="rounded border-slate-200 h-9 text-sm" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor (R$)</Label>
                                <Input name="amount" type="number" step="0.01" defaultValue={editingTransaction?.amount} placeholder="0.00" className="rounded border-slate-200 h-9 text-sm" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data</Label>
                                <Input name="date" type="date" defaultValue={editingTransaction?.date ? (editingTransaction.date.includes('/') ? editingTransaction.date.split('/').reverse().join('-') : editingTransaction.date) : new Date().toISOString().split('T')[0]} className="rounded border-slate-200 h-9 text-sm" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoria</Label>
                                <Select name="category" defaultValue={editingTransaction?.category || "Outros"}>
                                    <SelectTrigger className="h-9 rounded border-slate-200 text-sm">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Venda">Venda / Serviço</SelectItem>
                                        <SelectItem value="Aluguel">Aluguel / Condomínio</SelectItem>
                                        <SelectItem value="Salários">Salários / Comissões</SelectItem>
                                        <SelectItem value="Fornecedores">Pagamento Fornecedores</SelectItem>
                                        <SelectItem value="Marketing">Marketing / ADS</SelectItem>
                                        <SelectItem value="Utilidades">Luz / Água / Internet</SelectItem>
                                        <SelectItem value="Outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Fluxo</Label>
                                <Select name="type" defaultValue={editingTransaction?.type || "Entrada"}>
                                    <SelectTrigger className="h-9 rounded border-slate-200 text-sm">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Entrada">Entrada (Crédito)</SelectItem>
                                        <SelectItem value="Saída">Saída (Débito)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded h-9 text-xs font-bold uppercase tracking-wider">Cancelar</Button>
                        <Button type="submit" disabled={isSaving} className="rounded bg-slate-900 hover:bg-slate-800 text-white h-9 text-xs font-bold uppercase tracking-wider px-6">
                            {isSaving ? "PROCESSANDO..." : (editingTransaction ? "SALVAR ALTERAÇÕES" : "CONFIRMAR LANÇAMENTO")}
                        </Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Main Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded border-slate-200 shadow-none bg-white">
              <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded bg-slate-50 text-emerald-600 flex items-center justify-center border border-slate-100">
                          <TrendingUp className="h-5 w-5" />
                      </div>
                  </div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Receitas</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ {totalReceitas.toFixed(2)}</h3>
              </CardContent>
          </Card>

          <Card className="rounded border-slate-200 shadow-none bg-white">
              <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded bg-slate-50 text-red-600 flex items-center justify-center border border-slate-100">
                          <TrendingDown className="h-5 w-5" />
                      </div>
                  </div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Despesas</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ {totalDespesas.toFixed(2)}</h3>
              </CardContent>
          </Card>

          <Card className="rounded border-none bg-slate-900 shadow-none text-white">
              <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded bg-white/10 text-white flex items-center justify-center">
                          <DollarSign className="h-5 w-5" />
                      </div>
                  </div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Saldo Atual</p>
                  <h3 className="text-2xl font-bold text-white mt-1">R$ {saldo.toFixed(2)}</h3>
              </CardContent>
          </Card>
      </div>

      <Card className="rounded border-slate-200 shadow-none bg-white mt-6 overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Desempenho de Faturamento</CardTitle>
                  <p className="text-[11px] text-slate-400 font-medium">Comparativo mensal de entradas e saídas (últimos 6 meses)</p>
              </div>
          </CardHeader>
          <CardContent className="p-6">
              <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                              dy={10}
                          />
                          <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                              tickFormatter={(value) => `R$ ${value}`}
                          />
                          <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                              formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                          />
                          <Bar dataKey="entrada" name="Vendas / Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                          <Bar dataKey="saida" name="Custo / Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); localStorage.setItem('financialTab', v); }} className="w-full">
          <TabsList className="bg-transparent p-0 border-b border-slate-200 h-10 w-full justify-start rounded-none gap-8 mb-6">
            <TabsTrigger value="caixa" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="carnes" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Carnês & Parcelas</TabsTrigger>
            <TabsTrigger value="analise-credito" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Análise de Crédito</TabsTrigger>
          </TabsList>

          <TabsContent value="caixa" className="m-0 space-y-4">
            <Card className="rounded border-slate-200 shadow-none overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="relative flex-1 group">
                        <Input
                            placeholder="Buscar transação..."
                            className="pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded h-9 px-4 font-semibold text-xs border-slate-200 text-slate-700 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" /> ESTE MÊS
                        </Button>
                        <Button variant="outline" className="rounded h-9 w-9 p-0 font-semibold border-slate-200 text-slate-700">
                            <Filter className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[700px]">
                        <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoria</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Valor</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Tipo</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Ações</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map((t) => (
                                <TableRow key={t.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors text-[13px]">
                                    <TableCell className="px-6 py-4">
                                        <span className="text-slate-500">{(() => {
                                            if (!t.date) return "---";
                                            if (t.date.includes("-") && t.date.split("-")[0].length === 4) {
                                                const [y, m, d] = t.date.split("-");
                                                return `${d}/${m}/${y}`;
                                            }
                                            return t.date;
                                        })()}</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-3">
                                        <span className="font-semibold text-slate-900 group-hover:text-slate-600 transition-colors">{t.description}</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-3">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-500 whitespace-nowrap">
                                            {t.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`px-6 py-3 text-right font-bold ${t.type === 'Entrada' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {t.type === 'Entrada' ? '+' : '-'} R$ {Math.abs(t.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-center">
                                       <div className={`h-6 w-6 rounded mx-auto flex items-center justify-center ${t.type === 'Entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {t.type === 'Entrada' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                       </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => {
                                                    setEditingTransaction(t);
                                                    setIsDialogOpen(true);
                                                }}
                                                className="h-7 w-7 rounded text-slate-400 hover:text-slate-900"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDeleteTransaction(t.id)}
                                                className="h-7 w-7 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTransactions.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500 font-medium">
                                  Nenhuma transação encontrada.
                                </TableCell>
                              </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carnes" className="m-0 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <div className="relative flex-1 group">
                    <Input
                        placeholder="Buscar por nome do cliente ou ID..."
                        className="pl-9 h-10 bg-white border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all shadow-sm"
                        value={searchTermCarnes}
                        onChange={(e) => setSearchTermCarnes(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="w-full md:w-48">
                    <Select value={filterStatusCarnes} onValueChange={setFilterStatusCarnes}>
                        <SelectTrigger className="h-10 bg-white border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 shadow-sm uppercase font-semibold">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os Status</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Totalmente Pago</SelectItem>
                            <SelectItem value="vencido">Com Vencidos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Installment List */}
                <div className="lg:col-span-8 space-y-4">
                    {groupedInstallments
                      .filter(inst => {
                        const matchesSearch = inst.client.toLowerCase().includes(searchTermCarnes.toLowerCase()) || 
                                              inst.id.toLowerCase().includes(searchTermCarnes.toLowerCase());
                        
                        if (filterStatusCarnes === "todos") return matchesSearch;
                        
                        const hasVencido = inst.installments.some((p: any) => {
                            if (p.status === 'Pago') return false;
                            const hoje = new Date(); hoje.setHours(0,0,0,0);
                            let dueDate: Date;
                            if (p.dueDate?.includes("/")) {
                                const [d, m, y] = p.dueDate.split("/").map(Number);
                                dueDate = new Date(y, m - 1, d);
                            } else {
                                dueDate = new Date(p.dueDate);
                            }
                            return hoje > dueDate;
                        });

                        const isTotalmentePago = inst.remainingValue === 0 && (!inst.downPayment || inst.downPayment.status === 'Pago');

                        if (filterStatusCarnes === "vencido") return matchesSearch && hasVencido;
                        if (filterStatusCarnes === "pago") return matchesSearch && isTotalmentePago;
                        if (filterStatusCarnes === "pendente") return matchesSearch && !isTotalmentePago && !hasVencido;
                        
                        return matchesSearch;
                      })
                      .map((inst) => (
                        <React.Fragment key={inst.id}>
                          <Card className="rounded border-slate-200 shadow-none overflow-hidden bg-white">
                            <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-semibold text-slate-900">{inst.client}</CardTitle>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Atendimento #{inst.id.substring(0,8).toUpperCase()}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" title="Imprimir Carnê" className="h-8 w-8 rounded text-slate-400 hover:text-slate-900" onClick={() => handlePrintCarne(inst.id)}>
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Baixar PDF" className="h-8 w-8 rounded text-slate-400 hover:text-slate-900" onClick={() => handleDownloadCarnePDF(inst.id, inst.client)}>
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Excluir Carnê" className="h-8 w-8 rounded text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteCarne(inst.id, inst.client)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-4 gap-6 p-6 border-b border-slate-50 bg-slate-50/30">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Valor Total Parcelas</p>
                                        <p className="text-base font-bold text-slate-900">R$ {inst.totalValue.toFixed(2)}</p>
                                    </div>
                                    {inst.downPayment && (
                                      <div>
                                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Entrada</p>
                                          <p className={`text-base font-bold ${inst.downPayment.status === 'Pago' ? 'text-emerald-600' : 'text-amber-600'}`}>R$ {inst.downPayment.value.toFixed(2)}</p>
                                      </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Saldo Devedor</p>
                                        <p className="text-base font-bold text-red-600">R$ {inst.remainingValue.toFixed(2)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Progresso</p>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-slate-900" 
                                                style={{ width: `${((inst.totalValue - inst.remainingValue) / (inst.totalValue + (inst.downPayment?.value || 0))) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* CARD DE ENTRADA */}
                                    {inst.downPayment && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Entrada / Sinal</p>
                                            <div className={`p-3 rounded border ${inst.downPayment.status === 'Pago' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/30 border-amber-200'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">Entrada</span>
                                                    <Badge className={`${
                                                  inst.downPayment.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 
                                                  inst.downPayment.status === 'Parcial' ? 'bg-amber-100 text-amber-800' : 'bg-amber-50 text-amber-600'} text-[9px] font-bold shadow-none border-none px-1.5 py-0`}>
                                                  {inst.downPayment.status}
                                              </Badge>
                                                </div>
                                                <p className="font-bold text-slate-900 text-[13px]">R$ {inst.downPayment.value.toFixed(2)}</p>
                                                {inst.downPayment.paidAmount > 0 && inst.downPayment.status !== 'Pago' && (
                                                    <p className="text-[10px] text-emerald-600 font-bold">PAGO: R$ {inst.downPayment.paidAmount.toFixed(2)}</p>
                                                )}
                                                {inst.downPayment.status === 'Pago' || inst.downPayment.status === 'Parcial' ? (
                                                    <div className="mt-1 space-y-1">
                                                        <p className="text-[10px] text-emerald-700 font-semibold">✓ Recebido em {inst.downPayment.receivedAtBr}</p>
                                                        <div className="flex gap-2">
                                                            <Button 
                                                              onClick={() => { setReceivingInstallment(inst.downPayment); setReceivedByName(inst.downPayment.receivedBy || ''); setReceiveAmount(inst.downPayment.value - (inst.downPayment.paidAmount || 0)); }} 
                                                              className="flex-1 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[9px] font-bold uppercase"
                                                              disabled={inst.downPayment.status === 'Pago'}
                                                            >
                                                                Receber Restante
                                                            </Button>
                                                            <Button onClick={() => handleRevertPayment(inst.downPayment)} className="h-6 px-2 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-bold uppercase">
                                                                Estornar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button onClick={() => { setReceivingInstallment(inst.downPayment); setReceivedByName(''); setReceiveAmount(inst.downPayment.value); }} className="w-full mt-2 h-7 rounded bg-amber-600 hover:bg-amber-700 text-[10px] font-semibold text-white">
                                                        Confirmar Recebimento da Entrada
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* CARDS DE PARCELAS */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Parcelas do Carnê</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {inst.installments.map((parc: any) => {
                                                let displayStatus = parc.status;
                                                if (displayStatus !== 'Pago' && parc.dueDate) {
                                                    const hoje = new Date();
                                                    hoje.setHours(0,0,0,0);
                                                    let dueDate: Date;
                                                    if (parc.dueDate.includes("/")) {
                                                        const [d, m, y] = parc.dueDate.split("/").map(Number);
                                                        dueDate = new Date(y, m - 1, d);
                                                    } else {
                                                        dueDate = new Date(parc.dueDate);
                                                    }
                                                    if (hoje > dueDate) displayStatus = 'Vencido';
                                                }
                                                return (
                                                <div key={parc.id} className={`p-3 rounded border ${
                                                    displayStatus === 'Pago' ? 'bg-emerald-50/30 border-emerald-100' :
                                                    displayStatus === 'Vencido' ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-200'
                                                }`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-semibold text-slate-500 uppercase">{parc.number}ª Parcela</span>
                                                        <Badge className={`${
                                                            displayStatus === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                                                            displayStatus === 'Parcial' ? 'bg-amber-100 text-amber-800' :
                                                            displayStatus === 'Vencido' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                                                        } text-[9px] font-bold shadow-none border-none px-1.5 py-0`}>
                                                            {displayStatus}
                                                        </Badge>
                                                    </div>
                                                    <p className="font-bold text-slate-900 text-[13px]">R$ {parc.value.toFixed(2)}</p>
                                                    {parc.paidAmount > 0 && parc.status !== 'Pago' && (
                                                        <p className="text-[10px] text-emerald-600 font-bold">PAGO: R$ {parc.paidAmount.toFixed(2)}</p>
                                                    )}
                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium text-slate-400 uppercase">
                                                        <Calendar className="h-3 w-3" /> Venc: {parc.dueDate || '---'}
                                                    </div>
                                                    {(parc.status === 'Pago' || parc.status === 'Parcial') && (
                                                        <div className="mt-2 space-y-1">
                                                            <p className="text-[10px] text-emerald-700 font-semibold truncate">✓ {parc.receivedAtBr}</p>
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    onClick={() => { setReceivingInstallment(parc); setReceivedByName(parc.receivedBy || ''); setReceiveAmount(parc.value - (parc.paidAmount || 0)); }} 
                                                                    className="flex-1 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[9px] font-bold uppercase"
                                                                    disabled={parc.status === 'Pago'}
                                                                >
                                                                    {parc.status === 'Pago' ? 'Paga' : 'Restante'}
                                                                </Button>
                                                                <Button onClick={() => handleRevertPayment(parc)} className="h-6 px-2 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-bold uppercase">
                                                                    Estornar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {parc.status === 'Pendente' && (
                                                        <Button onClick={() => { setReceivingInstallment(parc); setReceivedByName(''); setReceiveAmount(parc.value); }} className="w-full mt-3 h-7 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold">
                                                            Receber
                                                        </Button>
                                                    )}
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                          </Card>
                          
                          {/* PRINTABLE CARNÊ OVERLAY */}
                          <div id={`printable-carne-${inst.id}`} style={{display: 'none'}}>
                            <style>{`
                              @media print {
                                @page { size: A4; margin: 0; }
                                html, body { width: 210mm !important; min-height: 297mm !important; margin: 0 !important; padding: 0 !important; }
                                body { background: white !important; }
                              }
                            `}</style>
                            <div style={{
                              width: '210mm', 
                              minHeight: '297mm', 
                              padding: '5mm 12mm 10mm 12mm', 
                              backgroundColor: 'white', 
                              color: 'black',
                              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                              display: 'flex',
                              flexDirection: 'column'
                            }}>
                                {/* CABEÇALHO */}
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4mm', borderBottom: '2px solid #000000', marginBottom: '4mm'}}>
                                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <img src="/logo.png" alt="Ótica Melissa" style={{height: '36px', width: 'auto', objectFit: 'contain'}} />
                                    <div>
                                      <p style={{fontSize: '7pt', fontWeight: '800', color: '#000000', letterSpacing: '2px', textTransform: 'uppercase', margin: 0}}>Contrato de Crediário / Carnê</p>
                                    </div>
                                  </div>
                                  <div style={{textAlign: 'right', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px'}}>
                                    <p style={{fontSize: '7pt', color: '#334155', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: 0}}>Atendimento Base</p>
                                    <p style={{fontSize: '11pt', fontWeight: '900', color: '#000000', margin: 0}}>#{inst.id.substring(0, 8).toUpperCase()}</p>
                                  </div>
                                </div>

                                {/* DADOS DO CLIENTE */}
                                <div style={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4mm', marginBottom: '4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                  <div>
                                    <p style={{fontSize: '7pt', fontWeight: '800', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1mm'}}>Dados do Titular</p>
                                    <p style={{fontSize: '11pt', fontWeight: '900', color: '#000000', margin: 0}}>{inst.client}</p>
                                  </div>
                                  <div style={{textAlign: 'right'}}>
                                      <p style={{fontSize: '7pt', fontWeight: '800', color: '#334155', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1mm'}}>Resumo Financeiro</p>
                                      {inst.downPayment && (
                                        <p style={{fontSize: '8pt', fontWeight: '800', color: '#166534', margin: 0}}>Entrada: <span style={{fontWeight: '900'}}>R$ {inst.downPayment.value.toFixed(2)}</span>{inst.downPayment.status === 'Pago' ? ' ✓ Recebida' : ' — Pendente'}</p>
                                      )}
                                      <p style={{fontSize: '8.5pt', fontWeight: '800', color: '#1e293b', margin: 0}}>Total Parcelas: <span style={{fontWeight: '900', color: '#000000'}}>R$ {inst.totalValue.toFixed(2)}</span></p>
                                      <p style={{fontSize: '8.5pt', fontWeight: '800', color: '#991b1b', margin: 0}}>Saldo Devedor: <span style={{fontWeight: '900'}}>R$ {inst.remainingValue.toFixed(2)}</span></p>
                                  </div>
                                </div>

                                {/* LINHA DE ENTRADA NO PDF */}
                                {inst.downPayment && (
                                  <div style={{marginBottom: '4mm', pageBreakInside: 'avoid'}}>
                                    <p style={{fontSize: '7pt', fontWeight: '800', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm', borderBottom: '1px solid #cbd5e1', paddingBottom: '2mm'}}>Entrada / Sinal Inicial</p>
                                    <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt'}}>
                                      <thead>
                                        <tr style={{backgroundColor: '#000000', color: 'white'}}>
                                          <th style={{padding: '2mm 3mm', textAlign: 'left', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Descrição</th>
                                          <th style={{padding: '2mm 3mm', textAlign: 'center', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Data</th>
                                          <th style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Valor</th>
                                          <th style={{padding: '2mm 3mm', textAlign: 'center', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Status</th>
                                          <th style={{padding: '2mm 3mm', textAlign: 'center', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Autenticação / Rubrica</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr style={{backgroundColor: inst.downPayment.status === 'Pago' ? '#f0fdf4' : '#fffbeb', borderBottom: '1px solid #cbd5e1'}}>
                                          <td style={{padding: '2mm 3mm', fontWeight: '800', color: '#000000'}}>Entrada (Sinal)</td>
                                          <td style={{padding: '2mm 3mm', textAlign: 'center', color: '#000000', fontWeight: '700'}}>{inst.downPayment.dueDate || '---'}</td>
                                          <td style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '900', color: '#000000'}}>R$ {inst.downPayment.value.toFixed(2)}</td>
                                          <td style={{padding: '2mm 3mm', textAlign: 'center'}}>
                                            <span style={{padding: '1mm 2mm', borderRadius: '4px', fontSize: '6.5pt', fontWeight: '800', textTransform: 'uppercase', backgroundColor: inst.downPayment.status === 'Pago' ? '#dcfce7' : '#fef3c7', color: inst.downPayment.status === 'Pago' ? '#166534' : '#92400e'}}>
                                              {inst.downPayment.status}
                                            </span>
                                          </td>
                                          <td style={{padding: '2mm 3mm', textAlign: 'center'}}>
                                            {inst.downPayment.status === 'Pago' ? (
                                              <div>
                                                <p style={{color: '#166534', fontWeight: '800', fontSize: '6.5pt', margin: 0}}>✓ RECEBIDO</p>
                                                <p style={{color: '#166534', fontWeight: '600', fontSize: '6pt', margin: '0.5mm 0 0 0'}}>{inst.downPayment.receivedAtBr}</p>
                                                <p style={{color: '#166534', fontWeight: '600', fontSize: '6pt', margin: 0}}>por: {inst.downPayment.receivedBy}</p>
                                              </div>
                                            ) : (
                                              <div>
                                                <div style={{width: '35mm', borderBottom: '1px solid #000', margin: '0 auto 1mm'}}></div>
                                                <p style={{fontSize: '5.5pt', color: '#94a3b8', margin: 0}}>Assinatura do responsável</p>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* TABELA DE PARCELAS */}
                                <div style={{marginBottom: '4mm', flex: 1}}>
                                  <p style={{fontSize: '7pt', fontWeight: '800', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm', borderBottom: '1px solid #cbd5e1', paddingBottom: '2mm'}}>Detalhamento das Parcelas</p>
                                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '9pt'}}>
                                    <thead>
                                      <tr style={{backgroundColor: '#000000', color: 'white'}}>
                                        <th style={{padding: '2mm 3mm', textAlign: 'left', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '4px 0 0 4px'}}>Nº Parcela</th>
                                        <th style={{padding: '2mm 3mm', textAlign: 'center', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Vencimento</th>
                                        <th style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Valor</th>
                                        <th style={{padding: '2mm 3mm', textAlign: 'center', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Status</th>
                                        <th style={{padding: '2mm 3mm', textAlign: 'center', fontWeight: '800', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '0 4px 4px 0'}}>Autenticação / Rubrica (Loja)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {inst.installments.map((parc: any, i: number) => {
                                          let displayStatus = parc.status;
                                          if (displayStatus !== 'Pago' && parc.dueDate) {
                                              const hoje = new Date();
                                              hoje.setHours(0,0,0,0);
                                              let dueDate: Date;
                                              if (parc.dueDate.includes("/")) {
                                                  const [d, m, y] = parc.dueDate.split("/").map(Number);
                                                  dueDate = new Date(y, m - 1, d);
                                              } else {
                                                  dueDate = new Date(parc.dueDate);
                                              }
                                              if (hoje > dueDate) displayStatus = 'Vencido';
                                          }

                                          const formattedDate = (() => {
                                              if (!parc.dueDate) return "---";
                                              if (parc.dueDate.includes("/")) {
                                                  const [d, m, y] = parc.dueDate.split("/").map(Number);
                                                  return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                                              }
                                              return new Date(parc.dueDate).toLocaleDateString('pt-BR');
                                          })();

                                          return (
                                            <tr key={parc.id} style={{borderBottom: '1px solid #cbd5e1', backgroundColor: displayStatus === 'Pago' ? '#f0fdf4' : (i % 2 === 0 ? '#ffffff' : '#f8fafc'), pageBreakInside: 'avoid'}}>
                                              <td style={{padding: '2mm 3mm', fontWeight: '800', color: '#000000'}}>Parcela {parc.number} / {parc.totalInstallments}</td>
                                              <td style={{padding: '2mm 3mm', textAlign: 'center', color: '#000000', fontWeight: '700'}}>{formattedDate}</td>
                                              <td style={{padding: '2mm 3mm', textAlign: 'right', fontWeight: '900', color: '#000000'}}>R$ {parc.value.toFixed(2)}</td>
                                              <td style={{padding: '2mm 3mm', textAlign: 'center'}}>
                                                  <span style={{
                                                      padding: '1mm 2mm', 
                                                      borderRadius: '4px', 
                                                      fontSize: '6.5pt', 
                                                      fontWeight: '800', 
                                                      textTransform: 'uppercase',
                                                      backgroundColor: displayStatus === 'Pago' ? '#dcfce7' : displayStatus === 'Vencido' ? '#fee2e2' : '#f1f5f9',
                                                      color: displayStatus === 'Pago' ? '#166534' : displayStatus === 'Vencido' ? '#991b1b' : '#475569'
                                                  }}>
                                                      {displayStatus}
                                                  </span>
                                              </td>
                                              <td style={{padding: '2mm 3mm', textAlign: 'center'}}>
                                                  {displayStatus === 'Pago' ? (
                                                      <div>
                                                        <p style={{color: '#166534', fontWeight: '800', fontSize: '7pt', margin: 0}}>✓ PAGO</p>
                                                        {parc.receivedAtBr && <p style={{color: '#166534', fontWeight: '600', fontSize: '6pt', margin: '0.5mm 0 0 0'}}>{parc.receivedAtBr}</p>}
                                                        {parc.receivedBy && <p style={{color: '#166534', fontWeight: '600', fontSize: '6pt', margin: 0}}>por: {parc.receivedBy}</p>}
                                                        {!parc.receivedBy && <p style={{color: '#166534', fontWeight: '600', fontSize: '6pt', margin: '0.5mm 0 0 0'}}>Sistema</p>}
                                                      </div>
                                                  ) : (
                                                      <div>
                                                        <div style={{width: '35mm', borderBottom: '1px solid #000', margin: '0 auto 1mm'}}></div>
                                                        <p style={{fontSize: '5.5pt', color: '#94a3b8', margin: 0}}>Assinatura / Carimbo</p>
                                                      </div>
                                                  )}
                                              </td>
                                            </tr>
                                          );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* TERMOS E ASSINATURAS */}
                                <div style={{marginTop: 'auto', borderTop: '2px dashed #94a3b8', paddingTop: '4mm', pageBreakInside: 'avoid'}}>
                                  <p style={{fontSize: '7.5pt', color: '#000000', textAlign: 'justify', lineHeight: '1.4', marginBottom: '4mm', fontWeight: '500'}}>
                                    Reconheço e concordo com a dívida referente aos itens adquiridos na Ótica Melissa, constante no atendimento supracitado, comprometendo-me a pagar as parcelas detalhadas acima até as respectivas datas de vencimento. O atraso no pagamento poderá acarretar multa e juros conforme a legislação vigente, além da possível inclusão nos órgãos de proteção ao crédito. Este carnê é pessoal e intransferível.
                                  </p>
                                  <div style={{display: 'flex', justifyContent: 'space-around', paddingTop: '1mm'}}>
                                    <div style={{textAlign: 'center', width: '70mm'}}>
                                      <div style={{borderBottom: '1px solid #000000', marginBottom: '2mm', height: '10mm'}}></div>
                                      <p style={{fontSize: '6.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#334155', margin: 0}}>Assinatura do Titular</p>
                                      <p style={{fontSize: '6pt', color: '#334155', margin: '1mm 0 0 0', fontWeight: '700'}}>{inst.client}</p>
                                    </div>
                                    <div style={{textAlign: 'center', width: '70mm'}}>
                                      <div style={{borderBottom: '1px solid #000000', marginBottom: '2mm', height: '10mm'}}></div>
                                      <p style={{fontSize: '6.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#334155', margin: 0}}>Ótica Melissa — Crediário</p>
                                    </div>
                                  </div>
                                </div>

                                {/* RODAPÉ */}
                                <div style={{marginTop: '4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                  <p style={{fontSize: '6.5pt', color: '#94a3b8', margin: 0}}>Documento gerado pelo sistema Ótica Melissa</p>
                                  <p style={{fontSize: '6.5pt', color: '#94a3b8', margin: 0}}>Impresso em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                                </div>
                            </div>
                          </div>
                        </React.Fragment>
                    ))}
                    {groupedInstallments.length === 0 && (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded">
                            Nenhum carnê ou parcelamento encontrado no sistema.
                        </div>
                    )}
                </div>

                {/* Performance & Filters */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded border-slate-200 shadow-none bg-white">
                        <CardHeader className="px-6 py-4 border-b border-slate-100">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saúde da Carteira</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                                    <span>Adimplência (Recebido)</span>
                                    <span className="text-emerald-600">{walletStats.adimplencia}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-emerald-500" style={{ width: `${walletStats.adimplencia}%` }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                                    <span>Inadimplência (Atraso)</span>
                                    <span className="text-red-600">{walletStats.inadimplencia}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-red-500" style={{ width: `${walletStats.inadimplencia}%` }} />
                                </div>
                            </div>
                            <Separator className="bg-slate-100" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <AlertCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">{walletStats.overdueCount} Parcelas Vencidas</p>
                                        <p className="text-[10px] text-slate-400">Total em Atraso: R$ {walletStats.overdueTotal.toFixed(2)}</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => setIsDebtorsDialogOpen(true)}
                                    className="w-full rounded bg-amber-500 hover:bg-amber-600 font-bold text-xs h-9"
                                >
                                    COBRAR DEVEDORES
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded border-slate-200 shadow-none bg-white border-dashed">
                        <CardContent className="p-8 space-y-4 text-center">
                            <div className="h-10 w-10 rounded bg-slate-900 text-white flex items-center justify-center mx-auto">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Emissão de Carnê</h3>
                                <p className="text-[11px] text-slate-500 mt-1">Caso tenha excluído um carnê, você pode reemitir selecionando o atendimento abaixo.</p>
                            </div>
                            <Button 
                                onClick={() => setIsIssuanceDialogOpen(true)}
                                variant="outline" 
                                className="w-full rounded font-semibold text-xs h-9 border-slate-200"
                            >
                                REEMITIR CARNÊ
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* DIALOG DE DEVEDORES */}
            <Dialog open={isDebtorsDialogOpen} onOpenChange={setIsDebtorsDialogOpen}>
                <DialogContent className="max-w-2xl !rounded-none p-0 overflow-hidden">
                    <DialogHeader className="bg-amber-500 p-6 text-white border-b border-amber-600">
                        <DialogTitle className="text-lg font-bold flex items-center gap-3 uppercase tracking-wider">
                            <AlertCircle className="h-6 w-6" /> Lista de Devedores (Atraso)
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                        {walletStats.debtors.length > 0 ? walletStats.debtors.map((debtor: any) => (
                            <div key={debtor.id} className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50/50 rounded transition-all hover:bg-white hover:shadow-sm">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{debtor.name}</p>
                                    <p className="text-[10px] font-semibold text-red-600 uppercase tracking-widest">{debtor.count} parcelas vencidas • R$ {debtor.totalOverdue.toFixed(2)}</p>
                                </div>
                                <Button 
                                    onClick={() => {
                                        const msg = window.encodeURIComponent(`Olá ${debtor.name}, notamos que você possui parcelas em aberto na Ótica Melissa. Gostaria de verificar as formas de quitação?`);
                                        window.open(`https://wa.me/55${debtor.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                    }}
                                    className="rounded bg-emerald-600 hover:bg-emerald-700 font-bold text-[10px] h-8 px-4"
                                >
                                    COBRAR NO WHATSAPP
                                </Button>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-400 font-medium">Nenhum devedor em atraso no momento! 🎉</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* DIALOG DE EMISSÃO DE CARNÊ */}
            <Dialog open={isIssuanceDialogOpen} onOpenChange={setIsIssuanceDialogOpen}>
                <DialogContent className="max-w-3xl !rounded-none p-0 overflow-hidden">
                    <DialogHeader className="bg-slate-900 p-6 text-white">
                        <DialogTitle className="text-lg font-bold flex items-center gap-3 uppercase tracking-wider">
                            <FileText className="h-6 w-6" /> Emitir Novo Carnê
                        </DialogTitle>
                        <p className="text-xs text-slate-400 mt-1">Selecione uma venda (atendimento) que seja do tipo 'Carnê' para gerar as parcelas.</p>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                        {atendimentos
                            .filter(a => a.paymentMethod === 'carne' && !groupedInstallments.some(g => g.id === a.id))
                            .map((atend) => (
                            <div key={atend.id} className="flex items-center justify-between p-4 border border-slate-100 bg-white rounded hover:border-slate-300 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{atend.clientName}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Atendimento #{atend.tso || atend.id.slice(0,6)} • {atend.date}</p>
                                    <p className="text-[10px] font-bold text-slate-900 mt-0.5">Total: R$ {atend.totalValue?.toFixed(2)} ({atend.installmentsCount}x de R$ {((atend.totalValue - (atend.entrada || 0)) / (atend.installmentsCount || 1)).toFixed(2)})</p>
                                </div>
                                <Button 
                                    onClick={() => handleIssueCarne(atend)}
                                    className="rounded bg-slate-900 hover:bg-slate-800 font-bold text-[10px] h-8 px-4"
                                >
                                    GERAR CARNÊ
                                </Button>
                            </div>
                        ))}
                        {atendimentos.filter(a => a.paymentMethod === 'carne' && !groupedInstallments.some(g => g.id === a.id)).length === 0 && (
                            <div className="p-12 text-center text-slate-400 italic">
                                Todos os atendimentos em carnê já possuem parcelas geradas ou nenhum atendimento em carnê foi encontrado.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="analise-credito" className="m-0 space-y-6">
            <Card className="rounded border-slate-200 shadow-none overflow-hidden bg-white">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="relative flex-1 group">
                        <Input
                            placeholder="Buscar cliente por nome ou CPF..."
                            className="pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cliente</TableHead>
                                    <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Status de Crédito</TableHead>
                                    <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Motivo / Histórico</TableHead>
                                    <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients
                                    .filter(c => !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm))
                                    .map((client) => {
                                        const score = calculateCreditScore(client, rawInstallments);
                                        return (
                                            <TableRow key={client.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors text-[13px]">
                                                <TableCell className="px-6 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900">{client.name}</span>
                                                        <span className="text-[10px] text-slate-500">{client.cpf}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge className={`
                                                            ${getCreditStatusColor(score.status)}
                                                            border-none shadow-none font-bold uppercase tracking-wider text-[9px] px-2 py-0.5
                                                        `}>
                                                            {score.status}
                                                        </Badge>
                                                        {score.isManual && (
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                <UserCheck className="h-2 w-2" /> OVERRIDE MANUAL
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-3">
                                                    <span className="text-xs text-slate-600">{score.reason}</span>
                                                </TableCell>
                                                <TableCell className="px-6 py-3 text-center">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingCreditClient(client);
                                                            setNewCreditStatus(client.manualCreditStatus || "auto");
                                                            setNewCreditReason(client.creditStatusReason || "");
                                                            setIsCreditDialogOpen(true);
                                                        }}
                                                        className="h-8 text-[10px] font-bold text-slate-500 hover:text-slate-900 border-slate-200"
                                                    >
                                                        <Edit className="h-3.5 w-3.5 mr-1" /> ANALISAR
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* DIALOG DE OVERRIDE */}
            <Dialog open={isCreditDialogOpen && !!editingCreditClient} onOpenChange={(open) => {
                if (!open) {
                    setEditingCreditClient(null);
                    setIsCreditDialogOpen(false);
                }
            }}>
                <DialogContent className="w-full sm:max-w-[95vw] md:max-w-[1100px] !rounded-none border-slate-200 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800">
                        <DialogTitle className="text-lg font-semibold flex items-center gap-3">
                            <ShieldAlert className="h-5 w-5" /> Análise de Crédito — {editingCreditClient?.name}
                        </DialogTitle>
                        <p className="text-slate-400 text-xs font-medium mt-1">Visualize o histórico e justifique alterações manuais de score.</p>
                    </DialogHeader>
                    
                    <form onSubmit={handleSaveCreditOverride}>
                        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[75vh] md:max-h-[85vh] overflow-y-auto md:overflow-hidden bg-white w-full">
                            {/* LADO ESQUERDO: REGRAS E OVERRIDE */}
                            <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-start md:overflow-y-auto space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status pelo Algoritmo</p>
                                        <Badge className={`${getCreditStatusColor(editingCreditClient && !editingCreditClient.manualCreditStatus ? calculateCreditScore(editingCreditClient, rawInstallments).status : calculateCreditScore({...editingCreditClient, manualCreditStatus: null}, rawInstallments).status)} border-none shadow-none text-xs px-3 py-1 uppercase tracking-widest`}>
                                            {editingCreditClient && !editingCreditClient.manualCreditStatus ? calculateCreditScore(editingCreditClient, rawInstallments).status : calculateCreditScore({...editingCreditClient, manualCreditStatus: null}, rawInstallments).status}
                                        </Badge>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Checklist de Requisitos</p>
                                        
                                        {(() => {
                                            const clientInsts = editingCreditClient ? rawInstallments.filter(i => i.clientId === editingCreditClient.id && !i.isDownPayment) : [];
                                            const today = new Date(); today.setHours(0, 0, 0, 0);
                                            let hasOverdue30 = false; let hasOverdue = false; let hasPaid = false;
                                            clientInsts.forEach(inst => {
                                                if (inst.status === "Pago" || inst.status === "Paga") hasPaid = true;
                                                else if (inst.status === "Pendente" && inst.dueDate) {
                                                    const [d, m, y] = inst.dueDate.split("/");
                                                    if (d && m && y) {
                                                        const diffDays = Math.ceil((today.getTime() - new Date(Number(y), Number(m) - 1, Number(d)).getTime()) / (1000 * 60 * 60 * 24));
                                                        if (diffDays > 0) { hasOverdue = true; if (diffDays > 30) hasOverdue30 = true; }
                                                    }
                                                }
                                            });

                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        {!hasOverdue30 ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                                                        <span className="text-[11px] font-medium text-slate-700">Não possuir atrasos severos ({'>'}30 dias) <br/> <span className="text-[9px] text-slate-400 font-normal">Essencial para evitar Inadimplência.</span></span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        {!hasOverdue ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                                                        <span className="text-[11px] font-medium text-slate-700">Não possuir nenhum atraso pendente <br/> <span className="text-[9px] text-slate-400 font-normal">Essencial para evitar status de Atenção.</span></span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        {hasPaid ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                                                        <span className="text-[11px] font-medium text-slate-700">Ter histórico de parcelas pagas <br/> <span className="text-[9px] text-slate-400 font-normal">Essencial para atingir o status Excelente.</span></span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    
                                    <div className="space-y-1.5 pt-4 border-t border-slate-100">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Substituir Status Manualmente</Label>
                                        <Select value={newCreditStatus} onValueChange={setNewCreditStatus}>
                                            <SelectTrigger className="rounded border-slate-200 h-9 font-medium text-xs text-slate-600 bg-white">
                                                <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded border-slate-200 shadow-2xl text-xs">
                                                <SelectItem value="auto" className="font-bold">Usar Algoritmo Automático</SelectItem>
                                                <SelectItem value="Excelente">Excelente</SelectItem>
                                                <SelectItem value="Bom">Bom</SelectItem>
                                                <SelectItem value="Em Análise">Em Análise</SelectItem>
                                                <SelectItem value="Atenção">Atenção</SelectItem>
                                                <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {newCreditStatus !== "auto" && (
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Motivo / Observação da Mudança</Label>
                                            <Input 
                                                value={newCreditReason} 
                                                onChange={(e) => setNewCreditReason(e.target.value)} 
                                                placeholder="Justifique a sobreposição..." 
                                                className="rounded border-slate-200 h-9 text-sm" 
                                                required={newCreditStatus !== "auto"} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* LADO DIREITO: HISTÓRICO DE PARCELAS */}
                            <div className="p-0 bg-slate-50 flex flex-col h-[500px] md:h-full md:max-h-full min-h-[400px]">
                                <div className="p-6 border-b border-slate-200 bg-white">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Histórico de Movimentações</p>
                                </div>
                                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                                    {(() => {
                                        const clientInsts = editingCreditClient ? rawInstallments.filter(i => i.clientId === editingCreditClient.id && !i.isDownPayment) : [];
                                        if (clientInsts.length === 0) {
                                            return <p className="text-xs text-slate-400 text-center mt-10">Nenhuma parcela cadastrada no histórico deste cliente.</p>;
                                        }

                                        const sorted = clientInsts.sort((a,b) => {
                                            const [d1,m1,y1] = (a.dueDate || "01/01/2000").split("/");
                                            const [d2,m2,y2] = (b.dueDate || "01/01/2000").split("/");
                                            return new Date(Number(y1), Number(m1)-1, Number(d1)).getTime() - new Date(Number(y2), Number(m2)-1, Number(d2)).getTime();
                                        });

                                        const today = new Date(); today.setHours(0,0,0,0);

                                        return sorted.map((inst) => {
                                            const isPaid = inst.status === "Pago" || inst.status === "Paga";
                                            let isLate = false;
                                            if (!isPaid && inst.dueDate) {
                                                const [d,m,y] = inst.dueDate.split("/");
                                                if (new Date(Number(y), Number(m)-1, Number(d)) < today) isLate = true;
                                            }

                                            return (
                                                <div key={inst.id} className={`p-3 rounded border text-xs flex justify-between items-center ${isPaid ? 'bg-emerald-50/50 border-emerald-100' : isLate ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-200'}`}>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold text-slate-700">Parcela {inst.number}/{inst.totalInstallments}</span>
                                                        <span className="text-[10px] text-slate-500">Vencimento: {inst.dueDate}</span>
                                                        {isPaid && inst.receivedAtBr && <span className="text-[9px] text-emerald-600 font-medium">Paga em: {inst.receivedAtBr}</span>}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="font-bold text-slate-900">R$ {inst.value?.toFixed(2)}</span>
                                                        <Badge className={`border-none shadow-none text-[9px] uppercase px-1.5 py-0 ${isPaid ? 'bg-emerald-100 text-emerald-700' : isLate ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {isPaid ? "Paga" : isLate ? "Atrasada" : "Pendente"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3 !rounded-none">
                            <Button type="button" variant="ghost" className="!rounded-none px-6 font-semibold text-slate-500 text-xs h-10 hover:bg-slate-100" onClick={() => { setIsCreditDialogOpen(false); setEditingCreditClient(null); }}>CANCELAR</Button>
                            <Button type="submit" disabled={isSaving} className="!rounded-none bg-slate-900 hover:bg-slate-800 text-white px-8 font-semibold text-xs h-10 shadow-lg">
                                {isSaving ? "SALVANDO..." : "SALVAR ALTERAÇÃO"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
          </TabsContent>
      </Tabs>

        {/* PRINTABLE CASHFLOW AREA (HIDDEN) */}
        <div id="printable-cashflow" style={{ display: 'none' }}>
            <div style={{ padding: '10mm', fontFamily: 'sans-serif', color: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '5mm', marginBottom: '8mm' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 'bold' }}>Relatório de Fluxo de Caixa</h1>
                        <p style={{ margin: '2mm 0 0 0', fontSize: '10pt', color: '#666' }}>Ótica Melissa — Gestão Administrativa</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '9pt' }}>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                        <p style={{ margin: '1mm 0 0 0', fontSize: '9pt' }}>Período: Completo</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10mm', marginBottom: '10mm' }}>
                    <div style={{ padding: '4mm', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '8pt', color: '#666', textTransform: 'uppercase' }}>Total Receitas</p>
                        <p style={{ margin: '1mm 0 0 0', fontSize: '14pt', fontWeight: 'bold', color: '#166534' }}>R$ {totalReceitas.toFixed(2)}</p>
                    </div>
                    <div style={{ padding: '4mm', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '8pt', color: '#666', textTransform: 'uppercase' }}>Total Despesas</p>
                        <p style={{ margin: '1mm 0 0 0', fontSize: '14pt', fontWeight: 'bold', color: '#991b1b' }}>R$ {totalDespesas.toFixed(2)}</p>
                    </div>
                    <div style={{ padding: '4mm', background: '#000', color: '#fff', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '8pt', color: '#ccc', textTransform: 'uppercase' }}>Saldo Final</p>
                        <p style={{ margin: '1mm 0 0 0', fontSize: '14pt', fontWeight: 'bold' }}>R$ {saldo.toFixed(2)}</p>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                            <th style={{ padding: '3mm', textAlign: 'left' }}>Data</th>
                            <th style={{ padding: '3mm', textAlign: 'left' }}>Descrição</th>
                            <th style={{ padding: '3mm', textAlign: 'left' }}>Categoria</th>
                            <th style={{ padding: '3mm', textAlign: 'center' }}>Tipo</th>
                            <th style={{ padding: '3mm', textAlign: 'right' }}>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...transactions].sort((a, b) => {
                            const dateA = a.date?.includes('/') ? a.date.split('/').reverse().join('') : a.date;
                            const dateB = b.date?.includes('/') ? b.date.split('/').reverse().join('') : b.date;
                            return dateB.localeCompare(dateA);
                        }).map((t, idx) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                                <td style={{ padding: '3mm' }}>{t.date}</td>
                                <td style={{ padding: '3mm', fontWeight: 'bold' }}>{t.description}</td>
                                <td style={{ padding: '3mm' }}>{t.category}</td>
                                <td style={{ padding: '3mm', textAlign: 'center', color: t.type === 'Entrada' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>{t.type}</td>
                                <td style={{ padding: '3mm', textAlign: 'right', fontWeight: 'bold' }}>R$ {Number(t.amount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: '10mm', paddingTop: '5mm', borderTop: '1px solid #ddd', fontSize: '8pt', color: '#991b1b', textAlign: 'center' }}>
                    Ótica Melissa — Relatório Administrativo Interno
                </div>
            </div>
        </div>
    </div>
  );
}
