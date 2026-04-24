import * as React from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";
import { 
    Search, User, Printer, Clock, Activity, ShoppingCart, 
    DollarSign, FileText, Plus, Trash2, ChevronDown, ChevronUp, Scissors,
    MessageCircle, Eye
} from "lucide-react";
import { motion } from "framer-motion";
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("novo");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [atendentes, setAtendentes] = React.useState<any[]>([]);
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);
  const [categorias, setCategorias] = React.useState<any[]>([]);

  // State for Print
  const [printData, setPrintData] = React.useState<any>(null);

  // --- SESSION STATE ---
  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [clientSearch, setClientSearch] = React.useState("");
  const [isClientListOpen, setIsClientListOpen] = React.useState(false);
  const [attendant, setAttendant] = React.useState("");
  const [prescription, setPrescription] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [sessionOrders, setSessionOrders] = React.useState<OrderSession[]>([]);

  // Tabela de Receita (Rx)
  const [rxData, setRxData] = React.useState({
    longe_od_esf: "", longe_od_cil: "", longe_od_eixo: "", longe_od_dp: "",
    longe_oe_esf: "", longe_oe_cil: "", longe_oe_eixo: "", longe_oe_dp: "",
    perto_od_esf: "", perto_od_cil: "", perto_od_eixo: "", perto_od_dp: "",
    perto_oe_esf: "", perto_oe_cil: "", perto_oe_eixo: "", perto_oe_dp: "",
  });

  // --- PAYMENT STATE ---
  const [paymentMethod, setPaymentMethod] = React.useState("pix");
  const [entrada, setEntrada] = React.useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = React.useState<number>(1);
  const [discountValue, setDiscountValue] = React.useState<number>(0);
  const [feeValue, setFeeValue] = React.useState<number>(0);
  const [feeType, setFeeType] = React.useState<"fixed" | "percent">("percent");
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
    const unsubCat = onSnapshot(query(collection(db, "categorias")), (snap) => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAtend();
      unsubClients();
      unsubAtendentes();
      unsubForn();
      unsubCat();
    };
  }, []);

  const formatDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/(\d{2})(\d)/, "$1/$2")
            .replace(/(\d{2})(\d)/, "$1/$2");
  };

  const subtotal = sessionOrders.reduce((acc, curr) => acc + curr.price, 0);
  const calculatedFee = feeType === "percent" ? (subtotal * (feeValue / 100)) : feeValue;
  const totalFinal = Math.max(0, subtotal - discountValue + calculatedFee);
  const saldoDevedor = Math.max(0, totalFinal - entrada);
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

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.cpf?.includes(clientSearch)
  );

  const resetSession = () => {
      setSelectedClientId("");
      setAttendant("");
      setPrescription("");
      setNotes("");
      setSessionOrders([]);
      setRxData({
        longe_od_esf: "", longe_od_cil: "", longe_od_eixo: "", longe_od_dp: "",
        longe_oe_esf: "", longe_oe_cil: "", longe_oe_eixo: "", longe_oe_dp: "",
        perto_od_esf: "", perto_od_cil: "", perto_od_eixo: "", perto_od_dp: "",
        perto_oe_esf: "", perto_oe_cil: "", perto_oe_eixo: "", perto_oe_dp: "",
      });
      setPaymentMethod("pix");
      setEntrada(0);
      setDiscountValue(0);
      setFeeValue(0);
      setFeeType("percent");
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
        rxData: rxData, 
        subtotal: subtotal,
        discount: discountValue,
        fee: calculatedFee,
        feePercent: feeType === "percent" ? feeValue : 0,
        totalValue: totalFinal,
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
            orderCode: order.orderCode || "",
            supplier: order.supplier || "",
          });
      }

      // 3. Financeiro & Carnê
      if (totalFinal > 0) {
          if (!isCarne) {
              // Pagamento à vista total
              await addDoc(collection(db, "financial_transactions"), {
                  atendimentoId: atendimentoDoc.id,
                  description: `Venda ${paymentMethod.toUpperCase()} - ${client?.name || 'Avulso'}`,
                  amount: totalFinal,
                  date: brDate,
                  category: "Venda de Produto",
                  type: "Entrada",
                  paymentMethod: paymentMethod,
                  createdAt: isoDate,
              });
          } else {
              // Fluxo de Carnê
              // 3.1. Se houver entrada, registrar no fluxo de caixa E como installment pendente de confirmação
              if (entrada > 0) {
                  // Lança na fila de confirmação de recebimento (aparece no card de Carnês)
                  await addDoc(collection(db, "installments"), {
                      atendimentoId: atendimentoDoc.id,
                      clientId: selectedClientId,
                      clientName: client?.name || 'Avulso',
                      number: 0,
                      totalInstallments: installmentsCount,
                      isDownPayment: true,
                      value: entrada,
                      dueDate: brDate,
                      status: "Pendente",
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

  const handleWhatsAppReceipt = (atend: any) => {
    const client = clients.find(c => c.id === atend.clientId);
    const phone = client?.phone?.replace(/\D/g, "") || "";
    if (!phone) {
        toast.error("Telefone do cliente não cadastrado.");
        return;
    }
    const message = `Olá, *${atend.clientName.split(' ')[0]}*! Aqui é da *Ótica Melissa*. ✨

Acabamos de registrar seu atendimento *#${atend.id.substring(0, 8).toUpperCase()}*.
Total: *R$ ${atend.totalValue.toFixed(2)}*
${atend.isCarne ? '\n💳 *Seu carnê foi aprovado e já está disponível online!*\n' : ''}
Acompanhe seu pedido e histórico completo através da nossa nova *Área do Cliente*:
🔗 https://otica-melissa.vercel.app/cliente/login

Agradecemos a preferência! 👓💙`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
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
          <div className="flex justify-start mb-6">
            <TabsList className="bg-transparent p-0 border-b border-slate-200 h-10 w-full justify-start !rounded-none-none gap-2">
              <TabsTrigger value="novo" className="flex-none !rounded-none-none border-b-2 border-transparent w-[220px] justify-center h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none flex items-center gap-2">
                  <Activity className="h-4 w-4" /> SESSÃO DE ATENDIMENTO
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex-none !rounded-none-none border-b-2 border-transparent w-[220px] justify-center h-full font-semibold text-sm text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 bg-transparent shadow-none flex items-center gap-2">
                  <FileText className="h-4 w-4" /> HISTÓRICO E FICHAS
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="novo" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* COLUNA ESQUERDA: DADOS CLÍNICOS E PEDIDOS */}
                    <div className="xl:col-span-8 space-y-6">
                        <Card className="!rounded-none border-slate-200 shadow-none overflow-hidden !p-0 !gap-0">
                            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/80 !rounded-none">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                    <User className="h-4 w-4 text-slate-500" /> Identificação e Dados Clínicos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Paciente / Cliente *</Label>
                                        <div className="relative">
                                            <Input 
                                                value={selectedClient ? `${selectedClient.name} - ${selectedClient.cpf}` : clientSearch}
                                                onChange={(e) => {
                                                    setClientSearch(e.target.value);
                                                    setIsClientListOpen(true);
                                                    if (selectedClientId) setSelectedClientId("");
                                                }}
                                                onFocus={() => setIsClientListOpen(true)}
                                                onBlur={() => setTimeout(() => setIsClientListOpen(false), 200)}
                                                placeholder="Busque por nome ou CPF..."
                                                className="!rounded-none border-slate-200 h-12 text-sm font-medium pr-10 w-full"
                                            />
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            
                                            {isClientListOpen && clientSearch && !selectedClientId && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 shadow-xl max-h-60 overflow-auto !rounded-none">
                                                    {filteredClients.length === 0 ? (
                                                        <div className="p-4 text-xs text-slate-500 text-center">Nenhum cliente encontrado</div>
                                                    ) : (
                                                        filteredClients.map(c => (
                                                            <div 
                                                                key={c.id}
                                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex flex-col gap-0.5"
                                                                onClick={() => {
                                                                    setSelectedClientId(c.id);
                                                                    setClientSearch(`${c.name} - ${c.cpf}`);
                                                                    setIsClientListOpen(false);
                                                                }}
                                                            >
                                                                <div className="text-sm font-bold text-slate-900">{c.name}</div>
                                                                <div className="text-[10px] text-slate-500 font-medium">CPF: {c.cpf}</div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Atendente / Consultor *</Label>
                                        <Select value={attendant} onValueChange={setAttendant}>
                                            <SelectTrigger className="!rounded-none border-slate-200 h-12 text-sm font-medium w-full">
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
                                
                                <Separator className="bg-slate-100" />
                                
                                <div className="space-y-5">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Receita Óptica (Grau)</Label>
                                        <div className="!rounded-none border border-slate-200 overflow-hidden bg-white">
                                            <table className="w-full text-xs text-center border-collapse">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500">
                                                <tr>
                                                <th className="p-2 border-r border-slate-200 w-16"></th>
                                                <th className="p-2 border-r border-slate-200 w-12"></th>
                                                <th className="p-2 border-r border-slate-200">ESFÉRICO</th>
                                                <th className="p-2 border-r border-slate-200">CILÍNDRICO</th>
                                                <th className="p-2 border-r border-slate-200">EIXO</th>
                                                <th className="p-2 w-16">D.P.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Longe OD */}
                                                <tr className="border-b border-slate-200">
                                                <td rowSpan={2} className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">PARA<br/>LONGE</td>
                                                <td className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">O.D.</td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.longe_od_esf} onChange={e => setRxData({...rxData, longe_od_esf: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="+0.00" /></td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.longe_od_cil} onChange={e => setRxData({...rxData, longe_od_cil: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="-0.00" /></td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.longe_od_eixo} onChange={e => setRxData({...rxData, longe_od_eixo: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="0°" /></td>
                                                <td className="p-1"><Input value={rxData.longe_od_dp} onChange={e => setRxData({...rxData, longe_od_dp: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" /></td>
                                                </tr>
                                                {/* Longe OE */}
                                                <tr className="border-b border-slate-200">
                                                <td className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">O.E.</td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.longe_oe_esf} onChange={e => setRxData({...rxData, longe_oe_esf: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="+0.00" /></td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.longe_oe_cil} onChange={e => setRxData({...rxData, longe_oe_cil: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="-0.00" /></td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.longe_oe_eixo} onChange={e => setRxData({...rxData, longe_oe_eixo: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="0°" /></td>
                                                <td className="p-1"><Input value={rxData.longe_oe_dp} onChange={e => setRxData({...rxData, longe_oe_dp: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="m.m." /></td>
                                                </tr>
                                                {/* Perto OD */}
                                                <tr className="border-b border-slate-200">
                                                <td rowSpan={2} className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">PARA<br/>PERTO</td>
                                                <td className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">O.D.</td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.perto_od_esf} onChange={e => setRxData({...rxData, perto_od_esf: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="+0.00" /></td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.perto_od_cil} onChange={e => setRxData({...rxData, perto_od_cil: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="-0.00" /></td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.perto_od_eixo} onChange={e => setRxData({...rxData, perto_od_eixo: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="0°" /></td>
                                                <td className="p-1"><Input value={rxData.perto_od_dp} onChange={e => setRxData({...rxData, perto_od_dp: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" /></td>
                                                </tr>
                                                {/* Perto OE */}
                                                <tr>
                                                <td className="p-2 border-r border-slate-200 font-bold text-[10px] bg-slate-50 text-slate-500">O.E.</td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.perto_oe_esf} onChange={e => setRxData({...rxData, perto_oe_esf: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="+0.00" /></td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.perto_oe_cil} onChange={e => setRxData({...rxData, perto_oe_cil: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="-0.00" /></td>
                                                <td className="p-1 border-r border-slate-200"><Input value={rxData.perto_oe_eixo} onChange={e => setRxData({...rxData, perto_oe_eixo: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="0°" /></td>
                                                <td className="p-1"><Input value={rxData.perto_oe_dp} onChange={e => setRxData({...rxData, perto_oe_dp: e.target.value})} className="h-7 text-xs text-center border-0 focus-visible:ring-1 !rounded-none-sm shadow-none" placeholder="m.m." /></td>
                                                </tr>
                                            </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Anotações da Consulta (Histórico, Queixas)</Label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full !rounded-none border border-slate-300 text-sm p-3 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium" placeholder="O que foi conversado com o paciente..."></textarea>
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
                                <Button onClick={handleAddOrder} variant="outline" className="h-9 !rounded-none-none border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                    <Plus className="h-3.5 w-3.5 mr-1" /> ADICIONAR SERVIÇO / PRODUTO
                                </Button>
                            </div>

                            {sessionOrders.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-slate-200 !rounded-none-none text-center text-slate-500 bg-slate-50/50">
                                    <div className="h-10 w-10 mx-auto bg-slate-100 text-slate-400 !rounded-none-full flex items-center justify-center mb-3">
                                        <ShoppingCart className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm font-medium">Nenhum pedido ou produto adicionado.</p>
                                    <p className="text-xs mt-1 text-slate-400">Sem itens, este atendimento será apenas um registro clínico no histórico.</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {sessionOrders.map((order, index) => (
                                    <Card key={order.id} className="!rounded-none border-slate-200 shadow-sm overflow-hidden bg-white transition-all !p-0 !gap-0">
                                        <div 
                                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${order.expanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                                            onClick={() => toggleOrderExpansion(order.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-6 w-6 !rounded-none bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
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
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 !rounded-none" onClick={(e) => { e.stopPropagation(); removeOrder(order.id); }}>
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
                                                            <SelectTrigger className="!rounded-none border-slate-200 h-9 text-xs font-medium">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                              {categorias.length === 0 ? (
                                                                <SelectItem value={order.serviceType || "Serviço"}>
                                                                  {order.serviceType || "Cadastre categorias em Configurações"}
                                                                </SelectItem>
                                                              ) : (
                                                                categorias.map(cat => (
                                                                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                                                ))
                                                              )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Valor Deste Item (R$)</Label>
                                                        <Input type="number" step="0.01" value={order.price || ''} onChange={(e) => updateOrder(order.id, 'price', Number(e.target.value))} className="!rounded-none border-slate-200 h-9 text-sm font-bold" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Descrição Detalhada dos Itens</Label>
                                                    <Input value={order.items} onChange={(e) => updateOrder(order.id, 'items', e.target.value)} placeholder="Ex: Armação RX5184 Preta + Lentes Kodak Anti-Reflexo" className="!rounded-none border-slate-200 h-9 text-xs" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Código do Pedido / Lab</Label>
                                                        <Input value={order.orderCode} onChange={(e) => updateOrder(order.id, 'orderCode', e.target.value)} placeholder="Ex: LAB-2024-001" className="!rounded-none border-slate-200 h-9 text-xs font-mono font-semibold" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</Label>
                                                        <Select value={order.supplier} onValueChange={(val) => updateOrder(order.id, 'supplier', val)}>
                                                            <SelectTrigger className="!rounded-none border-slate-200 h-9 text-xs font-medium">
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
                                                        <Input type="text" placeholder="DD/MM/YYYY" maxLength={10} value={order.dueDate} onChange={(e) => updateOrder(order.id, 'dueDate', formatDate(e.target.value))} className="!rounded-none border-slate-200 h-9 text-xs text-slate-600" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observações de Laboratório</Label>
                                                        <Input value={order.labNotes} onChange={(e) => updateOrder(order.id, 'labNotes', e.target.value)} placeholder="Ex: Montagem nylon cuidadosa..." className="!rounded-none border-slate-200 h-9 text-xs" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <Button 
                                                        onClick={(e) => { e.stopPropagation(); toggleOrderExpansion(order.id); }} 
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase h-8 px-4 !rounded-none"
                                                    >
                                                        Salvar Item
                                                    </Button>
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
                            <Card className="!rounded-none border-slate-200 shadow-sm overflow-hidden bg-white !p-0 !gap-0">
                                <CardHeader className="p-5 border-b border-slate-100 bg-slate-900 text-white !rounded-none">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider">
                                        <DollarSign className="h-4 w-4 text-emerald-400" /> Resumo do Atendimento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Lista de Itens */}
                                    <div className="p-5 space-y-3 max-h-[250px] overflow-y-auto bg-slate-50/50 border-b border-slate-100">
                                        {sessionOrders.length === 0 ? (
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase text-center py-2">Nenhum item adicionado</p>
                                        ) : (
                                            sessionOrders.map((item, idx) => (
                                                <div key={item.id} className="flex justify-between items-start text-[11px]">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{idx + 1}. {item.serviceType}</span>
                                                        <span className="text-slate-500 truncate max-w-[140px]">{item.items || "Sem descrição"}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900 whitespace-nowrap ml-2">R$ {item.price.toFixed(2)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Ajustes e Totais */}
                                    <div className="p-5 space-y-4 bg-white">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-bold uppercase text-slate-400">Desconto (R$)</Label>
                                                <Input type="number" step="0.01" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} className="h-8 text-xs font-bold border-slate-100 bg-slate-50/50" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-bold uppercase text-slate-400">Acréscimo ({feeType === 'percent' ? '%' : 'R$'})</Label>
                                                <div className="flex gap-1">
                                                    <Input type="number" step="0.01" value={feeValue || ''} onChange={(e) => setFeeValue(Number(e.target.value))} className="h-8 text-xs font-bold border-slate-100 bg-slate-50/50" />
                                                    <Button variant="outline" size="icon" className="h-8 w-8 !rounded-none border-slate-100" onClick={() => setFeeType(feeType === 'percent' ? 'fixed' : 'percent')}>
                                                        <span className="text-[10px] font-bold">{feeType === 'percent' ? '%' : '$'}</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-50" />

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-slate-500 text-[11px]">
                                                <span>Subtotal</span>
                                                <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
                                            </div>
                                            {discountValue > 0 && (
                                                <div className="flex justify-between items-center text-rose-500 text-[11px]">
                                                    <span>Desconto</span>
                                                    <span className="font-semibold">- R$ {discountValue.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {calculatedFee > 0 && (
                                                <div className="flex justify-between items-center text-emerald-600 text-[11px]">
                                                    <span>Acréscimo / Taxas</span>
                                                    <span className="font-semibold">+ R$ {calculatedFee.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-xs font-bold text-slate-900 uppercase">Total Final</span>
                                                <span className="text-2xl font-black text-slate-900 tracking-tight">
                                                    <span className="text-sm font-bold text-slate-400 mr-1">R$</span>
                                                    {totalFinal.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pagamento */}
                                    <div className="p-5 pt-0 space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Método de Pagamento</Label>
                                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                <SelectTrigger className="!rounded-none border-slate-200 h-10 text-sm font-semibold bg-white">
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
                                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 !rounded-none-none space-y-4">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-2">Configuração do Carnê</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Entrada (R$)</Label>
                                                        <Input type="number" step="0.01" value={entrada || ''} onChange={(e) => setEntrada(Number(e.target.value))} className="!rounded-none border-emerald-200 bg-white h-9 text-xs font-semibold" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Parcelas</Label>
                                                        <Input type="number" min="1" max="24" value={installmentsCount || ''} onChange={(e) => setInstallmentsCount(Number(e.target.value))} className="!rounded-none border-emerald-200 bg-white h-9 text-xs font-semibold text-center" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">1º Vencimento</Label>
                                                    <Input type="text" placeholder="DD/MM/YYYY" maxLength={10} value={firstDueDate} onChange={(e) => setFirstDueDate(formatDate(e.target.value))} className="!rounded-none border-emerald-200 bg-white h-9 text-xs text-slate-700" />
                                                </div>
                                                
                                                <div className="mt-4 pt-3 border-t border-emerald-100 text-center">
                                                    <p className="text-[11px] text-emerald-600 font-medium">Restante: <strong className="text-emerald-800">R$ {saldoDevedor.toFixed(2)}</strong></p>
                                                    {installmentsCount > 0 && saldoDevedor > 0 && (
                                                        <p className="text-lg font-black text-emerald-700 mt-1">
                                                            {installmentsCount}x de R$ {(saldoDevedor / installmentsCount).toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <Button onClick={handleSave} disabled={isSaving || (selectedClientId === "")} className="w-full h-11 !rounded-none-none bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-xs tracking-wider shadow-lg shadow-slate-900/10">
                                            {isSaving ? "PROCESSANDO..." : "FINALIZAR ATENDIMENTO"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
          </TabsContent>

          <TabsContent value="historico" className="m-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <Card className="!rounded-none border-slate-200 shadow-none bg-white print:hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <div className="relative flex-1 group max-w-md">
                    <Input
                        placeholder="Buscar por cliente ou atendente..."
                        className="pl-9 h-9 bg-slate-50 border-slate-200 !rounded-none text-xs focus:ring-0 focus:border-slate-400 transition-all font-medium"
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
                        <TableCell className="px-6 py-2 min-w-[200px]">
                            {atend.rxData && (
                                atend.rxData.longe_od_esf || atend.rxData.longe_od_cil || atend.rxData.longe_od_eixo || 
                                atend.rxData.longe_oe_esf || atend.rxData.longe_oe_cil || atend.rxData.longe_oe_eixo ||
                                atend.rxData.perto_od_esf || atend.rxData.perto_od_cil || atend.rxData.perto_od_eixo ||
                                atend.rxData.perto_oe_esf || atend.rxData.perto_oe_cil || atend.rxData.perto_oe_eixo
                            ) ? (
                                <div className="flex gap-4 font-mono text-[9px] tabular-nums leading-tight">
                                    {/* Longe */}
                                    {(atend.rxData.longe_od_esf || atend.rxData.longe_od_cil || atend.rxData.longe_od_eixo || atend.rxData.longe_oe_esf || atend.rxData.longe_oe_cil || atend.rxData.longe_oe_eixo) && (
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-slate-400 uppercase border-b border-slate-50 pb-0.5 mb-1 text-center">Longe</p>
                                            {(atend.rxData.longe_od_esf || atend.rxData.longe_od_cil || atend.rxData.longe_od_eixo) && (
                                                <div className="flex gap-1.5 whitespace-nowrap">
                                                    <span className="text-slate-300 w-3 font-bold">D</span>
                                                    <span className="font-bold text-slate-600">
                                                        {[atend.rxData.longe_od_esf, atend.rxData.longe_od_cil, atend.rxData.longe_od_eixo].filter(Boolean).join("/")}
                                                        {atend.rxData.longe_od_dp && <span className="ml-1 text-slate-300 font-normal">({atend.rxData.longe_od_dp})</span>}
                                                    </span>
                                                </div>
                                            )}
                                            {(atend.rxData.longe_oe_esf || atend.rxData.longe_oe_cil || atend.rxData.longe_oe_eixo) && (
                                                <div className="flex gap-1.5 whitespace-nowrap">
                                                    <span className="text-slate-300 w-3 font-bold">E</span>
                                                    <span className="font-bold text-slate-600">
                                                        {[atend.rxData.longe_oe_esf, atend.rxData.longe_oe_cil, atend.rxData.longe_oe_eixo].filter(Boolean).join("/")}
                                                        {atend.rxData.longe_oe_dp && <span className="ml-1 text-slate-300 font-normal">({atend.rxData.longe_oe_dp})</span>}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* Perto */}
                                    {(atend.rxData.perto_od_esf || atend.rxData.perto_od_cil || atend.rxData.perto_od_eixo || atend.rxData.perto_oe_esf || atend.rxData.perto_oe_cil || atend.rxData.perto_oe_eixo) && (
                                        <div className="space-y-0.5 border-l border-slate-100 pl-3">
                                            <p className="text-[8px] font-black text-slate-400 uppercase border-b border-slate-50 pb-0.5 mb-1 text-center">Perto</p>
                                            {(atend.rxData.perto_od_esf || atend.rxData.perto_od_cil || atend.rxData.perto_od_eixo) && (
                                                <div className="flex gap-1.5 whitespace-nowrap">
                                                    <span className="text-slate-300 w-3 font-bold">D</span>
                                                    <span className="font-bold text-slate-600">
                                                        {[atend.rxData.perto_od_esf, atend.rxData.perto_od_cil, atend.rxData.perto_od_eixo].filter(Boolean).join("/")}
                                                        {atend.rxData.perto_od_dp && <span className="ml-1 text-slate-300 font-normal">({atend.rxData.perto_od_dp})</span>}
                                                    </span>
                                                </div>
                                            )}
                                            {(atend.rxData.perto_oe_esf || atend.rxData.perto_oe_cil || atend.rxData.perto_oe_eixo) && (
                                                <div className="flex gap-1.5 whitespace-nowrap">
                                                    <span className="text-slate-300 w-3 font-bold">E</span>
                                                    <span className="font-bold text-slate-600">
                                                        {[atend.rxData.perto_oe_esf, atend.rxData.perto_oe_cil, atend.rxData.perto_oe_eixo].filter(Boolean).join("/")}
                                                        {atend.rxData.perto_oe_dp && <span className="ml-1 text-slate-300 font-normal">({atend.rxData.perto_oe_dp})</span>}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-[9px] text-slate-400 italic font-medium">Nenhum dado técnico de receita (Rx)</span>
                            )}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right font-bold text-slate-900">
                            R$ {(atend.totalValue || 0).toFixed(2)}
                            {atend.isCarne && <span className="block text-[9px] text-amber-600 uppercase">Carnê</span>}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 !rounded-none text-slate-400 hover:bg-slate-100 hover:text-slate-600" 
                                    onClick={() => navigate(`/admin/atendimentos/${atend.id}`)}
                                    title="Visualizar Ficha Completa"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 !rounded-none text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" 
                                    onClick={() => handleWhatsAppReceipt(atend)}
                                    title="Enviar por WhatsApp"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 !rounded-none text-slate-400 hover:bg-slate-100 hover:text-slate-600" 
                                    onClick={() => handlePrint(atend)}
                                    title="Imprimir Ficha A4"
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
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

            {/* PRESCRIÇÃO E ANOTAÇÕES */}
            <div style={{display: 'grid', gridTemplateColumns: printData.rxData ? '1.5fr 1fr' : '1fr', gap: '4mm', marginBottom: '4mm'}}>
              {printData.rxData && (
                <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden'}}>
                  <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', padding: '2mm 3mm', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', margin: 0}}>Prescrição Óptica (Rx)</p>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '8pt', textAlign: 'center'}}>
                    <thead style={{backgroundColor: '#f1f5f9', fontSize: '6.5pt', fontWeight: '700', color: '#64748b'}}>
                      <tr>
                        <th style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}></th>
                        <th style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}></th>
                        <th style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>ESF.</th>
                        <th style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>CIL.</th>
                        <th style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>EIXO</th>
                        <th style={{padding: '1.5mm'}}>D.P.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{borderBottom: '1px solid #e2e8f0'}}>
                        <td rowSpan={2} style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt', backgroundColor: '#f8fafc'}}>LONGE</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt'}}>O.D.</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.longe_od_esf || "—"}</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.longe_od_cil || "—"}</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.longe_od_eixo || "—"}</td>
                        <td style={{padding: '1.5mm'}}>{printData.rxData.longe_od_dp || "—"}</td>
                      </tr>
                      <tr style={{borderBottom: '1px solid #e2e8f0'}}>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt'}}>O.E.</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.longe_oe_esf || "—"}</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.longe_oe_cil || "—"}</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.longe_oe_eixo || "—"}</td>
                        <td style={{padding: '1.5mm'}}>{printData.rxData.longe_oe_dp || "—"}</td>
                      </tr>
                      <tr style={{borderBottom: '1px solid #e2e8f0'}}>
                        <td rowSpan={2} style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt', backgroundColor: '#f8fafc'}}>PERTO</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt'}}>O.D.</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.perto_od_esf || "—"}</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.perto_od_cil || "—"}</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.perto_od_eixo || "—"}</td>
                        <td style={{padding: '1.5mm'}}>{printData.rxData.perto_od_dp || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0', fontWeight: '700', fontSize: '6pt'}}>O.E.</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.perto_oe_esf || "—"}</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.perto_oe_cil || "—"}</td>
                        <td style={{padding: '1.5mm', borderRight: '1px solid #e2e8f0'}}>{printData.rxData.perto_oe_eixo || "—"}</td>
                        <td style={{padding: '1.5mm'}}>{printData.rxData.perto_oe_dp || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {printData.notes && (
                <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4mm', backgroundColor: '#fff', display: 'flex', flexDirection: 'column'}}>
                  <p style={{fontSize: '7pt', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm'}}>Anotações Clínicas</p>
                  <p style={{fontSize: '8.5pt', color: '#334155', margin: 0, whiteSpace: 'pre-wrap'}}>{printData.notes}</p>
                </div>
              )}
            </div>

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
                      <td style={{padding: '3mm 4mm', textAlign: 'center', color: '#475569'}}>{(() => {
                        if (!o.dueDate) return "Imediata";
                        if (o.dueDate.includes("/")) {
                            const [d, m, y] = o.dueDate.split("/").map(Number);
                            return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                        }
                        return new Date(o.dueDate).toLocaleDateString('pt-BR');
                      })()}</td>
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
                    <p style={{margin: 0}}><strong>Cliente:</strong> {printData.clientName || "Não informado"}</p>
                    <p style={{margin: 0}}><strong>Pedidos:</strong> {(printData.orders || []).length} item(ns)</p>
                    <p style={{margin: 0}}><strong>Valor Total:</strong> R$ {(printData.totalValue || 0).toFixed(2)}</p>
                    {printData.isCarne && <p style={{margin: 0, color: '#dc2626', fontWeight: '700'}}>⚠ CARNÊ — Verificar pendências antes da entrega</p>}
                  </div>
                </div>
                <div style={{textAlign: 'right', display: 'flex', gap: '3mm', alignItems: 'flex-start'}}>
                  {/* QR CODE DE RASTREIO */}
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2mm'}}>
                    <QRCodeSVG 
                      value={`https://otica-melissa.vercel.app/cliente/login`} 
                      size={60} 
                    />
                    <p style={{fontSize: '4.5pt', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', margin: 0}}>Área do Cliente</p>
                  </div>

                  <div style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4mm', minWidth: '45mm'}}>
                    <p style={{fontSize: '6.5pt', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1mm'}}>Nº Atendimento</p>
                    <p style={{fontSize: '14pt', fontWeight: '900', color: '#0f172a', margin: '0 0 2mm'}}>#{printData.id ? printData.id.substring(0, 8).toUpperCase() : "—"}</p>
                    <table style={{fontSize: '7pt', borderCollapse: 'collapse', width: '100%'}}>
                      <thead><tr style={{backgroundColor: '#e2e8f0'}}><th style={{padding: '1mm 2mm', textAlign: 'left'}}>Item</th><th style={{padding: '1mm 2mm', textAlign: 'center'}}>Entrega</th></tr></thead>
                      <tbody>
                        {(printData.orders || []).map((o: any, i: number) => (
                          <tr key={i} style={{borderBottom: '1px solid #f1f5f9'}}>
                            <td style={{padding: '1mm 2mm', fontWeight: '600'}}>{o.serviceType}</td>
                            <td style={{padding: '1mm 2mm', textAlign: 'center', fontWeight: '700'}}>{(() => {
                              if (!o.dueDate) return "Retirada";
                              if (o.dueDate.includes("/")) {
                                  const [d, m, y] = o.dueDate.split("/").map(Number);
                                  return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                              }
                              return new Date(o.dueDate).toLocaleDateString('pt-BR');
                            })()}</td>
                          </tr>
                        ))}
                        {(printData.orders || []).length === 0 && (
                          <tr>
                            <td colSpan={2} style={{padding: '2mm', textAlign: 'center', fontStyle: 'italic', color: '#94a3b8'}}>Consulta / Registro Clínico</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

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
