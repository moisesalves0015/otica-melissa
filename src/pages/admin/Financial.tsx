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
  Printer,
  History,
  QrCode,
  Plus,
  Search,
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
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";

export default function Financial() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [groupedInstallments, setGroupedInstallments] = React.useState<any[]>([]);
  const [receivingInstallment, setReceivingInstallment] = React.useState<any>(null);
  const [receivedByName, setReceivedByName] = React.useState("");

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
                if (inst.status !== 'Pago') {
                    groups[inst.atendimentoId].remainingValue += inst.value;
                }
            } else {
                groups[inst.atendimentoId].installments.push(inst);
                groups[inst.atendimentoId].totalValue += inst.value;
                if (inst.status !== 'Pago') {
                    groups[inst.atendimentoId].remainingValue += inst.value;
                }
            }
        });

        const groupsArray = Object.values(groups).map((g: any) => {
            // Ordenar as parcelas por número
            g.installments.sort((a: any, b: any) => a.number - b.number);
            return g;
        });

        setGroupedInstallments(groupsArray);
    });

    return () => {
        unsubTrans();
        unsubInst();
    };
  }, []);

  const handleReceiveInstallment = async () => {
      if (!receivingInstallment || !receivedByName.trim()) {
          toast.error("Informe quem está recebendo o pagamento.");
          return;
      }
      try {
          const now = new Date();
          const receivedAt = now.toISOString();
          const receivedAtBr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          // Atualiza status da parcela
          const docRef = doc(db, "installments", receivingInstallment.id);
          await updateDoc(docRef, {
              status: 'Pago',
              receivedBy: receivedByName,
              receivedAt: receivedAt,
              receivedAtBr: receivedAtBr,
          });

          const label = receivingInstallment.isDownPayment
              ? `Entrada (Carnê) - ${receivingInstallment.clientName}`
              : `Parcela ${receivingInstallment.number}/${receivingInstallment.totalInstallments} - ${receivingInstallment.clientName}`;

          // Lança entrada no fluxo de caixa
          await addDoc(collection(db, "financial_transactions"), {
            description: label,
            amount: receivingInstallment.value,
            date: now.toLocaleDateString('pt-BR'),
            category: receivingInstallment.isDownPayment ? "Entrada Carnê" : "Recebimento Carnê",
            type: "Entrada",
            paymentMethod: "Dinheiro/Pix",
            receivedBy: receivedByName,
            createdAt: receivedAt,
          });

          toast.success("Recebimento confirmado e lançado no caixa!");
          setReceivingInstallment(null);
          setReceivedByName("");
      } catch (err: any) {
          toast.error("Erro ao receber: " + err.message);
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const amount = Number(data.amount) || 0;
      let transactionDate = data.date ? String(data.date) : new Date().toISOString().split('T')[0];
      
      // Se a data vier no formato YYYY-MM-DD do input type="date", converter para DD/MM/YYYY
      if (transactionDate.includes("-") && transactionDate.split("-")[0].length === 4) {
        const [y, m, d] = transactionDate.split("-");
        transactionDate = `${d}/${m}/${y}`;
      }

      await addDoc(collection(db, "financial_transactions"), {
        description: data.description || "",
        amount: amount,
        date: transactionDate,
        category: data.category || "Não definida",
        type: data.type || "Entrada",
        createdAt: new Date().toISOString(),
      });
      
      toast.success("Transação registrada!");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
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
              <p className="text-sm text-slate-500">Valor: <strong className="text-slate-900">R$ {receivingInstallment.value?.toFixed(2)}</strong></p>
              {!receivingInstallment.isDownPayment && <p className="text-sm text-slate-500">Vencimento: <strong>{receivingInstallment.dueDate}</strong></p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recebido por *</label>
              <input
                type="text"
                value={receivedByName}
                onChange={e => setReceivedByName(e.target.value)}
                placeholder="Nome do responsável pelo recebimento"
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                onKeyDown={e => e.key === 'Enter' && handleReceiveInstallment()}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setReceivingInstallment(null); setReceivedByName(''); }}
                className="flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-2 hover:bg-slate-50"
              >CANCELAR</button>
              <button
                onClick={handleReceiveInstallment}
                disabled={!receivedByName.trim()}
                className="flex-1 bg-slate-900 text-white font-bold text-xs py-2 hover:bg-slate-800 disabled:opacity-40"
              >CONFIRMAR RECEBIMENTO</button>
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
            <Button variant="outline" className="rounded border-slate-200 text-slate-600 font-semibold text-xs h-9 px-4 flex items-center gap-2">
                <Download className="h-4 w-4" /> EXPORTAR
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 px-4 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> NOVA TRANSAÇÃO
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-[600px] rounded border-slate-200 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="bg-slate-900 p-6 text-white border-b border-slate-800">
                        <DialogTitle className="text-lg font-semibold flex items-center gap-3">
                            <DollarSign className="h-5 w-5" /> Registrar Transação
                        </DialogTitle>
                        <p className="text-slate-400 text-xs font-medium">Lance novas receitas ou despesas no fluxo de caixa.</p>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição / Título</Label>
                            <Input name="description" placeholder="Ex: Aluguel da Loja - Abril" className="rounded border-slate-200 h-9 text-sm" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor (R$)</Label>
                                <Input name="amount" type="number" step="0.01" placeholder="0,00" className="rounded border-slate-200 h-9 text-sm" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data do Lançamento</Label>
                                <Input name="date" type="date" className="rounded border-slate-200 h-9 text-sm" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoria</Label>
                                <Select name="category" defaultValue="Venda de Produto">
                                    <SelectTrigger className="rounded border-slate-200 h-9 font-medium text-xs text-slate-600 bg-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded border-slate-200 shadow-2xl text-xs">
                                        <SelectItem value="Venda de Produto">Venda de Produto</SelectItem>
                                        <SelectItem value="Serviço / Mão de Obra">Serviço / Mão de Obra</SelectItem>
                                        <SelectItem value="Custo Fixo (Aluguel/Luz)">Custo Fixo (Aluguel/Luz)</SelectItem>
                                        <SelectItem value="Compra de Estoque">Compra de Estoque</SelectItem>
                                        <SelectItem value="Marketing / Ads">Marketing / Ads</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Fluxo</Label>
                                <Select name="type" defaultValue="Entrada">
                                    <SelectTrigger className="rounded border-slate-200 h-9 font-medium text-xs text-slate-600 bg-white">
                                        <SelectValue placeholder="Tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded border-slate-200 shadow-2xl text-xs">
                                        <SelectItem value="Entrada" className="text-emerald-600 font-bold">ENTRADA (+)</SelectItem>
                                        <SelectItem value="Saída" className="text-red-600 font-bold">SAÍDA (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" className="rounded px-4 font-semibold text-slate-500 text-xs h-9" onClick={() => setIsDialogOpen(false)}>CANCELAR</Button>
                        <Button type="submit" disabled={isSaving} className="rounded bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold text-xs h-9">
                          {isSaving ? "SALVANDO..." : "EFETUAR LANÇAMENTO"}
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

      <Tabs defaultValue="caixa" className="w-full">
          <TabsList className="bg-transparent p-0 border-b border-slate-200 h-10 w-full justify-start rounded-none gap-8 mb-6">
            <TabsTrigger value="caixa" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="carnes" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Carnês & Parcelas</TabsTrigger>
            <TabsTrigger value="relatorios" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none">Relatórios</TabsTrigger>
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
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categoria</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Valor</TableHead>
                            <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">Tipo</TableHead>
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
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carnes" className="m-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Installment List */}
                <div className="lg:col-span-8 space-y-4">
                    {groupedInstallments.map((inst) => (
                        <React.Fragment key={inst.id}>
                          <Card className="rounded border-slate-200 shadow-none overflow-hidden bg-white">
                            <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-semibold text-slate-900">{inst.client}</CardTitle>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Atendimento #{inst.id.substring(0,8).toUpperCase()}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-slate-400 hover:text-slate-900" onClick={() => handlePrintCarne(inst.id)}>
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-slate-400">
                                        <QrCode className="h-3.5 w-3.5" />
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
                                                    <Badge className={`${inst.downPayment.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} text-[9px] font-bold shadow-none border-none px-1.5 py-0`}>
                                                        {inst.downPayment.status}
                                                    </Badge>
                                                </div>
                                                <p className="font-bold text-slate-900 text-[13px]">R$ {inst.downPayment.value.toFixed(2)}</p>
                                                {inst.downPayment.status === 'Pago' ? (
                                                    <div className="mt-1 space-y-0.5">
                                                        <p className="text-[10px] text-emerald-700 font-semibold">✓ Recebido em {inst.downPayment.receivedAtBr}</p>
                                                        <p className="text-[10px] text-emerald-600">por {inst.downPayment.receivedBy}</p>
                                                    </div>
                                                ) : (
                                                    <Button onClick={() => { setReceivingInstallment(inst.downPayment); setReceivedByName(''); }} className="w-full mt-2 h-7 rounded bg-amber-600 hover:bg-amber-700 text-[10px] font-semibold text-white">
                                                        Confirmar Recebimento da Entrada
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* CARDS DE PARCELAS */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Parcelas do Carnê</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                                                            displayStatus === 'Vencido' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                                                        } text-[9px] font-bold shadow-none border-none px-1.5 py-0`}>
                                                            {displayStatus}
                                                        </Badge>
                                                    </div>
                                                    <p className="font-bold text-slate-900 text-[13px]">R$ {parc.value.toFixed(2)}</p>
                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium text-slate-400 uppercase">
                                                        <Calendar className="h-3 w-3" /> Venc: {parc.dueDate || '---'}
                                                    </div>
                                                    {parc.status === 'Pago' && parc.receivedBy && (
                                                        <div className="mt-1 space-y-0.5">
                                                            <p className="text-[10px] text-emerald-700 font-semibold">✓ {parc.receivedAtBr}</p>
                                                            <p className="text-[10px] text-emerald-600">por {parc.receivedBy}</p>
                                                        </div>
                                                    )}
                                                    {parc.status !== 'Pago' && (
                                                        <Button onClick={() => { setReceivingInstallment(parc); setReceivedByName(''); }} className="w-full mt-3 h-7 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold">
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
                              padding: '10mm 12mm', 
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
                                            <tr key={parc.id} style={{borderBottom: '1px solid #cbd5e1', backgroundColor: displayStatus === 'Pago' ? '#f0fdf4' : (i % 2 === 0 ? '#ffffff' : '#f8fafc')}}>
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
                                    <span>Adimplência</span>
                                    <span className="text-emerald-600">92%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-emerald-500" style={{ width: '92%' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                                    <span>Inadimplência</span>
                                    <span className="text-red-600">8%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-red-500" style={{ width: '8%' }} />
                                </div>
                            </div>
                            <Separator className="bg-slate-100" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <AlertCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">12 Parcelas Vencidas</p>
                                        <p className="text-[10px] text-slate-400">Total: R$ 1.850,00</p>
                                    </div>
                                </div>
                                <Button className="w-full rounded bg-amber-500 hover:bg-amber-600 font-bold text-xs h-9">COBRAR DEVEDORES</Button>
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
                                <p className="text-[11px] text-slate-500 mt-1">Gere o documento completo com boletos ou QR Code Pix.</p>
                            </div>
                            <Button variant="outline" className="w-full rounded font-semibold text-xs h-9 border-slate-200">SELECIONAR VENDA</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}

