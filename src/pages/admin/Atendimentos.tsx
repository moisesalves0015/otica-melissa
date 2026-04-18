import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { collection, addDoc, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { 
    Search, User, Printer, Clock, Activity, ShoppingCart, 
    DollarSign, FileText, Plus, Trash2, ChevronDown, ChevronUp, Scissors
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface OrderSession {
    id: string;
    serviceType: string;
    items: string;
    dueDate: string;
    labNotes: string;
    price: number;
    expanded: boolean;
    orderCode: string;
    supplier: string;
}

export default function Atendimentos() {
  const [activeTab, setActiveTab] = React.useState("novo");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [atendentes, setAtendentes] = React.useState<any[]>([]);
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);

  // State for Print
  const [printData, setPrintData] = React.useState<any>(null);

  // --- SESSION STATE ---
  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [attendant, setAttendant] = React.useState("");
  const [prescription, setPrescription] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [sessionOrders, setSessionOrders] = React.useState<OrderSession[]>([]);

  // --- PAYMENT STATE ---
  const [paymentMethod, setPaymentMethod] = React.useState("pix");
  const [entrada, setEntrada] = React.useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = React.useState<number>(1);
  const [firstDueDate, setFirstDueDate] = React.useState<string>("");

  React.useEffect(() => {
    const qAtend = query(collection(db, "atendimentos"));
    const unsubAtend = onSnapshot(qAtend, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setAtendimentos(data);
    });

    const qClients = query(collection(db, "clients"));
    const unsubClients = onSnapshot(qClients, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(data);
    });

    const unsubAtendentes = onSnapshot(query(collection(db, "atendentes")), (snap) => {
      setAtendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubForn = onSnapshot(query(collection(db, "fornecedores")), (snap) => {
      setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAtend();
      unsubClients();
      unsubAtendentes();
      unsubForn();
    };
  }, []);

  const formatDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/(\d{2})(\d)/, "$1/$2")
            .replace(/(\d{2})(\d)/, "$1/$2");
  };

  const totalGeral = sessionOrders.reduce((acc, curr) => acc + curr.price, 0);
  const saldoDevedor = Math.max(0, totalGeral - entrada);
  const isCarne = paymentMethod === "carne";

  const handleAddOrder = () => {
      setSessionOrders([...sessionOrders, {
          id: Math.random().toString(36).substr(2, 9),
          serviceType: "Óculos Completo",
          items: "",
          dueDate: "",
          labNotes: "",
          price: 0,
          expanded: true,
          orderCode: "",
          supplier: "",
      }]);
  };

  const removeOrder = (id: string) => {
      setSessionOrders(sessionOrders.filter(o => o.id !== id));
  };

  const updateOrder = (id: string, field: keyof OrderSession, value: any) => {
      setSessionOrders(sessionOrders.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const toggleOrderExpansion = (id: string) => {
      setSessionOrders(sessionOrders.map(o => o.id === id ? { ...o, expanded: !o.expanded } : o));
  };

  const resetSession = () => {
      setSelectedClientId("");
      setAttendant("");
      setPrescription("");
      setNotes("");
      setSessionOrders([]);
      setPaymentMethod("pix");
      setEntrada(0);
      setInstallmentsCount(1);
      setFirstDueDate("");
  };

  const handleSave = async () => {
    if (!selectedClientId || !attendant) {
        toast.error("Preencha o cliente e o atendente.");
        return;
    }
    if (isCarne && (!firstDueDate || installmentsCount < 1)) {
        toast.error("Para Carnê, informe o número de parcelas e a data do 1º vencimento.");
        return;
    }

    setIsSaving(true);
    try {
      const client = clients.find(c => c.id === selectedClientId);
      const isoDate = new Date().toISOString();
      const brDate = new Date().toLocaleDateString('pt-BR');
      const brTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // 1. Gravar Atendimento Principal
      const atendimentoDoc = await addDoc(collection(db, "atendimentos"), {
        clientId: selectedClientId,
        clientName: client ? client.name : "Cliente Não Informado",
        clientCpf: client ? client.cpf : "",
        attendant: attendant,
        notes: notes,
        prescription: prescription,
        totalValue: totalGeral,
        paymentMethod: paymentMethod,
        isCarne: isCarne,
        createdAt: isoDate,
        date: brDate,
        time: brTime,
        orders: sessionOrders // Salvando um snapshot dos pedidos para a impressão futura
      });

      // 2. Gravar os Pedidos Individuais na coleção `orders`
      for (const order of sessionOrders) {
          await setDoc(doc(db, "orders", order.id), {
            atendimentoId: atendimentoDoc.id,
            clientId: selectedClientId,
            clientName: client ? client.name : "Cliente Avulso",
            seller: attendant,
            serviceType: order.serviceType,
            dueDate: order.dueDate,
            notes: order.labNotes,
            items: order.items,
            total: order.price,
            paymentMethod: paymentMethod,
            status: "Pendente",
            createdAt: isoDate,
            date: brDate,
          });
      }

      // 3. Financeiro & Carnê
      if (totalGeral > 0) {
          if (!isCarne) {
              // Pagamento à vista total
              await addDoc(collection(db, "financial_transactions"), {
                  atendimentoId: atendimentoDoc.id,
                  description: `Venda à vista - ${client?.name || 'Avulso'}`,
                  amount: totalGeral,
                  date: brDate,
                  category: "Venda de Produto",
                  type: "Entrada",
                  paymentMethod: paymentMethod,
                  createdAt: isoDate,
              });
          } else {
              // Fluxo de Carnê
              // 3.1. Se houver entrada, registrar no fluxo de caixa atual
              if (entrada > 0) {
                  await addDoc(collection(db, "financial_transactions"), {
                      atendimentoId: atendimentoDoc.id,
                      description: `Entrada (Carnê) - ${client?.name || 'Avulso'}`,
                      amount: entrada,
                      date: brDate,
                      category: "Venda de Produto",
                      type: "Entrada",
                      paymentMethod: "Dinheiro/Pix", // assumindo que entrada é a vista
                      createdAt: isoDate,
                  });
              }

              // 3.2. Gerar parcelas na coleção `installments`
              const valorParcela = saldoDevedor / installmentsCount;
              
              // Helper para somar meses a uma data (espera e retorna DD/MM/YYYY)
              const addMonths = (dateStr: string, months: number) => {
                  const [day, month, year] = dateStr.split("/").map(Number);
                  const d = new Date(year, month - 1, day, 12, 0, 0);
                  d.setMonth(d.getMonth() + months);
                  
                  const dOut = d.getDate().toString().padStart(2, '0');
                  const mOut = (d.getMonth() + 1).toString().padStart(2, '0');
                  const yOut = d.getFullYear();
                  return `${dOut}/${mOut}/${yOut}`;
              };

              let currentDueDate = firstDueDate;
              
              for (let i = 1; i <= installmentsCount; i++) {
                  await addDoc(collection(db, "installments"), {
                      atendimentoId: atendimentoDoc.id,
                      clientId: selectedClientId,
                      clientName: client?.name || 'Avulso',
                      number: i,
                      totalInstallments: installmentsCount,
                      value: valorParcela,
                      dueDate: currentDueDate,
                      status: "Pendente",
                      createdAt: isoDate,
                  });
                  // Avançar 1 mês para a próxima parcela
                  currentDueDate = addMonths(currentDueDate, 1);
              }
          }
      }
      
      toast.success("Atendimento registrado e carnê gerado com sucesso!");
      resetSession();
      setActiveTab("historico");

    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = (atend: any) => {
    setPrintData(atend);
    setTimeout(() => {
        window.print();
    }, 500);
  };

  const filteredAtendimentos = atendimentos.filter(a => 
    a.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.attendant?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 print:hidden">
        <h1 className="text-xl font-semibold text-slate-900">Gestão de Atendimentos & PDV</h1>
        <p className="text-xs text-slate-500">Múltiplos pedidos, geração de carnês e canhoto de retirada.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full print:hidden">
          <TabsList className="bg-transparent p-0 border-b border-slate-200 h-10 w-full justify-start rounded-none gap-8 mb-6">
            <TabsTrigger value="novo" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none flex items-center gap-2">
                <Activity className="h-4 w-4" /> SESSÃO DE ATENDIMENTO
            </TabsTrigger>
            <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent px-0 h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none flex items-center gap-2">
                <FileText className="h-4 w-4" /> HISTÓRICO E FICHAS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="novo" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* COLUNA ESQUERDA: DADOS CLÍNICOS E PEDIDOS */}
                    <div className="xl:col-span-8 space-y-6">
                        <Card className="rounded border-slate-200 shadow-none overflow-hidden">
                            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                    <User className="h-4 w-4 text-slate-500" /> Identificação e Dados Clínicos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Paciente / Cliente *</Label>
                                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                            <SelectTrigger className="rounded border-slate-200 h-10 text-sm font-medium">
                                                <SelectValue placeholder="Busque ou selecione o cliente" />
                                            </SelectTrigger>
                                            <SelectContent>
                                            {clients.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name} - {c.cpf}</SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Atendente / Consultor *</Label>
                                        <Select value={attendant} onValueChange={setAttendant}>
                                            <SelectTrigger className="rounded border-slate-200 h-10 text-sm font-medium">
                                                <SelectValue placeholder="Selecione o atendente" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {atendentes.length === 0 && (
                                                <SelectItem value="_none" disabled>Nenhum atendente cadastrado</SelectItem>
                                              )}
                                              {atendentes.map(a => (
                                                <SelectItem key={a.id} value={a.name}>{a.name}{a.role ? ` — ${a.role}` : ""}</SelectItem>
                                              ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <Separator className="bg-slate-100 mb-6" />
                                
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Prescrição / Receita Atualizada</Label>
                                        <Input value={prescription} onChange={e => setPrescription(e.target.value)} placeholder="Ex: OD -1.00 Esf / OE -1.50 Esf -0.50 Cil 180°" className="rounded border-slate-200 h-10 text-sm font-medium" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Anotações da Consulta (Histórico, Queixas)</Label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded border-slate-200 text-sm p-3 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium" placeholder="O que foi conversado com o paciente..."></textarea>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SEÇÃO DE PEDIDOS (CARRINHO) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" /> Itens do Atendimento
                                </h3>
                                <Button onClick={handleAddOrder} variant="outline" className="h-9 rounded border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                    <Plus className="h-3.5 w-3.5 mr-1" /> ADICIONAR SERVIÇO / PRODUTO
                                </Button>
                            </div>

                            {sessionOrders.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-slate-200 rounded text-center text-slate-500 bg-slate-50/50">
                                    <div className="h-10 w-10 mx-auto bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                                        <ShoppingCart className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm font-medium">Nenhum pedido ou produto adicionado.</p>
                                    <p className="text-xs mt-1 text-slate-400">Sem itens, este atendimento será apenas um registro clínico no histórico.</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {sessionOrders.map((order, index) => (
                                    <Card key={order.id} className="rounded border-slate-200 shadow-sm overflow-hidden bg-white transition-all">
                                        <div 
                                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${order.expanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                                            onClick={() => toggleOrderExpansion(order.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{order.serviceType}</span>
                                                    {!order.expanded && order.items && <span className="text-[11px] text-slate-500 truncate max-w-[200px] md:max-w-md">{order.items}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-sm font-black text-emerald-600">R$ {order.price.toFixed(2)}</span>
                                                <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" onClick={(e) => { e.stopPropagation(); removeOrder(order.id); }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <div className="h-7 w-7 flex items-center justify-center text-slate-400">
                                                        {order.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {order.expanded && (
                                            <div className="p-5 space-y-5 bg-white">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipo de Serviço / Categoria</Label>
                                                        <Select value={order.serviceType} onValueChange={(val) => updateOrder(order.id, 'serviceType', val)}>
                                                            <SelectTrigger className="rounded border-slate-200 h-9 text-xs font-medium">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Óculos Completo">Óculos Completo</SelectItem>
                                                                <SelectItem value="Apenas Lentes">Apenas Lentes</SelectItem>
                                                                <SelectItem value="Apenas Armação">Apenas Armação</SelectItem>
                                                                <SelectItem value="Conserto / Manutenção">Conserto / Manutenção</SelectItem>
                                                                <SelectItem value="Pronta Entrega">Produto Pronta Entrega</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor Deste Item (R$)</Label>
                                                        <Input type="number" step="0.01" value={order.price || ''} onChange={(e) => updateOrder(order.id, 'price', Number(e.target.value))} className="rounded border-slate-200 h-9 text-sm font-bold" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição Detalhada dos Itens</Label>
                                                    <Input value={order.items} onChange={(e) => updateOrder(order.id, 'items', e.target.value)} placeholder="Ex: Armação RX5184 Preta + Lentes Kodak Anti-Reflexo" className="rounded border-slate-200 h-9 text-xs" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Código do Pedido / Lab</Label>
                                                        <Input value={order.orderCode} onChange={(e) => updateOrder(order.id, 'orderCode', e.target.value)} placeholder="Ex: LAB-2024-001" className="rounded border-slate-200 h-9 text-xs font-mono font-semibold" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</Label>
                                                        <Select value={order.supplier} onValueChange={(val) => updateOrder(order.id, 'supplier', val)}>
                                                            <SelectTrigger className="rounded border-slate-200 h-9 text-xs font-medium">
                                                                <SelectValue placeholder="Selecione o fornecedor" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                              {fornecedores.length === 0 && (
                                                                <SelectItem value="_none" disabled>Nenhum fornecedor cadastrado</SelectItem>
                                                              )}
                                                              {fornecedores.map(f => (
                                                                <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                                                              ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data Prometida de Entrega</Label>
                                                        <Input type="text" placeholder="DD/MM/YYYY" maxLength={10} value={order.dueDate} onChange={(e) => updateOrder(order.id, 'dueDate', formatDate(e.target.value))} className="rounded border-slate-200 h-9 text-xs text-slate-600" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observações de Laboratório</Label>
                                                        <Input value={order.labNotes} onChange={(e) => updateOrder(order.id, 'labNotes', e.target.value)} placeholder="Ex: Montagem nylon cuidadosa..." className="rounded border-slate-200 h-9 text-xs" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: RESUMO FINANCEIRO (STICKY) */}
                    <div className="xl:col-span-4">
                        <div className="sticky top-6">
                            <Card className="rounded border-slate-200 shadow-sm overflow-hidden bg-white">
                                <CardHeader className="p-5 border-b border-slate-100 bg-slate-900 text-white">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-emerald-400" /> Resumo Financeiro
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Totalizador */}
                                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total a Pagar</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                                            <span className="text-lg font-bold text-slate-400 mr-1">R$</span>
                                            {totalGeral.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Formulário de Pagamento */}
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Condição de Pagamento</Label>
                                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                <SelectTrigger className="rounded border-slate-200 h-10 text-sm font-semibold bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pix">PIX (À Vista)</SelectItem>
                                                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                                    <SelectItem value="carne" className="font-bold text-emerald-700">Carnê / Crediário Próprio</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {isCarne && (
                                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded space-y-4">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-2">Configuração do Carnê</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Entrada (R$)</Label>
                                                        <Input type="number" step="0.01" value={entrada || ''} onChange={(e) => setEntrada(Number(e.target.value))} className="rounded border-emerald-200 bg-white h-9 text-xs font-semibold" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Nº de Parcelas</Label>
                                                        <Input type="number" min="1" max="24" value={installmentsCount || ''} onChange={(e) => setInstallmentsCount(Number(e.target.value))} className="rounded border-emerald-200 bg-white h-9 text-xs font-semibold text-center" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Data da 1ª Parcela</Label>
                                                    <Input type="text" placeholder="DD/MM/YYYY" maxLength={10} value={firstDueDate} onChange={(e) => setFirstDueDate(formatDate(e.target.value))} className="rounded border-emerald-200 bg-white h-9 text-xs text-slate-700" />
                                                </div>
                                                
                                                <div className="mt-4 pt-3 border-t border-emerald-100 text-center">
                                                    <p className="text-[11px] text-emerald-600 font-medium">Restante a parcelar: <strong className="text-emerald-800">R$ {saldoDevedor.toFixed(2)}</strong></p>
                                                    {installmentsCount > 0 && saldoDevedor > 0 && firstDueDate && (
                                                        <p className="text-sm font-black text-emerald-700 mt-1">
                                                            {installmentsCount}x de R$ {(saldoDevedor / installmentsCount).toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <Button onClick={handleSave} disabled={isSaving || sessionOrders.length === 0} className="w-full h-12 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-widest mt-2 shadow-lg shadow-emerald-600/20">
                                            {isSaving ? "PROCESSANDO..." : "FINALIZAR SESSÃO"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
          </TabsContent>

          <TabsContent value="historico" className="m-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <Card className="rounded border-slate-200 shadow-none bg-white print:hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <div className="relative flex-1 group max-w-md">
                    <Input
                        placeholder="Buscar por cliente ou atendente..."
                        className="pl-9 h-9 bg-slate-50 border-slate-200 rounded text-xs focus:ring-0 focus:border-slate-400 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                </div>
                <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data/Hora</TableHead>
                        <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cliente</TableHead>
                        <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Anotações / Receita</TableHead>
                        <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Valor Total</TableHead>
                        <TableHead className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Ficha & Canhoto</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredAtendimentos.map((atend) => (
                        <TableRow key={atend.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors text-[13px]">
                        <TableCell className="px-6 py-3">
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-900">{atend.date}</span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {atend.time}</span>
                            </div>
                        </TableCell>
                        <TableCell className="px-6 py-3">
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-800">{atend.clientName}</span>
                                <span className="text-[10px] text-slate-500 font-medium">Atend: {atend.attendant}</span>
                            </div>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-slate-500 max-w-xs truncate text-[11px]">
                            {atend.prescription ? `Rx: ${atend.prescription}` : (atend.notes || "Sem anotações clínicas.")}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right font-bold text-slate-900">
                            R$ {(atend.totalValue || 0).toFixed(2)}
                            {atend.isCarne && <span className="block text-[9px] text-amber-600 uppercase">Carnê</span>}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right">
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100" onClick={() => handlePrint(atend)}>
                                <Printer className="h-3.5 w-3.5 mr-2" /> IMPRIMIR A4
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    {filteredAtendimentos.length === 0 && (
                        <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-500 font-medium">
                            Nenhum atendimento registrado no histórico.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
             </Card>
          </TabsContent>
      </Tabs>

      {/* --- ÁREA DE IMPRESSÃO MODERNA (Oculta na tela, visível apenas na impressão) --- */}
      {printData && (
        <div className="print-page hidden print:block bg-white text-black font-sans" style={{fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"}}>
          <div style={{padding: '12mm 14mm', minHeight: '297mm', display: 'flex', flexDirection: 'column'}}>
            
            {/* CABEÇALHO */}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6mm', borderBottom: '2px solid #0f172a', marginBottom: '6mm'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <img src="/logo.png" alt="Ótica Melissa" style={{height: '36px', width: 'auto', objectFit: 'contain'}} />
                <div>
                  <p style={{fontSize: '7pt', fontWeight: '700', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase', margin: 0}}>Ficha Clínica & Pedido</p>
                </div>
              </div>
              <div style={{textAlign: 'right', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px'}}>
                <p style={{fontSize: '7pt', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: 0}}>Protocolo</p>
                <p style={{fontSize: '11pt', fontWeight: '900', color: '#0f172a', margin: 0}}>#{printData.id.substring(0, 8).toUpperCase()}</p>
                <p style={{fontSize: '7pt', color: '#64748b', margin: 0}}>{printData.date} • {printData.time}</p>
              </div>
            </div>

            {/* DADOS DO PACIENTE */}
            <div style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5mm', marginBottom: '4mm'}}>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm'}}>Dados do Paciente</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3mm'}}>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Nome Completo</p>
                  <p style={{fontSize: '10pt', fontWeight: '700', color: '#0f172a', margin: 0}}>{printData.clientName}</p>
                </div>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>CPF</p>
                  <p style={{fontSize: '10pt', fontWeight: '600', color: '#334155', margin: 0}}>{printData.clientCpf || "—"}</p>
                </div>
                <div>
                  <p style={{fontSize: '6.5pt', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Atendente</p>
                  <p style={{fontSize: '10pt', fontWeight: '600', color: '#334155', margin: 0}}>{printData.attendant}</p>
                </div>
              </div>
            </div>

            {/* PRESCRIÇÃO */}
            {(printData.prescription || printData.notes) && (
              <div style={{border: '1px solid #e2e8f0', borderLeft: '4px solid #c4121a', borderRadius: '8px', padding: '4mm', marginBottom: '4mm'}}>
                <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm'}}>Prescrição & Anotações Clínicas</p>
                {printData.prescription && <p style={{fontSize: '9pt', fontWeight: '600', color: '#0f172a', margin: '0 0 1mm'}}><span style={{color: '#c4121a'}}>RX:</span> {printData.prescription}</p>}
                {printData.notes && <p style={{fontSize: '9pt', color: '#475569', margin: 0}}>{printData.notes}</p>}
              </div>
            )}

            {/* TABELA DE PEDIDOS */}
            <div style={{marginBottom: '4mm', flex: 1}}>
              <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm'}}>Relação de Pedidos / Vendas</p>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt'}}>
                <thead>
                  <tr style={{backgroundColor: '#0f172a', color: 'white'}}>
                    <th style={{padding: '3mm 4mm', textAlign: 'left', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '4px 0 0 4px'}}>Tipo de Serviço</th>
                    <th style={{padding: '3mm 4mm', textAlign: 'left', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Itens / Descrição</th>
                    <th style={{padding: '3mm 4mm', textAlign: 'center', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>Entrega</th>
                    <th style={{padding: '3mm 4mm', textAlign: 'right', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '0 4px 4px 0'}}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.orders && printData.orders.map((o: any, i: number) => (
                    <tr key={i} style={{borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc'}}>
                      <td style={{padding: '3mm 4mm', fontWeight: '700', color: '#0f172a'}}>{o.serviceType}</td>
                      <td style={{padding: '3mm 4mm', color: '#64748b'}}>{o.items || "—"}</td>
                      <td style={{padding: '3mm 4mm', textAlign: 'center', color: '#475569'}}>{o.dueDate ? new Date(o.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : "Imediata"}</td>
                      <td style={{padding: '3mm 4mm', textAlign: 'right', fontWeight: '800', color: '#0f172a'}}>R$ {(o.price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!printData.orders || printData.orders.length === 0) && (
                    <tr><td colSpan={4} style={{padding: '4mm', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic'}}>Nenhum pedido registrado nesta sessão.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{backgroundColor: '#0f172a', color: 'white'}}>
                    <td colSpan={3} style={{padding: '3mm 4mm', textAlign: 'right', fontWeight: '700', fontSize: '7pt', letterSpacing: '1px', textTransform: 'uppercase'}}>VALOR TOTAL</td>
                    <td style={{padding: '3mm 4mm', textAlign: 'right', fontWeight: '900', fontSize: '12pt'}}>R$ {(printData.totalValue || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <p style={{fontSize: '7.5pt', textAlign: 'right', marginTop: '1.5mm', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px'}}>
                Pagamento: {printData.isCarne ? 'CARNÊ / CREDIÁRIO' : (printData.paymentMethod || 'NÃO DEFINIDO').toUpperCase()}
              </p>
            </div>

            {/* ASSINATURAS */}
            <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '8mm', paddingTop: '4mm', borderTop: '1px solid #e2e8f0'}}>
              <div style={{textAlign: 'center', width: '70mm'}}>
                <div style={{borderBottom: '1px solid #0f172a', marginBottom: '2mm', height: '10mm'}}></div>
                <p style={{fontSize: '6.5pt', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: 0}}>Assinatura do Paciente / Cliente</p>
              </div>
              <div style={{textAlign: 'center', width: '70mm'}}>
                <div style={{borderBottom: '1px solid #0f172a', marginBottom: '2mm', height: '10mm'}}></div>
                <p style={{fontSize: '6.5pt', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: 0}}>Ótica Melissa — {printData.attendant}</p>
              </div>
            </div>

            {/* CANHOTO */}
            {printData.orders && printData.orders.length > 0 && (
              <div style={{marginTop: '8mm', borderTop: '2px dashed #cbd5e1', paddingTop: '5mm', position: 'relative'}}>
                <div style={{position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 6px'}}>
                  <span style={{fontSize: '8pt', color: '#94a3b8'}}>✂</span>
                </div>
                
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3mm'}}>
                      <img src="/logo.png" alt="Ótica Melissa" style={{height: '22px', width: 'auto'}} />
                      <div>
                        <p style={{fontSize: '8pt', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: 0}}>Canhoto de Retirada</p>
                        <p style={{fontSize: '6.5pt', color: '#64748b', margin: 0}}>Apresente este comprovante para retirar seus óculos</p>
                      </div>
                    </div>
                    <div style={{fontSize: '8.5pt', display: 'flex', flexDirection: 'column', gap: '1mm'}}>
                      <p style={{margin: 0}}><strong>Cliente:</strong> {printData.clientName}</p>
                      <p style={{margin: 0}}><strong>Pedidos:</strong> {printData.orders.length} item(ns)</p>
                      <p style={{margin: 0}}><strong>Valor Total:</strong> R$ {(printData.totalValue || 0).toFixed(2)}</p>
                      {printData.isCarne && <p style={{margin: 0, color: '#dc2626', fontWeight: '700'}}>⚠ CARNÊ — Verificar pendências antes da entrega</p>}
                    </div>
                  </div>
                  <div style={{textAlign: 'right', display: 'flex', gap: '3mm', alignItems: 'flex-start'}}>
                    {/* QR CODE DE RASTREIO */}
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2mm'}}>
                      <QRCodeSVG 
                        value={`https://otica-melissa.vercel.app/rastreio?id=${printData.id}`} 
                        size={60} 
                      />
                      <p style={{fontSize: '4.5pt', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', margin: 0}}>Rastrear Online</p>
                    </div>

                    <div style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4mm', minWidth: '45mm'}}>
                      <p style={{fontSize: '6.5pt', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Nº Atendimento</p>
                      <p style={{fontSize: '14pt', fontWeight: '900', color: '#0f172a', margin: '0 0 2mm'}}>#{printData.id.substring(0, 8).toUpperCase()}</p>
                      <table style={{fontSize: '7pt', borderCollapse: 'collapse', width: '100%'}}>
                        <thead><tr style={{backgroundColor: '#e2e8f0'}}><th style={{padding: '1mm 2mm', textAlign: 'left'}}>Item</th><th style={{padding: '1mm 2mm', textAlign: 'center'}}>Entrega</th></tr></thead>
                        <tbody>
                          {printData.orders.map((o: any, i: number) => (
                            <tr key={i} style={{borderBottom: '1px solid #f1f5f9'}}>
                              <td style={{padding: '1mm 2mm', fontWeight: '600'}}>{o.serviceType}</td>
                              <td style={{padding: '1mm 2mm', textAlign: 'center', fontWeight: '700'}}>{o.dueDate ? new Date(o.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : "Retirada"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RODAPÉ */}
            <div style={{marginTop: 'auto', paddingTop: '3mm', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <p style={{fontSize: '6.5pt', color: '#cbd5e1', margin: 0}}>Documento gerado pelo sistema Ótica Melissa</p>
              <p style={{fontSize: '6.5pt', color: '#cbd5e1', margin: 0}}>Impresso em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
