import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { 
  Search, Clock, Package, CheckCircle2, 
  Eye, Truck, Wrench, ShieldCheck, MapPin, 
  Calendar, ShoppingBag, CreditCard, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { addDoc } from "firebase/firestore";

const statusSteps = [
  { status: "Pendente", label: "Pedido Recebido", icon: Clock },
  { status: "Em Produção", label: "Em Laboratório", icon: Wrench },
  { status: "Qualidade", label: "Controle de Qualidade", icon: Eye },
  { status: "Pronto para Entrega", label: "Disponível para Retirada", icon: ShoppingBag },
  { status: "Entregue", label: "Entregue", icon: Truck },
];

const statusColors: Record<string, string> = {
  "Pendente": "bg-slate-100 text-slate-600",
  "Em Produção": "bg-amber-100 text-amber-700",
  "Qualidade": "bg-blue-100 text-blue-700",
  "Pronto para Entrega": "bg-emerald-100 text-emerald-700",
  "Entregue": "bg-emerald-600 text-white",
};

export default function Rastreio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  
  const [cpf, setCpf] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verifiedOrder, setVerifiedOrder] = React.useState<any>(null);
  const [clientName, setClientName] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [installments, setInstallments] = React.useState<any[]>([]);
  const [atendimentos, setAtendimentos] = React.useState<any[]>([]);
  const [selectedAtend, setSelectedAtend] = React.useState<any>(null);
  const [isApptOpen, setIsApptOpen] = React.useState(false);

  React.useEffect(() => {
    const session = localStorage.getItem("otica_client_session");
    if (!session) {
      navigate(`/cliente/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const { id, name } = JSON.parse(session);
    setClientId(id);
    setClientName(name);
    if (orderId) {
        fetchInitialData(id);
    }
  }, [navigate, orderId]);

  const fetchInitialData = async (cId: string) => {
    setIsVerifying(true);
    try {
        // Fetch specific order if ID in URL
        const orderDoc = await getDoc(doc(db, "orders", orderId!));
        if (orderDoc.exists()) {
            setVerifiedOrder({ id: orderId, ...orderDoc.data() });
        }

        // Fetch installments
        const qInst = query(collection(db, "installments"), where("clientId", "==", cId), orderBy("dueDate", "asc"));
        const instSnap = await getDocs(qInst);
        setInstallments(instSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch prescriptions
        const qAtend = query(collection(db, "atendimentos"), where("clientId", "==", cId), orderBy("createdAt", "desc"));
        const atendSnap = await getDocs(qAtend);
        setAtendimentos(atendSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
        console.error(e);
    } finally {
        setIsVerifying(false);
    }
  };

  const getWhatsAppLink = (message: string) => {
    const phone = "5511999999999"; 
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const period = formData.get("period") as string;

    try {
      await addDoc(collection(db, "appointments"), {
        clientId: clientId,
        clientName: clientName,
        date,
        period,
        status: "Pendente",
        createdAt: new Date().toISOString()
      });
      toast.success("Solicitação enviada! Entraremos em contato.");
      setIsApptOpen(false);
    } catch (err) {
      toast.error("Erro ao agendar.");
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Buscando seu pedido...</p>
        </div>
      </div>
    );
  }

  if (verifiedOrder) {
    const currentStatusIndex = statusSteps.findIndex(s => s.status === verifiedOrder.status);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="Ótica Melissa" className="h-12 mx-auto object-contain" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Acompanhe seu Pedido</h1>
            <p className="text-slate-500 text-sm">Olá, <span className="font-bold text-slate-900">{clientName}</span>! Veja como está o processo do seu óculos.</p>
          </div>

          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pedido</p>
                  <p className="text-xl font-black tracking-tight">#{verifiedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <Badge className={`rounded-full px-4 py-1 text-[10px] font-black uppercase ${statusColors[verifiedOrder.status]}`}>
                  {verifiedOrder.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-10">
              <div className="relative">
                <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100" />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                />
                <div className="relative flex justify-between">
                  {statusSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx <= currentStatusIndex;
                    const isActive = idx === currentStatusIndex;
                    return (
                      <div key={step.status} className="flex flex-col items-center gap-3 z-10 group">
                        <div className={`
                          h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500
                          ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border-2 border-slate-100 text-slate-300'}
                          ${isActive ? 'ring-4 ring-emerald-50' : ''}
                        `}>
                          <Icon className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-tight text-center max-w-[60px] md:max-w-none ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="h-px bg-slate-100 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itens do Pedido</p>
                      <p className="text-sm font-bold text-slate-900">{verifiedOrder.items}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previsão de Entrega</p>
                      <p className="text-sm font-black text-emerald-600">
                        {verifiedOrder.dueDate || "A confirmar"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                     <ShieldCheck className="h-4 w-4 text-emerald-500" />
                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Garantia Ótica Melissa</p>
                   </div>
                   <p className="text-[11px] text-slate-500 leading-relaxed">
                     Seu pedido está sendo processado com os mais altos padrões de precisão óptica. Avisaremos quando estiver pronto para retirada na loja.
                   </p>
                </div>
              </div>
              <div className="pt-4 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-400">
                     <MapPin className="h-3.5 w-3.5" />
                     <span className="text-[11px] font-bold uppercase tracking-wider">Loja Matriz - Ótica Melissa</span>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest border-slate-200"
                      onClick={() => window.location.reload()}
                    >
                      Atualizar Status
                    </Button>
                    <Button 
                      className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-200/50"
                      onClick={() => setIsApptOpen(true)}
                    >
                      Agendar Exame
                    </Button>
                  </div>
               </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-500" /> Meus Carnês
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   {installments.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold uppercase py-4 text-center">Nenhuma parcela em aberto.</p>
                   ) : (
                      installments.filter(i => i.status !== "Pago").slice(0, 3).map(inst => (
                         <div key={inst.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 transition-colors">
                            <div>
                               <p className="text-sm font-black text-slate-900">R$ {inst.value.toFixed(2)}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Parc. {inst.number} • Vence {inst.dueDate}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[9px] font-black uppercase text-emerald-600" onClick={() => window.open(getWhatsAppLink(`Olá! Quero pagar minha parcela de R$ ${inst.value.toFixed(2)} do pedido #${verifiedOrder.id.substring(0,8).toUpperCase()}`), '_blank')}>
                               PIX
                            </Button>
                         </div>
                      ))
                   )}
                </CardContent>
             </Card>
             <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" /> Minhas Receitas
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   {atendimentos.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold uppercase py-4 text-center">Nenhum histórico médico.</p>
                   ) : (
                      atendimentos.slice(0, 3).map(atend => (
                         <div key={atend.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-colors">
                            <div>
                               <p className="text-sm font-black text-slate-900">Consulta {atend.date}</p>
                               <p className="text-[10px] font-bold text-slate-500 truncate max-w-[120px] uppercase">Rx: {atend.prescription ? atend.prescription.slice(0,15)+'...' : "Ver detalhes"}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-[9px] font-black uppercase text-blue-600" onClick={() => setSelectedAtend(atend)}>
                               VER
                            </Button>
                         </div>
                      ))
                   )}
                </CardContent>
             </Card>
          </div>
          <Dialog open={!!selectedAtend} onOpenChange={() => setSelectedAtend(null)}>
            <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="bg-slate-900 text-white p-8">
                <DialogTitle className="flex items-center gap-3 italic font-black text-xl">
                  <Eye className="h-6 w-6 text-emerald-400" /> Detalhes da Receita
                </DialogTitle>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Consulta em {selectedAtend?.date}</p>
              </DialogHeader>
              <div className="p-8 space-y-6 bg-white">
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prescrição (Grau)</Label>
                     <p className="text-sm font-bold text-slate-900 mt-2 leading-relaxed">
                        {selectedAtend?.prescription || "Nenhum detalhe de grau registrado."}
                     </p>
                  </div>
                  <Button className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest h-12" onClick={() => window.open(getWhatsAppLink(`Olá! Tenho uma dúvida sobre minha receita do dia ${selectedAtend?.date}.`), '_blank')}>
                    Tirar Dúvidas no WhatsApp
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isApptOpen} onOpenChange={setIsApptOpen}>
             <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="bg-emerald-600 text-white p-8">
                   <DialogTitle className="flex items-center gap-3 italic font-black text-xl">
                      <Calendar className="h-6 w-6" /> Agendar Exame
                   </DialogTitle>
                   <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-2">Escolha uma data e período</p>
                </DialogHeader>
                <form onSubmit={handleCreateAppointment}>
                   <div className="p-8 space-y-4 bg-white">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data</Label>
                        <input type="date" name="date" required className="w-full h-12 rounded-2xl bg-slate-50 border border-slate-100 px-4 font-bold text-slate-900 focus:ring-emerald-500 focus:ring-2 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Período</Label>
                        <select name="period" className="w-full h-12 rounded-2xl bg-slate-50 border border-slate-100 px-4 font-bold text-slate-900 focus:ring-emerald-500 focus:ring-2 outline-none">
                           <option value="Manhã">Manhã</option>
                           <option value="Tarde">Tarde</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest h-14 mt-4 shadow-xl shadow-emerald-200">
                         Solicitar Agendamento
                      </Button>
                   </div>
                </form>
             </DialogContent>
          </Dialog>
          <p className="text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            © 2024 Ótica Melissa • Qualidade em cada detalhe
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <img src="/logo.png" alt="Ótica Melissa" className="h-16 mx-auto object-contain" />
        <h1 className="text-2xl font-black text-slate-900 uppercase">Acesse via QR Code</h1>
        <p className="text-slate-500 text-sm">Por favor, utilize o QR Code do seu canhoto para acompanhar seu pedido em tempo real.</p>
        <Button onClick={() => navigate("/cliente/dashboard")} className="w-full h-14 bg-slate-900 rounded-2xl font-black uppercase tracking-widest text-white mt-4">
           Ir para Meus Pedidos
        </Button>
      </div>
    </div>
  );
}
